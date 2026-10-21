import React, { useState } from 'react';
import { 
  GitMerge, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check, 
  Database, 
  History,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  GitFork
} from 'lucide-react';
import { GraphifyRepoVisualizer } from './GraphifyRepoVisualizer';

interface FlowStepDef {
  id: string;
  type: 'start' | 'listen' | 'router' | 'and_step';
  title: string;
  decorator: string;
  description: string;
  outputStateChange: Record<string, any>;
  nextNodes?: string[];
}

const DEMO_FLOW: FlowStepDef[] = [
  {
    id: 'step_strategy',
    type: 'start',
    title: 'define_strategy()',
    decorator: '@start()',
    description: 'Product Lead (Alex): Scans market trends and generates the Product Requirement Document (PRD) with user stories.',
    outputStateChange: {
      prd_status: 'drafted',
      user_stories_count: 12,
      target_tech_stack: 'React/Vite/Express',
      strategy_ready: true
    },
    nextNodes: ['step_architecture']
  },
  {
    id: 'step_architecture',
    type: 'router',
    title: 'architect_system()',
    decorator: '@router(define_strategy)',
    description: 'Senior Dev (Jordan): Designs the database schema, ERDs, and modular API route structure based on Alex\'s PRD.',
    outputStateChange: {
      schema_defined: true,
      api_routes_count: 8,
      frontend_components: ['Navbar', 'Dashboard', 'AuthGuard'],
      architecture_complete: true
    },
    nextNodes: ['step_security']
  },
  {
    id: 'step_security',
    type: 'listen',
    title: 'audit_security()',
    decorator: '@listen(architect_system)',
    description: 'Security Auditor (Sam): Performs threat modeling and configures the CI/CD pipeline and Docker environment.',
    outputStateChange: {
      vulnerabilities_checked: 0,
      docker_image_built: true,
      cicd_pipeline: 'GitHub Actions',
      security_verified: true
    },
    nextNodes: ['step_release']
  },
  {
    id: 'step_graphify',
    type: 'listen',
    title: 'sync_graphify_knowledge()',
    decorator: '@listen(audit_security)',
    description: 'Graphify Engine: Automatically updates the whole-repository knowledge graph with new modules, imports, and cross-file dependencies.',
    outputStateChange: {
      graphify_sync_status: 'synced',
      knowledge_graph_nodes: 16,
      entry_points_detected: ['main.tsx', 'server.ts'],
      last_architectural_audit: new Date().toISOString().split('T')[0]
    },
    nextNodes: ['step_release']
  },
  {
    id: 'step_release',
    type: 'listen',
    title: 'release_production()',
    decorator: '@listen(sync_graphify_knowledge)',
    description: 'Final Deployment: Orchestrates the production push to Google Cloud / Vercel with zero-downtime cutover.',
    outputStateChange: {
      deployment_url: 'https://ais-production-deploy-2026.run.app',
      uptime_sla: '99.9%',
      project_live: true
    }
  }
];

interface FlowVisualizerProps {
  onTaskJules?: (node: any) => void;
  selectedRepo: string;
  selectedBranch: string;
}

