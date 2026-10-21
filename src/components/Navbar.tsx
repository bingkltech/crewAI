import React from 'react';
import { DocTab, LanguageCode, VersionCode } from '../types';
import { 
  BookOpen, 
  Layers, 
  GitMerge, 
  Wrench, 
  Activity, 
  Search, 
  Terminal, 
  ExternalLink,
  ChevronDown,
  Globe,
  GitBranch,
  Cpu
} from 'lucide-react';

interface NavbarProps {
  currentTab: DocTab;
  onTabChange: (tab: DocTab) => void;
  onOpenSearch: () => void;
  onOpenAgentSetup: () => void;
  onOpenOllamaPool: () => void;
  onOpenJules?: () => void;
  onOpenDiagnostics?: () => void;
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  version: VersionCode;
  onVersionChange: (ver: VersionCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenSearch,
  onOpenAgentSetup,
  onOpenOllamaPool,
  onOpenJules,
  onOpenDiagnostics,
  language,
  onLanguageChange,
  version,
  onVersionChange,
}) => {
  const tabs = [
    { id: 'docs' as DocTab, label: 'Documentation', icon: BookOpen },
    { id: 'studio' as DocTab, label: 'Crew Studio', icon: Layers, badge: 'Interactive' },
    { id: 'flows' as DocTab, label: 'Flow & Graphify', icon: GitMerge, badge: 'Repo Graph' },
    { id: 'github' as DocTab, label: 'GitHub Hub', icon: GitBranch, badge: 'Pull/Push' },
    { id: 'tools' as DocTab, label: 'Tools Catalog', icon: Wrench, count: '18+' },
    { id: 'traces' as DocTab, label: 'Observability', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('docs')}
              className="flex items-center gap-2.5 text-left group transition"
            >
              <img
                src="/images/crew_only_logo.png"
                alt="CrewAI Logo"
                className="h-7 w-auto object-contain brightness-110"
                onError={(e) => {
                  // Fallback if image fails to render
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-[#EB6658] transition flex items-center gap-1.5">
                CrewAI
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EB6658]/15 text-[#EB6658] font-semibold border border-[#EB6658]/30">
                  {version}
                </span>
              </span>
            </button>

            {/* Version dropdown */}
            <div className="relative hidden md:block">
              <select
                aria-label="Select CrewAI version"
                value={version}
                onChange={(e) => onVersionChange(e.target.value as VersionCode)}
                className="bg-slate-900 text-xs text-slate-300 font-medium px-2.5 py-1 rounded-md border border-slate-800 hover:border-slate-700 cursor-pointer outline-none focus:border-[#EB6658]"
              >
                <option value="Edge">Edge (Latest)</option>
                <option value="v1.10.0">v1.10.0</option>
              </select>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#EB6658] text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#EB6658]/20 text-[#EB6658]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2.5">
            {/* Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition group"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#EB6658]" />
              <span className="hidden sm:inline">Search docs...</span>
              <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* Ollama Cloud Free Pool Button */}
            <button
              onClick={onOpenOllamaPool}
              title="Continuous Free Credit Flow & Ollama Multi-Node Failover"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Ollama Free Pool</span>
            </button>

            {/* Google Jules DevOps Agent Button */}
            {onOpenJules && (
              <button
                onClick={onOpenJules}
                title="Google Jules Autonomous DevOps & Coding Agent in Cloud VM Sandbox"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Google Jules</span>
              </button>
            )}

            {/* API Diagnostics Live Probes Button */}
            {onOpenDiagnostics && (
              <button
                onClick={onOpenDiagnostics}
                title="Test all APIs, check live latency & model availability"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">API Health</span>
              </button>
            )}

            {/* Coding Agent Skills Button */}
            <button
              onClick={onOpenAgentSetup}
              title="Copy Agent Skills Prompt for Claude Code, Cursor, Windsurf"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EB6658]/10 hover:bg-[#EB6658]/20 text-[#EB6658] border border-[#EB6658]/30 text-xs font-semibold transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agent Skills</span>
            </button>

            {/* Language Switcher */}
            <div className="relative">
              <select
                aria-label="Select interface language"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                className="bg-slate-900 text-xs text-slate-300 font-medium pl-6 pr-2 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer outline-none focus:border-[#EB6658] appearance-none"
              >
                <option value="en">EN</option>
                <option value="ar">AR (العربية)</option>
                <option value="ko">KO (한국어)</option>
                <option value="pt-BR">PT (Português)</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
            </div>

            {/* GitHub Repo */}
            <a
              href="https://github.com/crewAIInc/crewAI"
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="CrewAI on GitHub"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800 bg-slate-950/80 px-2 py-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap ${
                isActive ? 'text-[#EB6658] font-semibold bg-[#EB6658]/10' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
