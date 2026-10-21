import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  UploadCloud, 
  DownloadCloud, 
  Check, 
  Copy, 
  ExternalLink, 
  Folder, 
  FileText, 
  RefreshCw, 
  Lock, 
  Key, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Code2, 
  ArrowRight,
  ShieldCheck,
  Send,
  Plus
} from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  total_private_repos?: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  default_branch: string;
  description: string;
  updated_at: string;
}

interface GitCommitItem {
  sha: string;
  message: string;
  author: string;
  date: string;
  html_url: string;
}

interface RemoteFileItem {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

interface GitHubHubProps {
  selectedRepo: string;
  onRepoChange: (repo: string) => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
}

export const GitHubHub: React.FC<GitHubHubProps> = ({
  selectedRepo,
  onRepoChange,
  selectedBranch,
  onBranchChange
}) => {
  const [token, setToken] = useState<string>(() => localStorage.getItem('crewai_github_token') || '');
  const [tokenInput, setTokenInput] = useState<string>('');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<{name: string}[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingBranches, setIsFetchingBranches] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  // Pull State
  const [remoteFiles, setRemoteFiles] = useState<RemoteFileItem[]>([]);
  const [recentCommits, setRecentCommits] = useState<GitCommitItem[]>([]);
  const [selectedRemoteFile, setSelectedRemoteFile] = useState<string | null>(null);
  const [remoteFileContent, setRemoteFileContent] = useState<string | null>(null);

  // Push State
  const [pushFilePath, setPushFilePath] = useState<string>('crews/content_crew/crew.jsonc');
  const [pushCommitMessage, setPushCommitMessage] = useState<string>('feat: update CrewAI agent orchestration pipeline');
  const [pushFileContent, setPushFileContent] = useState<string>(`{
  "name": "Production Research Crew",
  "process": "sequential",
  "agents": ["researcher", "writer"],
  "tasks": [
    {
      "name": "market_scan",
      "description": "Gather live multi-agent intelligence from GitHub and web",
      "agent": "researcher"
    }
  ]
}`);
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);

  // Sync Activity Logs
  const [syncLogs, setSyncLogs] = useState<string[]>([
    '[System] GitHub Sync Hub loaded.',
    '[System] Repository target default: bingkltech/crewAI.'
  ]);

  const addLog = (msg: string) => {
    setSyncLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Listen for OAuth Popup PostMessage (oauth-integration skill)
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }

