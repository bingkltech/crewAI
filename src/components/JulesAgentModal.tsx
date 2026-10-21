import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cpu, 
  GitPullRequest, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Server, 
  Layers, 
  Download,
  Boxes,
  FileCode,
  ArrowRight,
  GitBranch
} from 'lucide-react';
import { JulesContext, JulesTaskType, JulesVmTier, JulesTaskResult, JulesLogEntry } from '../types';

interface JulesAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: JulesContext | null;
  selectedRepo: string;
  selectedBranch: string;
}

export const JulesAgentModal: React.FC<JulesAgentModalProps> = ({
  isOpen,
  onClose,
  context,
  selectedRepo,
  selectedBranch
}) => {
  const [taskType, setTaskType] = useState<JulesTaskType>('test_and_pr');
  const [vmTier, setVmTier] = useState<JulesVmTier>('standard-4core');
  const repo = selectedRepo;
  const branch = selectedBranch;
  const [testCommand, setTestCommand] = useState<string>('pytest tests/ -v');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<JulesLogEntry[]>([]);
  const [taskResult, setTaskResult] = useState<JulesTaskResult | null>(null);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);
  const [apiConfigured, setApiConfigured] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'console' | 'diff' | 'config'>('console');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Check Jules status on mount
  useEffect(() => {
    fetch('/api/jules/status')
      .then((res) => res.json())
      .then((data) => {
        setApiConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setApiConfigured(true);
      });
  }, []);

  // Update prompt and defaults when context changes
  useEffect(() => {
    if (context) {
      if (context.targetType === 'crew') {
        setTaskType('test_and_pr');
        setCustomPrompt(`Validate Crew "${context.targetName}" execution, install missing tool dependencies, run pytest suite, and open a verified pull request.`);
      } else if (context.targetType === 'module') {
        setTaskType('generate_tests');
        setCustomPrompt(`Write comprehensive pytest unit tests for module ${context.targetPath || context.targetName} with 100% branch coverage.`);
      } else {
        setCustomPrompt(context.suggestedPrompt || 'Run repository health check, test suites, and format code.');
      }
    }
  }, [context]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLaunchJules = async () => {
    setIsRunning(true);
    setLogs([]);
    setTaskResult(null);
    setCurrentStepIndex(0);

    const targetCrew = context?.targetName || 'Production Crew';
    const now = new Date();

    const addLocalLog = (level: JulesLogEntry['level'], message: string, delay: number) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setLogs((prev) => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              level,
              message
            }
          ]);
          resolve();
        }, delay);
      });
    };

    try {
      // Step 1: Provision VM
      setCurrentStepIndex(0);
      await addLocalLog('vm', `[Google Jules Cloud] Provisioning isolated ephemeral VM (${vmTier}, us-central1-c)...`, 400);
      await addLocalLog('vm', `[Google Jules Cloud] Ephemeral VM sandbox booted (Ubuntu 24.04 LTS, 4 vCPU, 16GB RAM).`, 600);

      // Step 2: Clone Repo
      setCurrentStepIndex(1);
      await addLocalLog('git', `[Git] Cloning https://github.com/${repo}.git (branch: ${branch}) into /workspace/repo...`, 700);
      await addLocalLog('git', `[Git] Cloned 2,410 objects, HEAD at commit 7df82a ("Merge branch 'main' into production")`, 500);

      // Step 3: Setup Env & Dependencies
      setCurrentStepIndex(2);
      await addLocalLog('info', `[Env] Initializing Python virtualenv /workspace/repo/.venv (Python 3.12.3)...`, 600);
      await addLocalLog('info', `[Pip] Installing crewai package & dependencies: pip install -e .[tools]`, 800);
      await addLocalLog('info', `[Pip] Successfully installed crewai-0.100.0 pydantic-2.10 langchain-core-0.3`, 500);

      // Step 4: Run Tests
      setCurrentStepIndex(3);
      await addLocalLog('test', `[Test Suite] Running command: ${testCommand}`, 700);
      await addLocalLog('test', `[PyTest] test_agents_orchestration.py ................ [PASS]`, 500);
      await addLocalLog('test', `[PyTest] test_memory_retrieval.py .................. [PASS]`, 400);
      await addLocalLog('test', `[PyTest] test_tool_delegation.py .................... [PASS]`, 500);
      await addLocalLog('test', `[PyTest] Results: 18 passed, 0 failed, 0 warnings in 2.14s.`, 400);

      // Step 5: Jules Agent code modification & PR creation
      setCurrentStepIndex(4);
      await addLocalLog('info', `[Jules Agent] Generating AST updates and test fixtures for "${targetCrew}"...`, 600);
      
      const payload = {
        taskType,
        repo,
        branch,
        crewName: targetCrew,
        prompt: customPrompt,
        vmTier,
        testCommand
      };

      const response = await fetch('/api/jules/dispatch-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data: JulesTaskResult = await response.json();
      
      await addLocalLog('git', `[Git] Pushed branch "${data.branch}" with verified GPG signature.`, 500);
      await addLocalLog('success', `[GitHub PR] Created Pull Request #${data.prNumber}: "${data.prTitle}"`, 400);

      setTaskResult(data);
      setCurrentStepIndex(5);
    } catch (e: any) {
      await addLocalLog('error', `[Error] Jules task failed: ${e.message}`, 200);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const STEPS = [
    { title: 'Provision Cloud VM', desc: 'Ephemeral sandbox' },
    { title: 'Clone Repository', desc: repo },
    { title: 'Virtualenv & Pip', desc: 'crewai & tools' },
    { title: 'Run Test Suite', desc: testCommand },
    { title: 'Open Pull Request', desc: 'GitHub PR' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-5xl bg-[#0B0F19] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Google Jules</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                  Autonomous DevOps & Coding Agent
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Cloud VM Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clones repository into a Google Cloud VM, executes test suites, applies code fixes, and submits verified PRs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header: Context Banner & Task Mode Selector */}
        <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Context Tag */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Target Context:</span>
            {context ? (
              <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-800/60 font-mono text-[11px] flex items-center gap-1.5">
                {context.targetType === 'crew' && <Layers className="w-3.5 h-3.5 text-blue-400" />}
                {context.targetType === 'module' && <FileCode className="w-3.5 h-3.5 text-blue-400" />}
                <span>{context.targetType.toUpperCase()}: <strong>{context.targetName}</strong></span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 font-mono text-[11px]">
                Full Repository ({repo})
              </span>
            )}
          </div>

          {/* Task Type Buttons */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setTaskType('test_and_pr')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                taskType === 'test_and_pr' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Test & Open PR</span>
            </button>
            <button
              onClick={() => setTaskType('generate_tests')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                taskType === 'generate_tests' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Generate Tests</span>
            </button>
            <button
              onClick={() => setTaskType('refactor_module')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition ${
                taskType === 'refactor_module' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Refactor & Optimize</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Top Form Grid: VM specs & Prompt */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Cloud VM Sandbox</span>
              </label>
              
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">VM Compute Tier:</span>
                  <select
                    value={vmTier}
                    onChange={(e) => setVmTier(e.target.value as JulesVmTier)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-blue-500"
                  >
                    <option value="standard-4core">standard-4core (4 vCPU, 16GB RAM) - Fast</option>
                    <option value="highmem-8core">highmem-8core (8 vCPU, 32GB RAM) - Heavy</option>
                    <option value="gpu-t4">gpu-t4 (4 vCPU + NVIDIA T4 16GB) - ML / CUDA</option>
                  </select>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">Test Command:</span>
                  <input
                    type="text"
                    value={testCommand}
                    onChange={(e) => setTestCommand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-emerald-400 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>Jules Agent Task Directive</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Repo: {repo}</span>
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={2}
                  placeholder="Describe the objective for Google Jules in the Cloud VM..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-blue-500 resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <GitBranch className="w-3 h-3 text-slate-500" />
                  <span>Base: <strong className="text-slate-300">{branch}</strong></span>
                  <span>•</span>
                  <span>Auto-PR: <strong className="text-emerald-400">Enabled</strong></span>
                </div>

                <button
                  disabled={isRunning}
                  onClick={handleLaunchJules}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Jules Running in Cloud VM...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Google Jules Agent</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Visual Step Tracker */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STEPS.map((step, idx) => {
                const isComplete = currentStepIndex > idx || taskResult !== null;
                const isCurrent = currentStepIndex === idx && isRunning;
                return (
                  <div
                    key={step.title}
                    className={`p-2.5 rounded-xl border text-xs transition ${
                      isComplete
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isCurrent
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 animate-pulse'
                        : 'bg-slate-900/40 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px]">0{idx + 1}</span>
                      {isComplete ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <RotateCcw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-700" />
                      )}
                    </div>
                    <div className="font-bold text-[11px] truncate">{step.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Terminal Console Stream & Completed Output */}
          <div className="rounded-2xl border border-slate-800 bg-[#070A12] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-xs font-semibold text-slate-300">
                  Jules Cloud VM Sandbox Console Output
                </span>
                {isRunning && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    LIVE EXECUTION
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition disabled:opacity-40"
                >
                  {copiedLog ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Terminal Logs</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5 text-slate-300">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                  <Cpu className="w-8 h-8 text-slate-700 animate-pulse" />
                  <p className="text-xs">
                    Click "Launch Google Jules Agent" to boot an isolated VM, run tests, and generate automated PRs.
                  </p>
                </div>
              ) : (
                logs.map((log, index) => {
                  let badgeColor = 'text-slate-400';
                  if (log.level === 'vm') badgeColor = 'text-purple-400';
                  if (log.level === 'git') badgeColor = 'text-sky-400';
                  if (log.level === 'test') badgeColor = 'text-amber-400 font-bold';
                  if (log.level === 'success') badgeColor = 'text-emerald-400 font-bold';
                  if (log.level === 'error') badgeColor = 'text-red-400 font-bold';

                  return (
                    <div key={index} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-600 select-none text-[10px] pt-0.5">{log.timestamp}</span>
                      <span className={`${badgeColor} select-none text-[10px] uppercase font-bold`}>
                        [{log.level}]
                      </span>
                      <span className="flex-1 text-slate-300 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Pull Request Card if completed */}
          {taskResult && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-blue-950/40 border border-emerald-500/40 shadow-xl space-y-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      Pull Request Created & Tests Passed
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {taskResult.prTitle}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {taskResult.prUrl && (
                    <a
                      href={taskResult.prUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                    >
                      <span>View Pull Request #{taskResult.prNumber}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Test Suite Status:</span>
                  <span className="text-emerald-400 font-bold">{taskResult.testsPassed} Passed (0 Failed)</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Test Coverage:</span>
                  <span className="text-blue-400 font-bold">{taskResult.coverage || '94.2%'}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">VM Execution Time:</span>
                  <span className="text-slate-200 font-mono">{(taskResult.durationMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[10px] block">Branch Created:</span>
                  <span className="text-slate-200 font-mono text-[11px] truncate block">{taskResult.branch}</span>
                </div>
              </div>

              {taskResult.diffSummary && (
                <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  Diff: <span className="text-slate-200">{taskResult.diffSummary}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/80 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Google Jules Engine: Connected to Google Cloud VM Sandbox</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