export const FlowVisualizer: React.FC<FlowVisualizerProps> = ({ 
  onTaskJules,
  selectedRepo,
  selectedBranch
}) => {
  const [activeView, setActiveView] = useState<'flow_dag' | 'graphify_repo'>('flow_dag');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [stateHistory, setStateHistory] = useState<Array<Record<string, any>>>([]);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Compute accumulated state up to currentStepIndex
  const currentMergedState = () => {
    let state: Record<string, any> = {
      project_name: selectedRepo.split('/')[1] || 'crewai_app',
      repository: selectedRepo,
      branch: selectedBranch,
      timestamp: new Date().toISOString()
    };
    for (let i = 0; i <= currentStepIndex; i++) {
      if (DEMO_FLOW[i]) {
        state = { ...state, ...DEMO_FLOW[i].outputStateChange };
      }
    }
    
    // Graphify Alignment: Add derived metadata if synced
    if (state.graphify_sync_status === 'synced') {
      state.graphify_context = {
        primary_layer: 'ui',
        active_modules: ['CrewStudio', 'FlowVisualizer', 'GraphifyRepo'],
        dependency_depth: 3
      };
    }
    
    return state;
  };

  const handleStepForward = () => {
    if (currentStepIndex < DEMO_FLOW.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      setStateHistory((prev) => [...prev, DEMO_FLOW[nextIdx].outputStateChange]);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
    setIsPlaying(false);
    setStateHistory([]);
  };

  const handleRunAll = async () => {
    setIsPlaying(true);
    for (let i = 0; i < DEMO_FLOW.length; i++) {
      setCurrentStepIndex(i);
      await new Promise((r) => setTimeout(r, 900));
    }
    setIsPlaying(false);
  };

  const flowPythonCode = `from crewai.flow.flow import Flow, start, listen, router
from pydantic import BaseModel

class AppState(BaseModel):
    project_name: str = "${selectedRepo.split('/')[1] || 'crewai_app'}"
    prd_status: str = "pending"
    architecture_complete: bool = False
    security_verified: bool = False
    project_live: bool = False

class FullStackFlow(Flow[AppState]):

    @start()
    def define_strategy(self):
        # Alex (Product Lead) generates the PRD
        print(f"Planning {self.state.project_name}...")
        self.state.prd_status = "drafted"
        return "strategy_complete"

    @router(define_strategy)
    def architect_system(self):
        # Jordan (Senior Dev) builds the schema
        self.state.architecture_complete = True
        return "architecture_verified"

    @listen("architecture_verified")
    def audit_security(self):
        # Sam (Security Auditor) verifies the stack
        self.state.security_verified = True
        return "audit_passed"

    @listen(audit_security)
    def release_production(self):
        # Final production handoff
        self.state.project_live = True
        print(f"Project {self.state.project_name} is LIVE!")

flow = FullStackFlow()
flow.kickoff()`;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 space-y-6">
      {/* Visualizer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EB6658]/10 text-[#EB6658] border border-[#EB6658]/30">
              {activeView === 'flow_dag' ? <GitMerge className="w-5 h-5" /> : <GitFork className="w-5 h-5" />}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {activeView === 'flow_dag'
                ? 'CrewAI Flow Visualizer & State Inspector'
                : 'Graphify: Whole Repository Architecture Diagram'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {activeView === 'flow_dag'
              ? 'Event-driven deterministic state machine visualizer featuring @start, @router, and @listen lifecycle nodes.'
              : 'Full codebase knowledge graph & dependency map inspired by Graphify (Graphify-Labs/graphify).'}
          </p>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
          <button
            onClick={() => setActiveView('flow_dag')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
              activeView === 'flow_dag'
                ? 'bg-[#EB6658] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>Workflow DAG</span>
          </button>

          <button
            onClick={() => setActiveView('graphify_repo')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition ${
              activeView === 'graphify_repo'
                ? 'bg-[#EB6658] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Graphify Repo Diagram</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
              Whole App
            </span>
          </button>
        </div>
      </div>

      {/* Conditionally Render Graphify View */}
      {activeView === 'graphify_repo' ? (
        <GraphifyRepoVisualizer 
          onTaskJules={onTaskJules} 
          selectedRepo={selectedRepo}
          selectedBranch={selectedBranch}
        />
      ) : (
        <>
          {/* Flow Controls Bar */}
          <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex-wrap gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span>Graph Lifecycle: <strong className="text-white">4 Steps</strong></span>
              <span>Active Step: <strong className="text-[#EB6658]">{currentStepIndex >= 0 ? DEMO_FLOW[currentStepIndex].title : 'Not Started'}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleStepForward}
                disabled={isPlaying || currentStepIndex >= DEMO_FLOW.length - 1}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRunAll}
                disabled={isPlaying}
                className="px-4 py-1.5 rounded-lg bg-[#EB6658] hover:bg-[#C94C3C] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPlaying ? 'Running Flow...' : 'Auto-Play Flow'}</span>
              </button>
            </div>
          </div>

      {/* Visual Graph & State Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Graph Diagram (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Graph Lifecycle: <strong>4 Steps</strong></span>
            <span>Active Step: <strong>{currentStepIndex >= 0 ? DEMO_FLOW[currentStepIndex].title : 'Not Started'}</strong></span>
          </div>

          <div className="space-y-4">
            {DEMO_FLOW.map((node, index) => {
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;

              return (
                <div key={node.id} className="relative">
                  {/* Connecting line */}
                  {index < DEMO_FLOW.length - 1 && (
                    <div
                      className={`absolute left-6 top-14 bottom-[-16px] w-0.5 transition-colors ${
                        isPast ? 'bg-[#EB6658]' : 'bg-slate-800'
                      }`}
                    />
                  )}

                  <div
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-slate-900/90 border-[#EB6658] shadow-lg shadow-[#EB6658]/10 ring-1 ring-[#EB6658]'
                        : isPast
                        ? 'bg-slate-900/40 border-emerald-500/40'
                        : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mt-0.5 shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#EB6658] text-white animate-pulse'
                            : isPast
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">{node.title}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#EB6658]/15 text-[#EB6658] border border-[#EB6658]/30 font-semibold">
                              {node.decorator}
                            </span>
                          </div>

                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {node.type}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">
                          {node.description}
                        </p>

                        {/* State Delta Box when active or past */}
                        {(isActive || isPast) && (
                          <div className="mt-2 p-2.5 rounded-lg bg-[#080C14] border border-slate-800 font-mono text-[11px] text-slate-300">
                            <span className="text-[10px] text-slate-500 block mb-1">State Mutation Delta:</span>
                            <pre className="text-emerald-400/90 whitespace-pre-wrap">
                              {JSON.stringify(node.outputStateChange, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* State Inspector & Python Script (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pydantic State Inspector */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Flow State (Durable Store)</h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Pydantic Serializable
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#080C14] p-3 overflow-hidden">
              <pre className="text-[11px] font-mono text-slate-200 h-64 overflow-y-auto leading-relaxed">
                <code>{JSON.stringify(currentMergedState(), null, 2)}</code>
              </pre>
            </div>
          </div>

          {/* Flow Code */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Flow Python Implementation</h3>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(flowPythonCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#080C14] p-3 overflow-hidden">
              <pre className="text-[11px] font-mono text-slate-300 h-64 overflow-y-auto leading-relaxed">
                <code>{flowPythonCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </>
  )}
</div>
  );
};