      if (event.data?.type === 'GITHUB_AUTH_SUCCESS') {
        const code = event.data.code;
        if (code) {
          addLog('Received authorization code from GitHub OAuth popup. Exchanging for token...');
          try {
            const res = await fetch('/api/auth/github/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (data.access_token) {
              setToken(data.access_token);
              localStorage.setItem('crewai_github_token', data.access_token);
              addLog('GitHub OAuth access token received and stored securely.');
              verifyAndFetchUser(data.access_token);
            } else {
              throw new Error(data.error || 'Failed to exchange token');
            }
          } catch (e: any) {
            setStatusMessage({ type: 'error', text: e.message });
            addLog(`OAuth error: ${e.message}`);
          }
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // On mount, if no local token, try auto-connecting via server-side token
  useEffect(() => {
    if (!token) {
      autoConnectServerSide();
    } else {
      verifyAndFetchUser(token);
    }
  }, []);

  const autoConnectServerSide = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/github/user');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        if (userData.isServerSide) {
          addLog(`Automatically connected using server-side PAT from .env (@${userData.login})`);
          setStatusMessage({ type: 'success', text: `Auto-connected via server-side token as @${userData.login}` });
        }
        
        // Fetch user repos using the server proxy
        const reposRes = await fetch('/api/github/repos');
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          setRepos(reposData);
        }
      }
    } catch (e) {
      // Ignore silent failures on auto-connect
    } finally {
      setIsLoading(false);
    }
  };

  // Verify token & fetch user profile
  const verifyAndFetchUser = async (authToken: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const userRes = await fetch('/api/github/user', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });

      if (!userRes.ok) {
        throw new Error(`GitHub token verification failed (${userRes.status})`);
      }

      const userData = await userRes.json();
      setUser(userData);
      addLog(`Authenticated as GitHub user: @${userData.login} (${userData.name || 'Developer'})`);

      // Fetch user repos via proxy
      const reposRes = await fetch('/api/github/repos', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepos(reposData);
        if (reposData.length > 0 && !selectedRepo) {
          const firstRepo = reposData[0].full_name;
          onRepoChange(firstRepo);
          localStorage.setItem('crewai_selected_repo', firstRepo);
        }
      }

      setStatusMessage({ type: 'success', text: `Connected to GitHub as @${userData.login}` });
    } catch (e: any) {
      setUser(null);
      setStatusMessage({ type: 'error', text: e.message });
      addLog(`Verification error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Launch OAuth Popup
  const handleConnectOAuth = async () => {
    try {
      addLog('Initiating GitHub OAuth Authorization flow...');
      const res = await fetch('/api/auth/github/url');
      const data = await res.json();

      if (!data.configured) {
        setStatusMessage({
          type: 'info',
          text: 'GitHub OAuth Client ID not yet set in .env. You can connect instantly below using your GitHub Personal Access Token (PAT).'
        });
        return;
      }

      const authWindow = window.open(
        data.url,
        'github_oauth_popup',
        'width=600,height=720,menubar=no,status=no'
      );

      if (!authWindow) {
        setStatusMessage({
          type: 'error',
          text: 'Popup was blocked by your browser. Please allow popups for this applet to connect GitHub.'
        });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'Failed to open GitHub OAuth' });
    }
  };

  // Connect via Personal Access Token
  const handleConnectPAT = () => {
    if (!tokenInput.trim()) return;
    const cleanToken = tokenInput.trim();
    setToken(cleanToken);
    localStorage.setItem('crewai_github_token', cleanToken);
    verifyAndFetchUser(cleanToken);
  };

  const handleDisconnect = () => {
    setToken('');
    setUser(null);
    setRepos([]);
    setBranches([]);
    localStorage.removeItem('crewai_github_token');
    addLog('Disconnected from GitHub.');
    setStatusMessage({ type: 'info', text: 'Disconnected from GitHub.' });
  };

  // Fetch branches for selected repo
  useEffect(() => {
    if (selectedRepo && (user || token)) {
      fetchBranches(selectedRepo);
    }
  }, [selectedRepo, user, token]);

  const fetchBranches = async (repoFullName: string) => {
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) return;

    setIsFetchingBranches(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/github/branches?owner=${owner}&repo=${repo}`, {
        headers
      });
      
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
        // If current selected branch isn't in the new branches list, pick default
        const branchNames = data.map((b: any) => b.name);
        if (!branchNames.includes(selectedBranch)) {
          const defaultBranch = data.find((b: any) => b.name === 'main' || b.name === 'master')?.name || branchNames[0] || 'main';
          onBranchChange(defaultBranch);
        }
      }
    } catch (e) {
      addLog(`Error fetching branches for ${repoFullName}`);
    } finally {
      setIsFetchingBranches(false);
    }
  };

  const handleRepoChange = (newRepo: string) => {
    onRepoChange(newRepo);
  };

  const handleBranchChange = (newBranch: string) => {
    onBranchChange(newBranch);
  };

  // 1. PULL REPO DATA (Files & Commits)
  const handlePullRepo = async () => {
    if (!selectedRepo) return;
    setIsLoading(true);
    addLog(`[GIT PULL] Fetching repository tree and commit history from https://github.com/${selectedRepo} (branch: ${selectedBranch})...`);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Pull Commits
      const commitsRes = await fetch(`https://api.github.com/repos/${selectedRepo}/commits?sha=${selectedBranch}&per_page=8`, {
        headers
      });

      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        const formattedCommits: GitCommitItem[] = commitsData.map((c: any) => ({
          sha: c.sha.substring(0, 7),
          message: c.commit.message.split('\n')[0],
          author: c.commit.author.name,
          date: new Date(c.commit.author.date).toLocaleDateString(),
          html_url: c.html_url
        }));
        setRecentCommits(formattedCommits);
        addLog(`[GIT PULL] Pulled ${formattedCommits.length} latest commits.`);
      }

      // Pull Git Tree
      const treeRes = await fetch(`https://api.github.com/repos/${selectedRepo}/git/trees/${selectedBranch}?recursive=1`, {
        headers
      });

      if (treeRes.ok) {
        const treeData = await treeRes.json();
        const files: RemoteFileItem[] = (treeData.tree || []).slice(0, 50).map((item: any) => ({
          path: item.path,
          type: item.type === 'blob' ? 'blob' : 'tree',
          size: item.size,
          sha: item.sha
        }));
        setRemoteFiles(files);
        addLog(`[GIT PULL] Pulled ${files.length} repository files & directory objects.`);
        setStatusMessage({ type: 'success', text: `Successfully pulled ${selectedRepo}@${selectedBranch}` });
      } else {
        throw new Error(`Failed to pull tree (${treeRes.status})`);
      }
    } catch (e: any) {
      addLog(`[GIT PULL ERROR] ${e.message}`);
      setStatusMessage({ type: 'error', text: `Pull error: ${e.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  // View a remote file
  const handleFetchFileContent = async (filePath: string) => {
    setSelectedRemoteFile(filePath);
    setRemoteFileContent('Fetching remote content...');
    try {
      const headers: Record<string, string> = { 'Accept': 'application/vnd.github.raw' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`https://api.github.com/repos/${selectedRepo}/contents/${filePath}?ref=${selectedBranch}`, {
        headers
      });
      if (res.ok) {
        const text = await res.text();
        setRemoteFileContent(text);
        addLog(`[GIT PULL] Loaded content of ${filePath} (${text.length} chars).`);
      } else {
        setRemoteFileContent(`Error loading file: HTTP ${res.status}`);
      }
    } catch (e: any) {
      setRemoteFileContent(`Failed to fetch file: ${e.message}`);
    }
  };

  // 2. PUSH / COMMIT TO GITHUB
  const handlePushCommit = async () => {
    if (!token) {
      setStatusMessage({ type: 'error', text: 'You must be connected with a GitHub token to push code.' });
      return;
    }
    if (!selectedRepo || !pushFilePath.trim() || !pushFileContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in repository, file path, and code content.' });
      return;
    }

    setIsPushing(true);
    addLog(`[GIT PUSH] Initiating commit to ${selectedRepo}/${pushFilePath} on branch ${selectedBranch}...`);

    try {
      // First check if the file already exists on remote to get its current SHA
      let currentSha: string | undefined = undefined;
      try {
        const checkRes = await fetch(`https://api.github.com/repos/${selectedRepo}/contents/${pushFilePath}?ref=${selectedBranch}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json'
          }
        });
        if (checkRes.ok) {
          const fileData = await checkRes.json();
          currentSha = fileData.sha;
          addLog(`[GIT PUSH] Target file exists on remote (SHA: ${currentSha?.substring(0, 7)}). Performing fast-forward update.`);
        }
      } catch {
        // file doesn't exist yet, creating new
      }

      // Execute push via backend proxy or direct API
      const res = await fetch('/api/github/push-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          owner: selectedRepo.split('/')[0],
          repo: selectedRepo.split('/')[1],
          path: pushFilePath,
          content: pushFileContent,
          message: pushCommitMessage,
          branch: selectedBranch,
          sha: currentSha
        })
      });

      const pushResult = await res.json();

      if (!res.ok) {
        throw new Error(pushResult.error || 'Failed to push commit');
      }

      const commitSha = pushResult.commit?.sha?.substring(0, 7) || 'latest';
      const commitUrl = pushResult.commit?.html_url || `https://github.com/${selectedRepo}/commits/${selectedBranch}`;
      setLastCommitUrl(commitUrl);

      addLog(`[GIT PUSH SUCCESS] Commit ${commitSha} created successfully! Link: ${commitUrl}`);
      setStatusMessage({ type: 'success', text: `Committed ${pushFilePath} to ${selectedRepo}@${selectedBranch} (Commit ${commitSha})` });

      // Refresh recent commits
      handlePullRepo();
    } catch (e: any) {
      addLog(`[GIT PUSH ERROR] ${e.message}`);
      setStatusMessage({ type: 'error', text: `Push failed: ${e.message}` });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-slate-800 text-white border border-slate-700">
              <GitBranch className="w-5 h-5 text-[#EB6658]" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              GitHub Repository & Code Sync Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete GitHub integration: Authenticate, Pull remote files & commits, and Push code changes directly from CrewAI Studio.
          </p>
        </div>

        {/* User Badge if connected */}
        {user ? (
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-xl">
            <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full border border-slate-700" />
            <div className="text-left text-xs">
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>@{user.login}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <span className="text-[10px] text-slate-400">{user.public_repos} public repositories</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-slate-400 hover:text-red-400 ml-2 px-2 py-1 rounded hover:bg-slate-800 transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20 font-medium">
              Not Connected
            </span>
          </div>
        )}
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {lastCommitUrl && statusMessage.type === 'success' && (
            <a
              href={lastCommitUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 underline text-xs font-semibold ml-2"
            >
              <span>View Commit on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Auth Connection & Guide */}
      {!user && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Connection Methods */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[#EB6658]" />
              <h3 className="text-sm font-bold text-white">Connect GitHub Account</h3>
            </div>
            <p className="text-xs text-slate-400">
              Authenticate to read, clone, pull, and commit directly to your private or public repositories.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Method A: OAuth Popup */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#EB6658]/10 text-[#EB6658] font-bold">
                    Recommended
                  </span>
                  <h4 className="text-xs font-bold text-white mt-2">Sign in with GitHub OAuth</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Opens a secure authorization popup directly on github.com (handles cross-origin postMessage).
                  </p>
                </div>
                <button
                  onClick={handleConnectOAuth}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 border border-slate-700"
                >
                  <GitBranch className="w-3.5 h-3.5 text-[#EB6658]" />
                  <span>Connect via OAuth Popup</span>
                </button>
              </div>

              {/* Method B: Personal Access Token (PAT) */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    Instant Access
                  </span>
                  <h4 className="text-xs font-bold text-white mt-2">Personal Access Token (PAT)</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Enter a GitHub Token (Classic or Fine-Grained) with <code className="text-[#EB6658]">repo</code> scope for immediate connection.
                  </p>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 mt-2 font-mono outline-none focus:border-[#EB6658]"
                  />
                </div>
                <button
                  onClick={handleConnectPAT}
                  className="w-full py-2 bg-[#EB6658] hover:bg-[#C94C3C] text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticate Token</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Step-by-Step Guide */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-[#EB6658]/5 border border-[#EB6658]/20 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EB6658]" />
              <h3 className="text-sm font-bold text-white">GitHub Connection Guide</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EB6658] text-white text-[10px]">1</span>
                  <span>Generate a GitHub PAT (Personal Access Token)</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-[#EB6658] hover:underline">Settings &gt; Developer Settings &gt; Personal Access Tokens</a>. 
                  Generate a new token with <code className="text-[#EB6658]">repo</code> scope.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EB6658] text-white text-[10px]">2</span>
                  <span>Paste Token in "Method B"</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Input your <code className="text-slate-300">ghp_...</code> token into the PAT field on the left and click <strong>Authenticate Token</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EB6658] text-white text-[10px]">3</span>
                  <span>Sync Your First Repository</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Once connected, select a repository from your list or type one manually (e.g., <code className="text-slate-300">username/repo</code>) and click <strong>Git Pull</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>Security & Persistence</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tokens are stored in your browser's <code className="text-slate-400">localStorage</code>. 
                  We never store your keys on our servers unless you configure OAuth environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repository & Branch Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="min-w-[200px]">
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Target Repository</label>
            <div className="relative">
              {repos.length > 0 ? (
                <select
                  value={selectedRepo}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none font-mono focus:border-[#EB6658] appearance-none"
                >
                  <option value="bingkltech/crewAI">bingkltech/crewAI (Default)</option>
                  {repos.map((r) => (
                    <option key={r.id} value={r.full_name}>
                      {r.full_name} {r.private ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedRepo}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  placeholder="owner/repository"
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 px-3 py-1.5 rounded-lg outline-none font-mono focus:border-[#EB6658]"
                />
              )}
            </div>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-[11px] text-slate-400 font-medium mb-1">Branch</label>
            <div className="flex items-center gap-1.5">
              <div className="relative w-full">
                {branches.length > 0 ? (
                  <select
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    disabled={isFetchingBranches}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg outline-none font-mono focus:border-[#EB6658] appearance-none disabled:opacity-50"
                  >
                    {branches.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedBranch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    placeholder="main"
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg outline-none font-mono focus:border-[#EB6658]"
                  />
                )}
                <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {isFetchingBranches && (
                  <RefreshCw className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={isLoading}
            onClick={handlePullRepo}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-2 border border-slate-700"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />
            <span>{isLoading ? 'Pulling...' : 'Git Pull'}</span>
          </button>

          <a
            href={`https://github.com/${selectedRepo}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-medium transition flex items-center gap-1 border border-slate-800"
          >
            <span>Open in GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Pull & Files Left (6 cols), Push & Commits Right (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Remote Files & Pull Inspector (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DownloadCloud className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Pulled Remote Files</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {remoteFiles.length > 0 ? `${remoteFiles.length} files` : 'Click "Git Pull" to load'}
              </span>
            </div>

            {remoteFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
                <Folder className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p>No remote repository tree loaded yet.</p>
                <button
                  onClick={handlePullRepo}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  Pull {selectedRepo}
                </button>
              </div>
            ) : (
              <div className="h-64 overflow-y-auto rounded-xl bg-[#080C14] border border-slate-800 p-2 space-y-1 font-mono text-xs">
                {remoteFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => handleFetchFileContent(file.path)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                      selectedRemoteFile === file.path
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {file.type === 'tree' ? (
                        <Folder className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className="truncate">{file.path}</span>
                    </div>
                    {file.size && (
                      <span className="text-[10px] text-slate-500">
                        {Math.round(file.size / 1024)} KB
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Remote File Content Preview */}
            {selectedRemoteFile && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 truncate">Preview: {selectedRemoteFile}</span>
                  <button
                    onClick={() => {
                      if (remoteFileContent) {
                        setPushFileContent(remoteFileContent);
                        setPushFilePath(selectedRemoteFile);
                        addLog(`Loaded ${selectedRemoteFile} into Push Editor.`);
                      }
                    }}
                    className="text-[11px] text-[#EB6658] hover:underline font-semibold"
                  >
                    Load into Push Editor
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#080C14] border border-slate-800 text-[11px] font-mono text-slate-300 h-44 overflow-y-auto leading-relaxed">
                  <code>{remoteFileContent}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Recent Commits from GitHub */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Recent GitHub Commits</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{recentCommits.length} commits</span>
            </div>

            {recentCommits.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Pull repository to view latest commit history.
              </div>
            ) : (
              <div className="space-y-2">
                {recentCommits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="font-semibold text-slate-200 truncate">{commit.message}</div>
                      <div className="text-[10px] text-slate-500">
                        {commit.author} • {commit.date}
                      </div>
                    </div>
                    <a
                      href={commit.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[10px] px-2 py-1 rounded bg-slate-900 text-[#EB6658] border border-[#EB6658]/30 hover:bg-slate-800 transition"
                    >
                      {commit.sha}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Git Push & Commit Studio (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Git Push / Commit to GitHub</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Direct GitHub Contents API
              </span>
            </div>

            {/* Target File Path */}
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Target File Path in Repo</label>
              <input
                type="text"
                value={pushFilePath}
                onChange={(e) => setPushFilePath(e.target.value)}
                placeholder="e.g., crews/content_crew/crew.jsonc or crew.py"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono outline-none focus:border-[#EB6658]"
              />
            </div>

            {/* Commit Message */}
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">Commit Message</label>
              <input
                type="text"
                value={pushCommitMessage}
                onChange={(e) => setPushCommitMessage(e.target.value)}
                placeholder="e.g., feat(agents): add autonomous research agent"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#EB6658]"
              />
            </div>

            {/* Code Content */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
                <span>File Content to Commit</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPushFilePath('crew.py');
                      setPushFileContent(`from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Senior AI Scout",
    goal="Discover breakthroughs in multi-agent collaboration",
    verbose=True
)

task = Task(
    description="Analyze GitHub repos and write report",
    expected_output="Markdown brief",
    agent=researcher
)

crew = Crew(agents=[researcher], tasks=[task], process=Process.sequential)
crew.kickoff()`);
                      addLog('Loaded standalone Python template into Push Editor.');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white underline"
                  >
                    Template: crew.py
                  </button>
                </div>
              </div>
              <textarea
                rows={9}
                value={pushFileContent}
                onChange={(e) => setPushFileContent(e.target.value)}
                className="w-full bg-[#080C14] border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono outline-none focus:border-[#EB6658] resize-none leading-relaxed"
              />
            </div>

            {/* Push Button */}
            <button
              disabled={isPushing}
              onClick={handlePushCommit}
              className="w-full py-2.5 bg-gradient-to-r from-[#EB6658] to-[#C94C3C] disabled:opacity-50 text-white rounded-xl text-xs font-bold hover:shadow-lg hover:shadow-[#EB6658]/20 transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isPushing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pushing Commit to GitHub...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Commit & Push to {selectedRepo}</span>
                </>
              )}
            </button>
          </div>

          {/* Sync Audit Logs */}
          <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#EB6658]" />
              <span>Real-Time Git Sync Stream</span>
            </span>
            <div className="h-32 overflow-y-auto p-2.5 rounded-xl bg-[#080C14] border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
              {syncLogs.map((log, lIdx) => (
                <div
                  key={lIdx}
                  className={`leading-relaxed ${
                    log.includes('PUSH SUCCESS')
                      ? 'text-emerald-400 font-bold'
                      : log.includes('ERROR')
                      ? 'text-red-400 font-bold'
                      : log.includes('PULL')
                      ? 'text-sky-300'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
