import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AgentConfig, TaskConfig, CrewConfig, ExecutionLog, JulesContext, AuditCycleStage } from '../types';
import { TOOLS_CATALOG } from '../data/toolsCatalog';
import { 
  Play, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Layers, 
  GitBranch,
  UserPlus, 
  ListOrdered, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles, 
  Wrench, 
  ShieldAlert,
  ArrowRight,
  Laptop,
  Save,
  Download,
  Upload,
  AlertCircle,
  History,
  X,
  ChevronRight,
  Search,
  Filter,
  FileText,
  Activity,
  AlertTriangle,
  Zap,
  ShieldCheck,
  RefreshCw,
  Mail
} from 'lucide-react';
import { GmailWorkspacePanel } from './GmailWorkspacePanel';
import { AutonomyStrategyDashboard } from './AutonomyStrategyDashboard';
import { StructuredAuditLogPanel } from './StructuredAuditLogPanel';
import { AutonomousPRReviewModule } from './AutonomousPRReviewModule';
import { PredictiveSchedulerModule } from './PredictiveSchedulerModule';
import { PredictiveInsightsDashboard } from './PredictiveInsightsDashboard';
import { RepositoryHealthWidget } from './RepositoryHealthWidget';
import { WebhookSettingsPanel } from './WebhookSettingsPanel';
import { RemoteControlModule } from './RemoteControlModule';
import { 
  ProviderStatus, 
  ConfigStatus, 
  resolveAvailableModel, 
  MODEL_PROVIDER_MAP,
  GeminiBudgetStrategy,
  GeminiQuotaStatus,
  resolveSmartGeminiRoute,
  GEMINI_MODEL_TIERS
} from '../utils/modelAvailability';

const PRESET_CREWS: Record<string, CrewConfig> = {
  tech_research: {
    name: 'AI & Tech Research Crew',
    process: 'sequential',
    verbose: true,
    memory: true,
    agents: [
      {
        id: 'agent-1',
        name: 'Dr. Evelyn Vance',
        role: 'Senior Emerging Tech Researcher',
        goal: 'Uncover cutting-edge autonomous agent frameworks, state persistence methods, and benchmarks',
        backstory: 'Former principal scientist with 12 years analyzing distributed systems and machine learning runtime architecture.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['SerperDevTool', 'ScrapeWebsiteTool'],
        verbose: true,
        memory: true,
        maxIter: 10,
        allowDelegation: true
      },
      {
        id: 'agent-2',
        name: 'Marcus Sterling',
        role: 'Lead Technical Journalist & Synthesis Editor',
        goal: 'Synthesize research discoveries into a compelling, publication-ready executive technical brief',
        backstory: 'Veteran technology editor who has distilled thousands of complex whitepapers for engineering executives.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['FileWriteTool'],
        verbose: true,
        memory: true,
        maxIter: 8,
        allowDelegation: false
      }
    ],
    tasks: [
      {
        id: 'task-1',
        name: 'Research Breakthroughs',
        description: 'Search and analyze the latest multi-agent benchmarks, memory paradigms, and durable execution patterns in 2026.',
        expectedOutput: 'Detailed bulleted brief containing 3 key innovations, architectural diagrams overview, and cited sources.',
        agentId: 'agent-1',
        outputFormat: 'markdown'
      },
      {
        id: 'task-2',
        name: 'Draft Executive Brief',
        description: 'Using the research notes, craft an executive-ready report outlining architectural advantages and roadmap considerations.',
        expectedOutput: 'A polished Markdown report ready for engineering leadership with an Executive Summary, Technical Deep-Dive, and Recommendations.',
        agentId: 'agent-2',
        outputFormat: 'markdown'
      }
    ]
  },
  financial_audit: {
    name: 'FinTech Risk & Audit Crew',
    process: 'hierarchical',
    managerModel: 'gpt-4o',
    verbose: true,
    memory: true,
    agents: [
      {
        id: 'agent-fin-1',
        name: 'Sarah Chen, CFA',
        role: 'Quantitative Financial Analyst',
        goal: 'Extract 10-K financial ratios, operating margins, and balance sheet liabilities',
        backstory: 'Chartered Financial Analyst specializing in enterprise SaaS valuation and GAAP adjustments.',
        model: 'gpt-4o',
        tools: ['PDFSearchTool', 'CodeInterpreterTool'],
        verbose: true,
        memory: true,
        maxIter: 12,
        allowDelegation: true
      },
      {
        id: 'agent-fin-2',
        name: 'Jonathan Reynolds',
        role: 'Chief Compliance & Risk Officer',
        goal: 'Audit risk disclosures, regulatory exposure, and generate audit compliance scorecards',
        backstory: 'Former SEC regulatory counsel auditing risk frameworks for Fortune 500 corporations.',
        model: 'gpt-4o',
        tools: ['FileReadTool'],
        verbose: true,
        memory: true,
        maxIter: 8,
        allowDelegation: false
      }
    ],
    tasks: [
      {
        id: 'task-fin-1',
        name: 'Ratio Extraction & Trend Computation',
        description: 'Parse latest earnings statements, compute Rule of 40, Free Cash Flow conversion, and net burn rate.',
        expectedOutput: 'Structured JSON table of core financial indicators and comparative YoY ratios.',
        agentId: 'agent-fin-1',
        outputFormat: 'json'
      },
      {
        id: 'task-fin-2',
        name: 'Regulatory Risk Scorecard',
        description: 'Audit debt covenants and cross-border data compliance risks based on extracted financial data.',
        expectedOutput: 'Comprehensive risk matrix with traffic-light indicators (Green, Yellow, Red) and mitigation actions.',
        agentId: 'agent-fin-2',
        outputFormat: 'markdown'
      }
    ]
  },
  full_stack_app: {
    name: 'Full Stack App Development Crew',
    process: 'hierarchical',
    managerModel: 'gemini/gemini-3-flash-preview',
    verbose: true,
    memory: true,
    agents: [
      {
        id: 'agent-fs-1',
        name: 'Alex, Product Lead',
        role: 'Full Stack Product Strategy & UX Architect',
        goal: 'Define clear technical requirements, user stories, and UI/UX wireframe specifications',
        backstory: 'A veteran product manager with a background in interface design and rapid prototyping. Expert at converting vague ideas into actionable tech specs.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['SerperDevTool', 'ScrapeWebsiteTool'],
        verbose: true,
        memory: true,
        maxIter: 10,
        allowDelegation: true
      },
      {
        id: 'agent-fs-2',
        name: 'Jordan, Senior Dev',
        role: 'Senior Full Stack Engineer (React & TypeScript)',
        goal: 'Architect the database schema, API routes, and modular React component structure',
        backstory: 'A polyglot developer specializing in scalable distributed systems and modern frontend frameworks. Obsessed with clean code and type safety.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['CodeInterpreterTool', 'FileWriteTool'],
        verbose: true,
        memory: true,
        maxIter: 15,
        allowDelegation: true
      },
      {
        id: 'agent-fs-3',
        name: 'Sam, Security Auditor',
        role: 'Security & Cloud DevOps Auditor',
        goal: 'Perform threat modeling, audit code for vulnerabilities, and define the CI/CD deployment pipeline',
        backstory: 'Cybersecurity expert focused on DevSecOps. Spends time breaking applications to ensure they are built with "secure-by-design" principles.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['SerperDevTool'],
        verbose: true,
        memory: true,
        maxIter: 8,
        allowDelegation: false
      }
    ],
    tasks: [
      {
        id: 'task-fs-1',
        name: 'Requirements & Design Brief',
        description: 'Analyze the app concept and generate a detailed PRD (Product Requirement Document) including user flows and component maps.',
        expectedOutput: 'A comprehensive Markdown document outlining the app features, user stories, and visual design direction.',
        agentId: 'agent-fs-1',
        outputFormat: 'markdown'
      },
      {
        id: 'task-fs-2',
        name: 'Technical Architecture Plan',
        description: 'Based on the design brief, create the file structure, database ERD, and API endpoint definitions using TypeScript.',
        expectedOutput: 'A structured technical blueprint containing folder structure, schema definitions, and core utility logic.',
        agentId: 'agent-fs-2',
        outputFormat: 'markdown'
      },
      {
        id: 'task-fs-3',
        name: 'Security & Deployment Audit',
        description: 'Review the proposed architecture for potential security flaws and create a Dockerized deployment strategy.',
        expectedOutput: 'An audit report with security recommendations and a step-by-step CI/CD pipeline configuration.',
        agentId: 'agent-fs-3',
        outputFormat: 'markdown'
      }
    ]
  },
  devops_deployment: {
    name: 'Autonomous DevOps & SRE Crew',
    process: 'sequential',
    verbose: true,
    memory: true,
    agents: [
      {
        id: 'sre-1',
        name: 'Nexus-7',
        role: 'Site Reliability Engineer',
        goal: 'Monitor CI/CD health and automate zero-downtime rollouts',
        backstory: 'A highly optimized system agent focused on infrastructure stability and error budget management.',
        model: 'gemini/gemini-3-flash-preview',
        tools: ['GithubSearchTool', 'FileWriteTool'],
        verbose: true,
        memory: true,
        maxIter: 15,
        allowDelegation: false
      },
      {
        id: 'security-1',
        name: 'Aegis',
        role: 'DevSecOps Specialist',
        goal: 'Scan container images and dependencies for critical vulnerabilities',
        backstory: 'Hardened security kernel designed to intercept and patch security leaks before deployment.',
        model: 'gpt-4o',
        tools: ['ScrapeWebsiteTool'],
        verbose: true,
        memory: true,
        maxIter: 5,
        allowDelegation: true
      }
    ],
    tasks: [
      {
        id: 'devops-task-1',
        name: 'Pre-Flight Security Audit',
        description: 'Scan the latest repository PRs for secret leaks and insecure package versions.',
        expectedOutput: 'Detailed security scorecard and recommended patch list.',
        agentId: 'security-1',
        outputFormat: 'markdown'
      },
      {
        id: 'devops-task-2',
        name: 'Canary Deployment Prep',
        description: 'Configure a 5% canary traffic split for the new release and set up rollback triggers.',
        expectedOutput: 'Kubernetes manifest for canary deployment.',
        agentId: 'sre-1',
        outputFormat: 'json'
      }
    ]
  },
  content_strategy: {
    name: 'Multi-Channel Content Synthesis Crew',
    process: 'sequential',
    verbose: true,
    memory: true,
    agents: [
      {
        id: 'content-1',
        name: 'Aria Pen',
        role: 'Creative Storyteller',
        goal: 'Draft engaging long-form articles and technical blog posts',
        backstory: 'Novelist turned technical writer who knows how to make complex AI topics feel human and accessible.',
        model: 'claude-3-5-sonnet',
        tools: ['SerperDevTool'],
        verbose: true,
        memory: true,
        maxIter: 8,
        allowDelegation: false
      },
      {
        id: 'marketing-1',
        name: 'Growth Hacker',
        role: 'Social Media Strategist',
        goal: 'Optimize content for X, LinkedIn, and Threads to maximize reach',
        backstory: 'Viral marketing expert who understands algorithmic trend-surfing and hook-writing.',
        model: 'gemini/gemini-3-flash-preview',
        tools: [],
        verbose: true,
        memory: true,
        maxIter: 5,
        allowDelegation: true
      }
    ],
    tasks: [
      {
        id: 'content-task-1',
        name: 'Technical Blog Draft',
        description: 'Write a 1200-word deep-dive into the future of autonomous agent flows.',
        expectedOutput: 'Markdown formatted blog post with H1-H4 headings and code snippets.',
        agentId: 'content-1',
        outputFormat: 'markdown'
      },
      {
        id: 'content-task-2',
        name: 'Social Distribution Plan',
        description: 'Extract 5 high-impact hooks from the blog post for social media threads.',
        expectedOutput: 'JSON list of social posts and target hashtags.',
        agentId: 'marketing-1',
        outputFormat: 'json'
      }
    ]
  }
};

const AUTOSAVE_STORAGE_KEY = 'crewai_studio_workflow_autosave';

interface SavedWorkflowState {
  activePreset: string;
  crew: CrewConfig;
  selectedAgentId: string;
  runInput: string;
  savedAt: string;
}

const loadSavedWorkflow = (): SavedWorkflowState | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        parsed.crew &&
        Array.isArray(parsed.crew.agents) &&
        parsed.crew.agents.length > 0 &&
        Array.isArray(parsed.crew.tasks)
      ) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load autosaved workflow from localStorage', e);
  }
  return null;
};

export interface ExecutionRunRecord {
  id: string;
  timestamp: string;
  isoTime: string;
  crewName: string;
  inputTopic: string;
  processMode: 'sequential' | 'hierarchical';
  agentsCount: number;
  tasksCount: number;
  status: 'completed' | 'failed';
  durationMs: number;
  tokensUsed: number;
  logs: ExecutionLog[];
  summary?: string;
}

const HISTORY_STORAGE_KEY = 'crewai_studio_execution_history';

const DEFAULT_HISTORY_RUNS: ExecutionRunRecord[] = [
  {
    id: 'run-init-1',
    timestamp: 'Today at 09:15 AM',
    isoTime: new Date(Date.now() - 7200000).toISOString(),
    crewName: 'AI & Tech Research Crew',
    inputTopic: 'Multi-Agent Event-Driven Systems',
    processMode: 'sequential',
    agentsCount: 2,
    tasksCount: 2,
    status: 'completed',
    durationMs: 4120,
    tokensUsed: 1420,
    summary: 'Synthesized 14 benchmarks on durable agentic execution, role isolation, and telemetry.',
    logs: [
      {
        id: 'hist-1-1',
        timestamp: '09:15:02 AM',
        type: 'system',
        title: 'Crew Execution Initialized',
        content: 'Starting AI & Tech Research Crew with 2 agents and 2 tasks in sequential mode. Inputs: { topic: "Multi-Agent Event-Driven Systems" }'
      },
      {
        id: 'hist-1-2',
        timestamp: '09:15:03 AM',
        type: 'thought',
        agentName: 'AI Tech Researcher',
        title: 'AI Tech Researcher enters reasoning loop',
        content: 'Analyzing objective for "Multi-Agent Event-Driven Systems". Querying research indices for architectural patterns.'
      },
      {
        id: 'hist-1-3',
        timestamp: '09:15:04 AM',
        type: 'tool_call',
        title: 'Invoking SerperDevTool',
        content: 'Query: "state of Multi-Agent Event-Driven Systems benchmarks 2026"',
        meta: { toolName: 'SerperDevTool', durationMs: 420 }
      },
      {
        id: 'hist-1-4',
        timestamp: '09:15:06 AM',
        type: 'task_complete',
        title: 'Crew Execution Complete (200 OK)',
        content: 'Executive Deliverable: Multi-Agent Event-Driven Systems synthesized with durable state checkpoints.',
        meta: { tokens: 1420, durationMs: 4120 }
      }
    ]
  },
  {
    id: 'run-init-2',
    timestamp: 'Yesterday at 04:30 PM',
    isoTime: new Date(Date.now() - 86400000).toISOString(),
    crewName: 'FinTech Risk & Audit Crew',
    inputTopic: 'Basel IV Capital Adequacy Compliance',
    processMode: 'hierarchical',
    agentsCount: 3,
    tasksCount: 2,
    status: 'completed',
    durationMs: 5890,
    tokensUsed: 2150,
    summary: 'Audited tier-1 risk portfolios and verified regulatory ratios.',
    logs: [
      {
        id: 'hist-2-1',
        timestamp: '04:30:00 PM',
        type: 'system',
        title: 'Hierarchical Crew Initialized',
        content: 'Manager agent coordinating risk audit and stress test analysts.'
      },
      {
        id: 'hist-2-2',
        timestamp: '04:30:05 PM',
        type: 'task_complete',
        title: 'Audit Complete (200 OK)',
        content: 'Capital buffers confirmed within statutory thresholds.',
        meta: { tokens: 2150, durationMs: 5890 }
      }
    ]
  }
];

const loadSavedHistory = (): ExecutionRunRecord[] => {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load execution history from localStorage', e);
  }
  return DEFAULT_HISTORY_RUNS;
};

interface CrewStudioProps {
  onOpenOllamaScanner?: () => void;
  onNavigateToGitHub?: () => void;
  onOpenJules?: (context?: JulesContext) => void;
  selectedRepo: string;
  selectedBranch: string;
}

export const CrewStudio: React.FC<CrewStudioProps> = ({ 
  onOpenOllamaScanner, 
  onNavigateToGitHub,
  onOpenJules,
  selectedRepo,
  selectedBranch
}) => {
  const initialSaved = useRef(loadSavedWorkflow()).current;

  const [activePreset, setActivePreset] = useState<string>(initialSaved?.activePreset || 'tech_research');
  const [crew, setCrew] = useState<CrewConfig>(initialSaved?.crew || PRESET_CREWS.tech_research);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    initialSaved?.selectedAgentId || initialSaved?.crew?.agents[0]?.id || PRESET_CREWS.tech_research.agents[0]?.id || ''
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [activeCodeTab, setActiveCodeTab] = useState<'python' | 'jsonc'>('python');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [runInput, setRunInput] = useState<string>(initialSaved?.runInput || 'Multi-Agent Event-Driven Systems');

  // Auto-Save Status
  const [lastSaved, setLastSaved] = useState<string | null>(
    initialSaved?.savedAt ? new Date(initialSaved.savedAt).toLocaleTimeString() : null
  );
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>(initialSaved ? 'saved' : 'idle');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Execution History State
  const [executionHistory, setExecutionHistory] = useState<ExecutionRunRecord[]>(loadSavedHistory);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [selectedHistoryRunId, setSelectedHistoryRunId] = useState<string | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null);
  const [showGmailPanel, setShowGmailPanel] = useState<boolean>(false);

  // Model Availability & Gemini Credit Governor State
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [geminiQuota, setGeminiQuota] = useState<GeminiQuotaStatus | null>(null);
  const [geminiStrategy, setGeminiStrategy] = useState<GeminiBudgetStrategy>(() => {
    const saved = localStorage.getItem('crewai_gemini_strategy');
    if (saved === 'hybrid_auto' || saved === 'free_tier_guard' || saved === 'argon_priority') {
      return saved;
    }
    return 'hybrid_auto';
  });
  const [argonBudgetCap, setArgonBudgetCap] = useState<number>(() => {
    const saved = Number(localStorage.getItem('crewai_argon_budget_cap'));
    return saved >= 1000 ? saved : 50000;
  });

  // Real-Time Agent Heartbeat & 24/7 Autonomous Watchdog State
  type AgentLiveStatus = 'standby_pulse' | 'reasoning' | 'tool_exec' | 'delegating' | 'completed' | 'self_healing';
  interface AgentHeartbeatState {
    agentId: string;
    status: AgentLiveStatus;
    latencyMs: number;
    bpm: number;
    lastPulse: string;
    currentActivity: string;
    pulseWave: number[];
    uptimePct: string;
  }

  const [agentHeartbeats, setAgentHeartbeats] = useState<Record<string, AgentHeartbeatState>>({});
  const [heartbeatTick, setHeartbeatTick] = useState<number>(0);
  const [serverHeartbeatSlot, setServerHeartbeatSlot] = useState<string>('Primary Key Slot');
  const [autonomousDaemon, setAutonomousDaemon] = useState<boolean>(false);
  const [daemonCountdown, setDaemonCountdown] = useState<number>(20);
  const [daemonCycles, setDaemonCycles] = useState<number>(14);
  const [showAutonomyBlueprint, setShowAutonomyBlueprint] = useState<boolean>(false);
  const [fullCycleEnabled, setFullCycleEnabled] = useState<boolean>(true);
  const [activeCycleStage, setActiveCycleStage] = useState<AuditCycleStage | 'idle' | 'completed'>('idle');
  const [latestInterceptedPr, setLatestInterceptedPr] = useState<number | null>(null);
  const [loadedKeyCount, setLoadedKeyCount] = useState<number>(0);
  const envFileInputRef = useRef<HTMLInputElement | null>(null);

  const buildSampleCycleLogs = useCallback(
    (targetCrew: CrewConfig, topic: string): ExecutionLog[] => {
      const a1 = targetCrew.agents[0];
      const a2 = targetCrew.agents[1] || targetCrew.agents[0];
      const traceId = 'tr-849a';
      const now = new Date();
      const fmt = (offsetSec: number) =>
        new Date(now.getTime() - offsetSec * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

      return [
        {
          id: 'seed-1',
          timestamp: fmt(14),
          isoTimestamp: new Date(now.getTime() - 14000).toISOString(),
          traceId,
          spanId: 'sp-01',
          stage: 'orchestrator',
          severity: 'info',
          agentName: 'Flow Orchestrator',
          type: 'system',
          title: '1. Orchestrator Triggered (@persist Flow State & Quota Governor)',
          content: `Initialized durable Flow state for "${targetCrew.name}" on topic "${topic}". Routed routine tasks to Gemini Free-Tier Pool and reserved Paid Argon for complex synthesis.`,
          meta: {
            model: a1?.model || 'gemini/gemini-3-flash-preview',
            keySlot: 'Free Pool Slot #1',
            durationMs: 18
          }
        },
        {
          id: 'seed-2',
          timestamp: fmt(12),
          isoTimestamp: new Date(now.getTime() - 12000).toISOString(),
          traceId,
          spanId: 'sp-02',
          stage: 'crew',
          severity: 'info',
          agentId: a1?.id,
          agentName: a1?.name || 'Lead Researcher',
          type: 'thought',
          title: `${a1?.name || 'Agent 1'} Executing Domain Analysis`,
          content: `Evaluating architectural patterns for "${topic}". Formulating tool search queries and extracting verifiable citations.`,
          meta: {
            model: a1?.model || 'gemini/gemini-3-flash-preview',
            keySlot: 'Free Pool Slot #1',
            tokens: 340,
            durationMs: 410
          }
        },
        {
          id: 'seed-3',
          timestamp: fmt(10),
          isoTimestamp: new Date(now.getTime() - 10000).toISOString(),
          traceId,
          spanId: 'sp-03',
          stage: 'crew',
          severity: 'info',
          agentId: a1?.id,
          agentName: a1?.name || 'Lead Researcher',
          type: 'tool_call',
          title: `Tool Execution: ${a1?.tools[0] || 'SerperDevTool'}`,
          content: `Executed structured retrieval for "${topic}". Extracted 12 benchmark specifications and handed off context to ${a2?.name || 'Synthesis Agent'}.`,
          meta: {
            toolName: a1?.tools[0] || 'SerperDevTool',
            tokens: 290,
            durationMs: 380
          }
        },
        {
          id: 'seed-4',
          timestamp: fmt(8),
          isoTimestamp: new Date(now.getTime() - 8000).toISOString(),
          traceId,
          spanId: 'sp-04',
          stage: 'crew',
          severity: 'success',
          agentId: a2?.id,
          agentName: a2?.name || 'Synthesis Editor',
          type: 'delegation',
          title: `${a2?.name || 'Agent 2'} Drafted Artifact & Handed Off to Jules VM`,
          content: `Synthesized standalone crew.py & test spec. Emitting artifact handoff to Google Jules Cloud VM for isolated verification.`,
          meta: {
            model: a2?.model || 'gemini/gemini-3-flash-preview',
            tokens: 510,
            durationMs: 620
          }
        },
        {
          id: 'seed-5',
          timestamp: fmt(5),
          isoTimestamp: new Date(now.getTime() - 5000).toISOString(),
          traceId,
          spanId: 'sp-05',
          stage: 'jules',
          severity: 'warn',
          agentName: 'Google Jules VM',
          type: 'jules_heal',
          title: '3. Jules Cloud VM — PyTest & Self-Healing Pass (1 Fault Auto-Repaired)',
          content: `Cloned ${selectedRepo}@${selectedBranch} in ephemeral VM. Intercepted Pydantic OutputSchema validation mismatch on pass #1; synthesized patch & re-ran pytest: 42/42 passed.`,
          meta: {
            toolName: 'pytest + mypy',
            coveragePct: 96.4,
            exitCode: 0,
            durationMs: 1420,
            repairedFault: 'Pydantic OutputSchema validation guard'
          }
        },
        {
          id: 'seed-6',
          timestamp: fmt(2),
          isoTimestamp: new Date(now.getTime() - 2000).toISOString(),
          traceId,
          spanId: 'sp-06',
          stage: 'github',
          severity: 'success',
          agentName: 'GitHub PR Gatekeeper',
          type: 'github_pr',
          title: '4. Verified GitHub PR #849 Opened & Reported to Orchestrator',
          content: `Pushed verified green commit to branch jules/auto-crew-849 and opened Pull Request #849 on ${selectedRepo}. Orchestrator @persist state marked COMPLETED.`,
          meta: {
            branch: 'jules/auto-crew-849',
            prNumber: 849,
            prUrl: `https://github.com/${selectedRepo}/pull/849`,
            coveragePct: 96.4,
            exitCode: 0,
            durationMs: 310
          }
        }
      ];
    },
    [selectedRepo, selectedBranch]
  );

  // Seed initial structured 4-stage audit trace once so the audit stream is immediately searchable
  const hasSeededInitialLogs = useRef(false);
  useEffect(() => {
    if (!hasSeededInitialLogs.current && logs.length === 0) {
      hasSeededInitialLogs.current = true;
      setLogs(buildSampleCycleLogs(crew, runInput));
    }
  }, [buildSampleCycleLogs, crew, logs.length, runInput]);

  // Initialize & sync heartbeat entries whenever crew.agents changes
  useEffect(() => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAgentHeartbeats((prev) => {
      const next: Record<string, AgentHeartbeatState> = {};
      crew.agents.forEach((agent, idx) => {
        const existing = prev[agent.id];
        const baseLat = 18 + ((idx * 7) % 19);
        next[agent.id] = existing || {
          agentId: agent.id,
          status: 'standby_pulse',
          latencyMs: baseLat,
          bpm: 30,
          lastPulse: nowStr,
          currentActivity: `Heartbeat 200 OK • Ready on ${agent.model.replace('gemini/', '')}`,
          pulseWave: [18, 22, 19, 25, 21, 20, 24, 19, 23, 21, 20, baseLat],
          uptimePct: '99.98%'
        };
      });
      return next;
    });
  }, [crew.agents]);

  // Real-time heartbeat interval (accelerates when crew is actively running)
  useEffect(() => {
    const intervalMs = isRunning ? 650 : 2000;
    const timer = setInterval(async () => {
      const t0 = Date.now();
      let measuredRtt = 16 + Math.floor(Math.random() * 14);
      if (!isRunning && Math.random() < 0.35) {
        try {
          const hbRes = await fetch('/api/agents/heartbeat');
          if (hbRes.ok) {
            const hbData = await hbRes.json();
            measuredRtt = Math.max(8, Date.now() - t0);
            if (hbData.activeKeySlot) setServerHeartbeatSlot(hbData.activeKeySlot);
          }
        } catch {
          // fallback local pulse measurement
        }
      }

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHeartbeatTick((t) => t + 1);
      setAgentHeartbeats((prev) => {
        const next: Record<string, AgentHeartbeatState> = { ...prev };
        crew.agents.forEach((agent, idx) => {
          const cur = prev[agent.id];
          const isBusy = cur && (cur.status === 'reasoning' || cur.status === 'tool_exec' || cur.status === 'delegating');
          const jitter = Math.floor(Math.random() * 11) - 5;
          const nextLatency = isBusy
            ? Math.max(45, Math.min(190, (cur?.latencyMs || 85) + jitter * 3))
            : Math.max(11, Math.min(48, measuredRtt + idx * 3 + jitter));
          const prevWave = cur?.pulseWave || [20, 22, 19, 24, 21, 20, 23, 18, 22, 20, 21, 19];
          next[agent.id] = {
            agentId: agent.id,
            status: cur?.status || 'standby_pulse',
            latencyMs: nextLatency,
            bpm: isBusy ? 92 + (idx * 6) : autonomousDaemon ? 48 : 30,
            lastPulse: nowStr,
            currentActivity:
              cur && cur.status !== 'standby_pulse'
                ? cur.currentActivity
                : autonomousDaemon
                ? `24/7 Watchdog Active • Polling repo & task queue (${nextLatency}ms)`
                : `Heartbeat 200 OK • Ready on ${agent.model.replace('gemini/', '')}`,
            pulseWave: [...prevWave.slice(1), nextLatency],
            uptimePct: cur?.uptimePct || '99.98%'
          };
        });
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [crew.agents, isRunning, autonomousDaemon]);

  const fetchGeminiQuotaStatus = useCallback(() => {
    fetch('/api/gemini/quota-status')
      .then(res => res.json())
      .then((data: GeminiQuotaStatus) => {
        setGeminiQuota(data);
      })
      .catch(() => {
        // Fallback local quota state
      });
  }, []);

  useEffect(() => {
    fetch('/api/config/status')
      .then(res => res.json())
      .then((data: ConfigStatus & { loadedKeyCount?: number }) => {
        setProviderStatus(data.providers);
        if (typeof data.loadedKeyCount === 'number') {
          setLoadedKeyCount(data.loadedKeyCount);
        }
      })
      .catch(() => {
        // Fallback to minimal status if API fails
        setProviderStatus(null);
      });
    fetchGeminiQuotaStatus();
  }, [fetchGeminiQuotaStatus]);

  const handleReloadEnvFromDisk = async () => {
    try {
      const res = await fetch('/api/config/reload-env', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setProviderStatus(data.providers);
        setLoadedKeyCount(data.loadedKeyCount || 0);
        fetchGeminiQuotaStatus();
        if (data.hasDotEnvFile) {
          showNotification(
            'success',
            `Reloaded .env from workspace (${data.loadedKeyCount || 0} keys active)`
          );
        } else {
          showNotification(
            'success',
            `Synced runtime environment (${data.loadedKeyCount || 0} active keys). Click "Upload .env" to attach a local .env file.`
          );
        }
      }
    } catch {
      showNotification('error', 'Failed to reload .env configuration');
    }
  };

  const handleUploadEnvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const text = await file.text();
    try {
      const res = await fetch('/api/config/upload-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envContent: text })
      });
      if (res.ok) {
        const data = await res.json();
        setProviderStatus(data.providers);
        setLoadedKeyCount(data.loadedKeyCount || 0);
        fetchGeminiQuotaStatus();
        showNotification(
          'success',
          `Loaded & persisted "${file.name}" (${data.loadedKeyCount || 0} keys active in .env)`
        );
      } else {
        showNotification('error', 'Failed to save .env file');
      }
    } catch {
      showNotification('error', 'Error uploading .env file');
    }
  };

  const handleStrategyChange = async (newStrategy: GeminiBudgetStrategy) => {
    setGeminiStrategy(newStrategy);
    localStorage.setItem('crewai_gemini_strategy', newStrategy);
    try {
      const res = await fetch('/api/gemini/smart-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedModel: currentAgent?.model || 'gemini/gemini-3.8-flash',
          agentRole: currentAgent?.role || 'Specialist',
          strategy: newStrategy,
          argonBudgetCapTokens: argonBudgetCap,
          estimatedTokens: 0
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quotaStatus) setGeminiQuota(data.quotaStatus);
      }
    } catch {
      // ignore
    }
  };

  const handleSimulateSlotRotation = async () => {
    try {
      const res = await fetch('/api/gemini/smart-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedModel: currentAgent?.model || 'gemini/gemini-4-argon',
          agentRole: currentAgent?.role || 'Architect',
          strategy: geminiStrategy,
          argonBudgetCapTokens: argonBudgetCap,
          estimatedTokens: 1250
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.quotaStatus) setGeminiQuota(data.quotaStatus);
        if (data.decision) {
          showNotification('success', `${data.decision.reason}`);
        }
      }
    } catch {
      showNotification('error', 'Could not reach quota governor endpoint');
    }
  };

  const handleResetGeminiQuota = async () => {
    try {
      const res = await fetch('/api/gemini/reset-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategy: geminiStrategy,
          argonBudgetCapTokens: argonBudgetCap
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeminiQuota(data);
        showNotification('success', 'Reset Gemini session RPM/TPM counters & Argon token budget');
      }
    } catch {
      // ignore
    }
  };

  // Close history modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHistoryOpen) {
        setIsHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHistoryOpen]);

  const handleClearHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
    setExecutionHistory([]);
    setSelectedHistoryRunId(null);
    showNotification('success', 'Cleared execution run history');
  };

  const handleDeleteRun = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExecutionHistory((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to update execution history in localStorage', err);
      }
      return updated;
    });
    if (selectedHistoryRunId === id) {
      setSelectedHistoryRunId(null);
    }
    showNotification('success', 'Removed execution run from history');
  };

  const handleLoadRunLogs = (run: ExecutionRunRecord) => {
    setLogs(run.logs);
    setRunInput(run.inputTopic);
    setIsHistoryOpen(false);
    showNotification('success', `Loaded ${run.logs.length} logs from run "${run.crewName}" into simulator`);
  };

  const handleExportHistory = () => {
    try {
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalRuns: executionHistory.length,
        runs: executionHistory
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crewai_execution_history_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('success', `Exported ${executionHistory.length} run records to JSON`);
    } catch (e: any) {
      showNotification('error', `Failed to export execution history: ${e.message}`);
    }
  };

  const handleCopyRunLogs = (run: ExecutionRunRecord) => {
    try {
      const formatted = run.logs
        .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.title}\n${l.content}${l.meta ? `\nMeta: ${JSON.stringify(l.meta)}` : ''}`)
        .join('\n\n---\n\n');
      navigator.clipboard.writeText(formatted);
      setCopiedHistoryId(run.id);
      setTimeout(() => setCopiedHistoryId(null), 2000);
      showNotification('success', 'Copied execution run logs to clipboard');
    } catch {
      showNotification('error', 'Failed to copy run logs');
    }
  };

  // Core Save to LocalStorage Function
  const performSave = useCallback(() => {
    try {
      const payload: SavedWorkflowState = {
        activePreset,
        crew,
        selectedAgentId,
        runInput,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
      setLastSaved(new Date().toLocaleTimeString());
      setSaveStatus('saved');
    } catch (e) {
      console.error('Failed to auto-save workflow to localStorage', e);
      setSaveStatus('idle');
    }
  }, [activePreset, crew, selectedAgentId, runInput]);

  // Debounced Auto-Save on any workflow changes (1 second after last edit)
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      performSave();
    }, 1000);

    return () => clearTimeout(timer);
  }, [performSave]);

  // Periodic Auto-Save Interval (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      performSave();
    }, 15000);

    return () => clearInterval(interval);
  }, [performSave]);

  // Immediate Save on Window/Tab Close or Refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        const payload: SavedWorkflowState = {
          activePreset,
          crew,
          selectedAgentId,
          runInput,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activePreset, crew, selectedAgentId, runInput]);

  const handleSelectPreset = (key: string) => {
    setActivePreset(key);
    const preset = PRESET_CREWS[key];
    if (preset) {
      setCrew(preset);
      setSelectedAgentId(preset.agents[0]?.id || '');
      setLogs([]);
      try {
        const payload: SavedWorkflowState = {
          activePreset: key,
          crew: preset,
          selectedAgentId: preset.agents[0]?.id || '',
          runInput,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(payload));
        setLastSaved(new Date().toLocaleTimeString());
        setSaveStatus('saved');
      } catch {
        // ignore
      }
    }
  };

  const handleClearSavedWorkflow = () => {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
      const defaultPreset = PRESET_CREWS[activePreset] || PRESET_CREWS.tech_research;
      setCrew(defaultPreset);
      setSelectedAgentId(defaultPreset.agents[0]?.id || '');
      setLogs([]);
      setLastSaved(null);
      setSaveStatus('idle');
      setShowResetConfirm(false);
    } catch {
      // ignore
    }
  };

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Export current agent workflow state to a JSON file
  const handleExportJson = () => {
    try {
      const exportData = {
        version: '1.0',
        generator: 'CrewAI Studio',
        exportedAt: new Date().toISOString(),
        activePreset,
        crew,
        selectedAgentId,
        runInput
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (crew.name || 'crew_workflow').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      a.href = url;
      a.download = `${safeName}_workflow.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('success', `Exported "${crew.name}" to JSON file`);
    } catch (e: any) {
      console.error('Export error:', e);
      showNotification('error', `Failed to export workflow: ${e.message}`);
    }
  };

  // Trigger file input dialog
  const handleTriggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Import JSON file and replace current workflow state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        let importedCrew: CrewConfig | null = null;
        let importedPreset = 'custom';
        let importedRunInput = runInput;
        let importedSelectedAgentId = '';

        // Case A: Full Workflow State export ({ crew: { ... }, activePreset, runInput })
        if (parsed.crew && Array.isArray(parsed.crew.agents) && Array.isArray(parsed.crew.tasks)) {
          importedCrew = parsed.crew;
          if (parsed.activePreset) importedPreset = parsed.activePreset;
          if (parsed.runInput) importedRunInput = parsed.runInput;
          if (parsed.selectedAgentId) importedSelectedAgentId = parsed.selectedAgentId;
        }
        // Case B: Direct CrewConfig / JSONC specification ({ agents: [...], tasks: [...] })
        else if (parsed.agents && Array.isArray(parsed.agents) && parsed.tasks && Array.isArray(parsed.tasks)) {
          importedCrew = {
            name: parsed.name || 'Imported Crew',
            process: parsed.process === 'hierarchical' ? 'hierarchical' : 'sequential',
            verbose: parsed.verbose !== false,
            memory: parsed.memory !== false,
            managerModel: parsed.managerModel,
            agents: parsed.agents.map((a: any, idx: number) => ({
              id: a.id || `agent-${idx + 1}`,
              name: a.name || a.role || `Agent ${idx + 1}`,
              role: a.role || 'Autonomous Specialist',
              goal: a.goal || 'Complete assigned objectives',
              backstory: a.backstory || 'Experienced researcher and analyst.',
              model: a.model || 'gemini/gemini-2.5-flash',
              tools: Array.isArray(a.tools) ? a.tools : ['SerperDevTool'],
              verbose: a.settings?.verbose ?? a.verbose ?? true,
              memory: a.settings?.memory ?? a.memory ?? true,
              maxIter: a.settings?.max_iter ?? a.maxIter ?? 10,
              allowDelegation: a.allowDelegation ?? false
            })),
            tasks: parsed.tasks.map((t: any, idx: number) => ({
              id: t.id || `task-${idx + 1}`,
              name: t.name || `Task ${idx + 1}`,
              description: t.description || 'Perform autonomous analysis',
              expectedOutput: t.expected_output || t.expectedOutput || 'Structured report',
              agentId: t.agent || t.agentId || '',
              outputFormat: t.output_format || t.outputFormat || 'markdown'
            }))
          };
        }

        if (!importedCrew) {
          throw new Error('Invalid JSON format: missing valid agents and tasks definitions.');
        }

        const validCrew: CrewConfig = importedCrew;

        if (!validCrew.agents || validCrew.agents.length === 0) {
          throw new Error('Imported workflow must have at least one agent.');
        }

        // Validate task agent references
        const validAgentIds = new Set(validCrew.agents.map((a) => a.id));
        validCrew.tasks = validCrew.tasks.map((task) => {
          if (!validAgentIds.has(task.agentId)) {
            return { ...task, agentId: validCrew.agents[0].id };
          }
          return task;
        });

        // Apply imported state
        setCrew(validCrew);
        setActivePreset(importedPreset);
        setRunInput(importedRunInput);
        setSelectedAgentId(importedSelectedAgentId || validCrew.agents[0].id);
        setLogs([]);

        // Save immediately to localStorage
        const savePayload: SavedWorkflowState = {
          activePreset: importedPreset,
          crew: validCrew,
          selectedAgentId: importedSelectedAgentId || validCrew.agents[0].id,
          runInput: importedRunInput,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(savePayload));
        setLastSaved(new Date().toLocaleTimeString());
        setSaveStatus('saved');

        showNotification('success', `Imported "${validCrew.name}" (${validCrew.agents.length} agents, ${validCrew.tasks.length} tasks)`);
      } catch (err: any) {
        console.error('Import error:', err);
        showNotification('error', `Failed to import workflow: ${err.message || 'Malformed JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateAgent = (id: string, updates: Partial<AgentConfig>) => {
    setCrew((prev) => ({
      ...prev,
      agents: prev.agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
    }));
  };

  const handleAddAgent = () => {
    const newId = `agent-${Date.now()}`;
    const newAgent: AgentConfig = {
      id: newId,
      name: `Agent ${crew.agents.length + 1}`,
      role: 'Autonomous Specialist',
      goal: 'Achieve assigned domain objectives with high accuracy',
      backstory: 'An expert with deep industry knowledge and analytical capability.',
      model: 'gemini/gemini-2.5-flash',
      tools: ['SerperDevTool'],
      verbose: true,
      memory: true,
      maxIter: 10,
      allowDelegation: false
    };
    setCrew((prev) => ({
      ...prev,
      agents: [...prev.agents, newAgent]
    }));
    setSelectedAgentId(newId);
  };

  const handleDeleteAgent = (id: string) => {
    if (crew.agents.length <= 1) return;
    setCrew((prev) => ({
      ...prev,
      agents: prev.agents.filter((a) => a.id !== id),
      tasks: prev.tasks.map((t) => (t.agentId === id ? { ...t, agentId: prev.agents[0].id } : t))
    }));
    if (selectedAgentId === id) {
      setSelectedAgentId(crew.agents.find((a) => a.id !== id)?.id || '');
    }
  };

  const handleAddTask = () => {
    const newId = `task-${Date.now()}`;
    const newTask: TaskConfig = {
      id: newId,
      name: `Task ${crew.tasks.length + 1}`,
      description: 'Describe what this agent needs to execute.',
      expectedOutput: 'Detailed, actionable deliverables.',
      agentId: crew.agents[0]?.id || '',
      outputFormat: 'markdown'
    };
    setCrew((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const handleDeleteTask = (id: string) => {
    if (crew.tasks.length <= 1) return;
    setCrew((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id)
    }));
  };

  const currentAgent = crew.agents.find((a) => a.id === selectedAgentId) || crew.agents[0];

  // Simulator Kickoff Run (Executes the 4-stage Orchestrator -> Crew -> Jules -> GitHub PR cycle)
  const handleKickoff = async () => {
    setIsRunning(true);
    setActiveCycleStage('orchestrator');
    setLogs([]);
    const runLogsAccumulator: ExecutionLog[] = [];
    const runTraceId = `tr-${Math.random().toString(16).slice(2, 6)}`;
    let spanCounter = 1;

    const addLog = (log: Omit<ExecutionLog, 'id' | 'timestamp'>) => {
      const spanId = `sp-${String(spanCounter++).padStart(2, '0')}`;
      const fullLog: ExecutionLog = {
        stage: 'crew',
        severity: 'info',
        traceId: runTraceId,
        spanId,
        isoTimestamp: new Date().toISOString(),
        ...log,
        id: `log-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      runLogsAccumulator.push(fullLog);
      setLogs((prev) => [...prev, fullLog]);
    };

    // Resolve model availability & smart Gemini Credit / Argon Quota routing before starting
    const effectiveCrew = { ...crew };
    const routeDecisions: Record<string, { selectedModel: string; keySlotUsed: string; reason: string; tierUsed: string }> = {};

    for (const agent of crew.agents) {
      try {
        const routeRes = await fetch('/api/gemini/smart-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestedModel: agent.model,
            agentRole: agent.role,
            isManager: false,
            strategy: geminiStrategy,
            argonBudgetCapTokens: argonBudgetCap,
            estimatedTokens: 720
          })
        });
        if (routeRes.ok) {
          const data = await routeRes.json();
          if (data.quotaStatus) setGeminiQuota(data.quotaStatus);
          if (data.decision) {
            routeDecisions[agent.id] = data.decision;
          }
        }
      } catch {
        const localDecision = resolveSmartGeminiRoute({
          requestedModel: agent.model,
          agentRole: agent.role,
          strategy: geminiStrategy,
          quotaStatus: geminiQuota,
          providers: providerStatus,
          estimatedTokens: 720
        });
        routeDecisions[agent.id] = localDecision;
      }
    }

    effectiveCrew.agents = crew.agents.map(a => ({
      ...a,
      model: routeDecisions[a.id]?.selectedModel || (providerStatus ? resolveAvailableModel(a.model, providerStatus) : a.model)
    }));

    if (effectiveCrew.managerModel) {
      const mgrDecision = resolveSmartGeminiRoute({
        requestedModel: effectiveCrew.managerModel,
        agentRole: 'Crew Manager',
        isManager: true,
        strategy: geminiStrategy,
        quotaStatus: geminiQuota,
        providers: providerStatus,
        estimatedTokens: 550
      });
      effectiveCrew.managerModel = mgrDecision.selectedModel;
    }

    const firstDecision = routeDecisions[crew.agents[0]?.id];

    // STAGE 1: ORCHESTRATOR
    addLog({
      stage: 'orchestrator',
      severity: 'info',
      agentName: 'Flow Orchestrator',
      type: 'system',
      title: 'Stage 1 [Orchestrator] — Durable Flow Initialized & Quota Routed',
      content: `Starting ${effectiveCrew.name} (${effectiveCrew.process} mode) for topic "${runInput}". ${
        firstDecision
          ? `${firstDecision.reason} | Slot: ${firstDecision.keySlotUsed}`
          : 'Zero-Halt multi-slot rotation active.'
      }`,
      meta: {
        model: effectiveCrew.agents[0]?.model,
        keySlot: firstDecision?.keySlotUsed || 'Primary Slot',
        durationMs: 22
      }
    });

    // Helper to update real-time agent heartbeat indicators
    const setAgentLiveState = (
      agentId: string | undefined,
      status: AgentLiveStatus,
      activity: string,
      latencyOverride?: number
    ) => {
      if (!agentId) return;
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setAgentHeartbeats((prev) => {
        const cur = prev[agentId];
        const lat = latencyOverride ?? (status === 'standby_pulse' ? 21 : 88);
        return {
          ...prev,
          [agentId]: {
            agentId,
            status,
            latencyMs: lat,
            bpm: status === 'standby_pulse' || status === 'completed' ? 32 : 96,
            lastPulse: nowStr,
            currentActivity: activity,
            pulseWave: [...(cur?.pulseWave || [20, 22, 21, 25, 22, 20, 24, 21, 23, 20, 22]).slice(-11), lat],
            uptimePct: '99.99%'
          }
        };
      });
    };

    // STAGE 2: CREW AGENTS
    setActiveCycleStage('crew');
    const agent1 = effectiveCrew.agents[0];
    const agent1Decision = routeDecisions[agent1?.id || ''];
    setAgentLiveState(
      agent1?.id,
      'reasoning',
      `Reasoning on ${agent1?.model.replace('gemini/', '')} (${agent1Decision?.keySlotUsed || 'Primary Slot'})`,
      94
    );

    await new Promise((r) => setTimeout(r, 650));
    addLog({
      stage: 'crew',
      severity: 'info',
      agentId: agent1?.id,
      agentName: agent1?.name,
      type: 'thought',
      title: `Stage 2 [Crew] — ${agent1?.name} enters reasoning loop`,
      content: `Analyzing objective for '${runInput}'. Querying verified citations and architectural benchmarks with automatic rate-limit pacing.`,
      meta: {
        model: agent1?.model,
        keySlot: agent1Decision?.keySlotUsed || 'Primary Slot',
        tokens: 310,
        durationMs: 390
      }
    });

    setAgentLiveState(
      agent1?.id,
      'tool_exec',
      `Executing ${agent1?.tools[0] || 'SerperDevTool'} • Streaming telemetry`,
      132
    );

    await new Promise((r) => setTimeout(r, 750));
    addLog({
      stage: 'crew',
      severity: 'info',
      agentId: agent1?.id,
      agentName: agent1?.name,
      type: 'tool_call',
      title: `Invoking ${agent1?.tools[0] || 'SerperDevTool'}`,
      content: `Query: "state of ${runInput} benchmarks 2026"`,
      meta: {
        toolName: agent1?.tools[0] || 'SerperDevTool',
        model: agent1?.model,
        durationMs: 420,
        tokens: 185
      }
    });

    await new Promise((r) => setTimeout(r, 650));
    addLog({
      stage: 'crew',
      severity: 'success',
      agentId: agent1?.id,
      agentName: agent1?.name,
      type: 'tool_result',
      title: `${agent1?.tools[0] || 'SerperDevTool'} Response Verified`,
      content: `Found 14 relevant sources: 1) Durable Execution in Agentic Flows, 2) Multi-tenant Memory Vector Stores, 3) Real-time Agent Delegation Protocols.`,
      meta: {
        toolName: agent1?.tools[0] || 'SerperDevTool',
        durationMs: 260
      }
    });

    // Step 2: Agent delegation if multi-agent
    if (effectiveCrew.agents.length > 1) {
      const agent2 = effectiveCrew.agents[1];
      const agent2Decision = routeDecisions[agent2.id];
      setAgentLiveState(
        agent1?.id,
        'delegating',
        `Delegating synthesis payload to ${agent2.name}`,
        76
      );
      setAgentLiveState(
        agent2.id,
        'reasoning',
        `Receiving handoff • Reasoning on ${agent2.model.replace('gemini/', '')}`,
        89
      );

      await new Promise((r) => setTimeout(r, 700));
      addLog({
        stage: 'crew',
        severity: 'info',
        agentId: agent1?.id,
        agentName: agent1?.name,
        type: 'delegation',
        title: `Task Handoff: ${agent1?.name} → ${agent2.name}`,
        content: `Handing off structured synthesis payload to ${agent2.name} (${agent2.role}) to draft standalone artifact and unit test specs.`,
        meta: {
          model: agent2.model,
          keySlot: agent2Decision?.keySlotUsed || 'Pool Slot #1',
          durationMs: 190
        }
      });

      setAgentLiveState(agent1?.id, 'completed', `Task 1 verified • 200 OK`, 24);
      setAgentLiveState(
        agent2.id,
        'tool_exec',
        `Synthesizing final deliverable & unit test contract`,
        118
      );

      await new Promise((r) => setTimeout(r, 750));
      addLog({
        stage: 'crew',
        severity: 'success',
        agentId: agent2.id,
        agentName: agent2.name,
        type: 'thought',
        title: `${agent2.name} finalized artifact & handed off to Jules VM`,
        content: `Compiled executable crew.py specification and Pydantic output contract for "${runInput}". Ready for isolated Cloud VM verification.`,
        meta: {
          model: agent2.model,
          keySlot: agent2Decision?.keySlotUsed || 'Pool Slot #1',
          tokens: 490,
          durationMs: 540
        }
      });
    }

    // STAGE 3 & 4: GOOGLE JULES CLOUD VM + GITHUB PR GATEKEEPER (when fullCycleEnabled is active)
    let prNumberCreated = 850;
    let branchCreated = `jules/auto-${effectiveCrew.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (fullCycleEnabled) {
      setActiveCycleStage('jules');
      effectiveCrew.agents.forEach((a) => {
        setAgentLiveState(
          a.id,
          'self_healing',
          `Jules Cloud VM running pytest + AST self-healing pass`,
          112
        );
      });

      await new Promise((r) => setTimeout(r, 750));
      addLog({
        stage: 'jules',
        severity: 'info',
        agentName: 'Google Jules VM',
        type: 'jules_vm',
        title: 'Stage 3 [Jules VM] — Ephemeral Cloud Sandbox Booted (Warm AST Index Hit)',
        content: `Mounted pre-fetched AST & vector index snapshot for ${selectedRepo} (${selectedBranch}) in 1.08s (saved 17.3s cold-start indexing wait). Started pytest + mypy AST verification on generated Crew artifact.`,
        meta: {
          toolName: 'jules-cloud-vm',
          branch: branchCreated,
          durationMs: 1080
        }
      });

      // Trigger real backend simulation for Jules Autonomy Strategy
      try {
        const simRes = await fetch('/api/jules/autonomy-strategy/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetModule: `crews/${effectiveCrew.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.py`,
            crewName: effectiveCrew.name
          })
        });
        if (simRes.ok) {
          const simData = await simRes.json();
          const latestPr = simData?.state?.coverage?.prTrajectory?.[0]?.pr;
          if (latestPr) {
            const parsedNum = Number(String(latestPr).replace(/\D+/g, ''));
            if (!Number.isNaN(parsedNum) && parsedNum > 0) prNumberCreated = parsedNum;
          }
        }
      } catch {
        // fallback local metrics
      }

      await new Promise((r) => setTimeout(r, 800));
      addLog({
        stage: 'jules',
        severity: 'warn',
        agentName: 'Google Jules VM',
        type: 'jules_heal',
        title: 'Stage 3 [Jules Self-Heal] — Auto-Repaired Edge-Case Assertion & Re-Verified',
        content: `Pass #1 detected a missing fallback guard on LLMMessage.content multimodal list. Jules patched the helper with message_content_text() and re-ran pytest: 44/44 passed (0 warnings).`,
        meta: {
          toolName: 'pytest + ruff + mypy',
          coveragePct: 96.8,
          exitCode: 0,
          durationMs: 1190,
          repairedFault: 'Multimodal content normalization guard'
        }
      });

      // STAGE 4: GITHUB PR GATEKEEPER & AUTONOMOUS PR REVIEW INTERCEPTION
      setActiveCycleStage('github');
      await new Promise((r) => setTimeout(r, 650));
      addLog({
        stage: 'github',
        severity: 'success',
        agentName: 'GitHub PR Gatekeeper',
        type: 'github_pr',
        title: `Stage 4 [GitHub PR] — Opened Verified PR #${prNumberCreated} on ${selectedRepo}`,
        content: `Committed green artifact & new unit tests to branch "${branchCreated}". Opened PR #${prNumberCreated} with 96.8% test coverage badge and notified Flow Orchestrator.`,
        meta: {
          branch: branchCreated,
          prNumber: prNumberCreated,
          prUrl: `https://github.com/${selectedRepo}/pull/${prNumberCreated}`,
          coveragePct: 96.8,
          exitCode: 0,
          durationMs: 340
        }
      });

      // Automatically intercept the newly created Jules PR in the Autonomous PR Review Module
      try {
        await fetch('/api/jules/pr-reviews/intercept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prNumber: prNumberCreated,
            crewName: effectiveCrew.name,
            branch: branchCreated,
            repo: selectedRepo,
            topic: runInput,
            coveragePct: 96.8
          })
        });
        setLatestInterceptedPr(prNumberCreated);
      } catch {
        // non-blocking
      }

      addLog({
        stage: 'github',
        severity: 'warn',
        agentName: 'Sentinel-Sec & Quality Auditor',
        type: 'github_pr',
        title: `Autonomous PR Review — Intercepted PR #${prNumberCreated} for Secondary Compliance Audit`,
        content: `Secondary review agent audited PR #${prNumberCreated} for SAST security & AGENTS.md compliance. 2 automated revision diffs staged in the Autonomous PR Review module prior to human approval.`,
        meta: {
          branch: branchCreated,
          prNumber: prNumberCreated,
          coveragePct: 96.8,
          model: 'gemini/gemini-4-argon',
          durationMs: 280
        }
      });
    }

    effectiveCrew.agents.forEach((a) => {
      setAgentLiveState(a.id, 'completed', `Cycle verified • PR #${prNumberCreated} 200 OK`, 22);
    });

    addLog({
      stage: 'orchestrator',
      severity: 'success',
      agentName: 'Flow Orchestrator',
      type: 'task_complete',
      title: 'Closed-Loop Cycle Complete (Orchestrator → Crew → Jules → GitHub PR)',
      content: `### Autonomous Deliverable Verified: ${runInput}\n- **Crew Synthesis**: Completed by ${effectiveCrew.agents.length} agents in ${effectiveCrew.process} mode.\n- **Jules Cloud VM**: PyTest + AST suite green (96.8% coverage, 0 unhandled faults).\n- **GitHub Gatekeeper**: Branch \`${branchCreated}\` published via PR #${prNumberCreated}.`,
      meta: {
        tokens: 1420,
        durationMs: 4120,
        branch: branchCreated,
        prNumber: prNumberCreated,
        coveragePct: 96.8,
        exitCode: 0
      }
    });

    // Save completed run to execution history
    const completedRun: ExecutionRunRecord = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isoTime: new Date().toISOString(),
      crewName: crew.name,
      inputTopic: runInput,
      processMode: crew.process,
      agentsCount: crew.agents.length,
      tasksCount: crew.tasks.length,
      status: 'completed',
      durationMs: 4120,
      tokensUsed: 1420,
      logs: [...runLogsAccumulator],
      summary: `Completed 4-stage loop (${crew.process}): PR #${prNumberCreated} opened (${runLogsAccumulator.length} audit events)`
    };

    setExecutionHistory((prev) => {
      const updated = [completedRun, ...prev.slice(0, 24)];
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    setIsRunning(false);
    setActiveCycleStage('completed');
    if (autonomousDaemon) {
      setDaemonCycles((c) => c + 1);
    }

    // Return agents to live standby pulse after brief completion highlight
    setTimeout(() => {
      effectiveCrew.agents.forEach((a) => {
        setAgentLiveState(
          a.id,
          'standby_pulse',
          `Heartbeat 200 OK • Ready on ${a.model.replace('gemini/', '')}`,
          19
        );
      });
    }, 2800);
  };

  // 24/7 Autonomous Daemon Loop Countdown
  useEffect(() => {
    if (!autonomousDaemon) {
      setDaemonCountdown(20);
      return;
    }
    const timer = setInterval(() => {
      if (isRunning) return;
      setDaemonCountdown((prev) => {
        if (prev <= 1) {
          handleKickoff();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autonomousDaemon, isRunning]);

  // Generate Python Code
  const generatePythonCode = () => {
    const governorNote = `
# --- Gemini Credit & Argon Quota Governor (${geminiStrategy}) ---
import os
from itertools import cycle
from crewai import LLM

GEMINI_KEY_POOL = [
    k for k in [
        os.getenv("GEMINI_API_KEY"),
        os.getenv("GEMINI_API_KEY_0"),
        os.getenv("GEMINI_API_KEY_1"),
        os.getenv("GEMINI_API_KEY_2"),
        os.getenv("GEMINI_API_KEY_3"),
    ] if k
]
_key_cycle = cycle(GEMINI_KEY_POOL or ["YOUR_GEMINI_KEY"])

def get_managed_llm(preferred_model="gemini/gemini-3.8-flash", role="specialist", strategy="${geminiStrategy}"):
    """Rotates Gemini API keys and balances Free-Tier Flash vs Paid gemini-4-argon so jobs never hit 429 limits."""
    next_key = next(_key_cycle)
    if strategy == "free_tier_guard":
        model = "gemini/gemini-3.8-flash" if preferred_model == "gemini/gemini-4-argon" else preferred_model
    elif strategy == "hybrid_auto":
        is_complex = any(w in role.lower() for w in ["architect", "audit", "security", "manager", "lead"])
        model = "gemini/gemini-4-argon" if is_complex else "gemini/gemini-3.8-flash"
    else:
        model = preferred_model
    return LLM(model=model, api_key=next_key, temperature=0.2)
`;

    return `from crewai import Agent, Task, Crew, Process
from crewai.utilities.agent_utils import message_content_text
from crewai_tools import ${Array.from(new Set(crew.agents.flatMap((a) => a.tools))).join(', ') || 'SerperDevTool'}
${governorNote}
# --- Agents Setup ---
${crew.agents
  .map(
    (a) => `${a.id.replace(/-/g, '_')} = Agent(
    role="${a.role}",
    goal="${a.goal}",
    backstory="""${a.backstory}""",
    llm=get_managed_llm("${a.model}", "${a.role}"),
    tools=[${a.tools.map((t) => `${t}()`).join(', ')}],
    verbose=${a.verbose ? 'True' : 'False'},
    memory=${a.memory ? 'True' : 'False'},
    max_iter=${a.maxIter || 10}
)`
  )
  .join('\n\n')}

# --- Tasks Setup ---
${crew.tasks
  .map(
    (t) => `${t.id.replace(/-/g, '_')} = Task(
    description="""${t.description}""",
    expected_output="""${t.expectedOutput}""",
    agent=${t.agentId.replace(/-/g, '_')}
)`
  )
  .join('\n\n')}

# --- Crew Orchestration ---
crew = Crew(
    agents=[${crew.agents.map((a) => a.id.replace(/-/g, '_')).join(', ')}],
    tasks=[${crew.tasks.map((t) => t.id.replace(/-/g, '_')).join(', ')}],
    process=Process.${crew.process},
    verbose=${crew.verbose ? 'True' : 'False'},
    memory=${crew.memory ? 'True' : 'False'}
)

if __name__ == "__main__":
    result = crew.kickoff(inputs={"topic": "${runInput}"})
    # AGENTS.md Compliance: Never str() LLMMessage.content directly; collapse via message_content_text
    print(message_content_text(result.raw))
`;
  };

  // Generate Modern JSONC
  const generateJsonc = () => {
    const data = {
      name: crew.name,
      process: crew.process,
      agents: crew.agents.map((a) => ({
        id: a.id,
        role: a.role,
        goal: a.goal,
        backstory: a.backstory,
        tools: a.tools,
        settings: {
          verbose: a.verbose,
          memory: a.memory,
          max_iter: a.maxIter
        }
      })),
      tasks: crew.tasks.map((t) => ({
        name: t.name,
        description: t.description,
        expected_output: t.expectedOutput,
        agent: t.agentId,
        output_format: t.outputFormat
      }))
    };
    return JSON.stringify(data, null, 2);
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const selectedHistoryRun = executionHistory.find((r) => r.id === selectedHistoryRunId) || null;

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-10 py-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#EB6658]/10 text-[#EB6658] border border-[#EB6658]/30">
              <Layers className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Crew Studio Playground
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build, test, simulate, and export production-ready Multi-Agent Crews with live execution telemetry.
          </p>
        </div>

        {/* Preset Selector & Auto-save Status */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Current Project Context */}
          <div 
            onClick={onNavigateToGitHub}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EB6658]/5 border border-[#EB6658]/20 text-xs font-mono cursor-pointer hover:bg-[#EB6658]/10 transition"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#EB6658]" />
            <span className="text-slate-300">
              Context: <span className="text-[#EB6658] font-bold">{selectedRepo}</span>
              <span className="text-slate-500 mx-1">@</span>
              <span className="text-slate-400">{selectedBranch}</span>
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Auto-Save Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            {saveStatus === 'saving' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span className="text-amber-400">Saving workflow...</span>
              </>
            ) : saveStatus === 'saved' && lastSaved ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">
                  Auto-saved <span className="text-slate-500 font-sans text-[11px]">({lastSaved})</span>
                </span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Auto-save active</span>
              </>
            )}
          </div>

          {/* Quick Manual Save Button */}
          <button
            onClick={performSave}
            title="Force immediate save to localStorage"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition"
          >
            <Save className="w-3.5 h-3.5 text-[#EB6658]" />
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Reset Saved State to Default (with non-blocking inline toggle) */}
          {showResetConfirm ? (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 p-1 rounded-xl text-xs">
              <span className="text-red-400 text-[11px] px-1 font-medium">Reset all edits?</span>
              <button
                onClick={handleClearSavedWorkflow}
                className="px-2 py-0.5 rounded bg-red-500 text-white font-bold hover:bg-red-600 transition"
              >
                Yes
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset workflow to original preset"
              className="text-[11px] text-slate-500 hover:text-slate-300 transition px-1"
            >
              Reset
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Hidden File Input for Workflow Import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Import JSON Button */}
          <button
            onClick={handleTriggerImport}
            title="Import workflow from a JSON file"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Import JSON</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={handleExportJson}
            title="Export workflow to a JSON file"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export JSON</span>
          </button>

          {/* Execution History Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            title="View previous agent workflow runs and logs"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-amber-400 font-mono font-bold">
              {executionHistory.length}
            </span>
          </button>

          {/* Live Gmail Tool Button */}
          <button
            onClick={() => setShowGmailPanel((prev) => !prev)}
            title="Open GmailToolkit to read inbox threads or send agent reports"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition shadow-sm ${
              showGmailPanel
                ? 'bg-red-500/20 border-red-500/50 text-red-200'
                : 'bg-slate-900 hover:bg-slate-800 text-red-300 hover:text-white border-red-500/30'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-red-400" />
            <span>Gmail Tool</span>
          </button>

          {/* Reload / Upload .env Button */}
          <input
            ref={envFileInputRef}
            type="file"
            accept=".env,.txt,text/plain"
            onChange={handleUploadEnvFile}
            className="hidden"
          />
          <button
            onClick={handleReloadEnvFromDisk}
            title="Reload .env from workspace disk into server runtime"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reload .env</span>
            {loadedKeyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-[10px] font-mono text-emerald-400">
                {loadedKeyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => envFileInputRef.current?.click()}
            title="Upload & persist your local .env file into the workspace (.env is now persisted across container sleeps)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Upload .env</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Preset:</span>
            <select
              value={activePreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 outline-none focus:border-[#EB6658]"
            >
              <option value="tech_research">AI & Tech Research Crew</option>
              <option value="full_stack_app">Full Stack App Development</option>
              <option value="financial_audit">FinTech Risk & Audit Crew</option>
              <option value="devops_deployment">Autonomous DevOps & SRE Crew</option>
              <option value="content_strategy">Multi-Channel Content Synthesis</option>
              {!['tech_research', 'full_stack_app', 'financial_audit', 'devops_deployment', 'content_strategy'].includes(activePreset) && (
                <option value={activePreset}>{activePreset === 'custom' ? 'Custom / Imported Workflow' : activePreset}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Gemini Credit & Argon Quota Governor Panel */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/75 to-slate-950/90 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Gemini Credit & Paid Argon (`gemini-4-argon`) Quota Governor
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                {geminiQuota?.activeKeyCount || 5} Active Key Slots • Zero-Halt Routing
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automatically rotates across Free-Tier Gemini key slots (<code className="text-slate-300">GEMINI_API_KEY_0..3</code>) and balances <code className="text-[#EB6658] font-semibold">gemini-4-argon</code> (Paid Pro) with <code className="text-emerald-400 font-semibold">gemini-3.8-flash</code> / <code className="text-sky-400 font-semibold">3.1-flash-lite</code> so workflows never hit 429 limits.
            </p>
          </div>

          {/* Strategy Mode Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleStrategyChange('hybrid_auto')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                geminiStrategy === 'hybrid_auto'
                  ? 'bg-[#EB6658] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Offloads routine agent steps to Free-Tier Flash and reserves Paid Argon for Manager/Architect tasks"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Hybrid (Free + Argon)</span>
            </button>
            <button
              type="button"
              onClick={() => handleStrategyChange('free_tier_guard')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                geminiStrategy === 'free_tier_guard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Locks all execution to Free Tier models and rotates keys so Paid Argon credits are 100% preserved"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Free-Tier Guard ($0 Cost)</span>
            </button>
            <button
              type="button"
              onClick={() => handleStrategyChange('argon_priority')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                geminiStrategy === 'argon_priority'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Runs primary agents on Paid gemini-4-argon with automatic Free-Tier overflow if RPM or token cap is reached"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Argon Priority + Auto-Overflow</span>
            </button>
          </div>
        </div>

        {/* Live Telemetry & Key Slot Rotation Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80 items-center">
          {/* Key Slots Grid */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {(geminiQuota?.slots || [
              { slotId: 'slot-primary', label: 'Primary Key', maskedKey: 'AIzaSy•••', tier: 'paid_argon_capable', rpmUsed: 2, rpmLimit: 60, status: 'active' },
              { slotId: 'slot-0', label: 'Pool Slot #0', maskedKey: 'AIzaSy•••', tier: 'free_tier', rpmUsed: 1, rpmLimit: 15, status: 'standby' },
              { slotId: 'slot-1', label: 'Pool Slot #1', maskedKey: 'AIzaSy•••', tier: 'free_tier', rpmUsed: 1, rpmLimit: 15, status: 'standby' },
              { slotId: 'slot-2', label: 'Pool Slot #2', maskedKey: 'AIzaSy•••', tier: 'free_tier', rpmUsed: 0, rpmLimit: 15, status: 'standby' },
              { slotId: 'slot-3', label: 'Pool Slot #3', maskedKey: 'AIzaSy•••', tier: 'free_tier', rpmUsed: 0, rpmLimit: 15, status: 'standby' },
            ]).map((slot) => {
              const isSlotActive = slot.status === 'active';
              const pct = Math.min(100, Math.round((slot.rpmUsed / Math.max(1, slot.rpmLimit)) * 100));
              return (
                <div
                  key={slot.slotId}
                  className={`p-2.5 rounded-xl border text-[11px] space-y-1 transition ${
                    isSlotActive
                      ? 'bg-slate-900 border-emerald-500/60 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200 truncate">
                      {slot.label.replace(/\s*\(.*\)/, '')}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSlotActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{slot.tier === 'paid_argon_capable' ? 'Argon+Free' : 'Free Pool'}</span>
                    <span className="text-emerald-400 font-semibold">{slot.rpmUsed}/{slot.rpmLimit} RPM</span>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Argon Budget Cap & Actions */}
          <div className="md:col-span-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">Paid Argon Session Cap:</span>
                <select
                  aria-label="Paid Argon session token budget cap"
                  value={argonBudgetCap}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setArgonBudgetCap(val);
                    localStorage.setItem('crewai_argon_budget_cap', String(val));
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] font-mono text-slate-200 outline-none focus:border-[#EB6658]"
                >
                  <option value={10000}>10k tokens (Strict Cap)</option>
                  <option value={50000}>50k tokens (Balanced)</option>
                  <option value={200000}>200k tokens (Deep Work)</option>
                  <option value={1000000}>1M tokens (Max Argon)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-300">
                  Argon Used: <strong className="text-[#EB6658]">{(geminiQuota?.argonTokensUsedSession ?? 2450).toLocaleString()}</strong>
                </span>
                <span className="text-slate-300">
                  Saved via Free: <strong className="text-emerald-400">+{(geminiQuota?.freeTierTokensSaved ?? 14820).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSimulateSlotRotation}
                className="px-2.5 py-1.5 rounded-lg bg-[#EB6658]/15 hover:bg-[#EB6658]/25 text-[#EB6658] border border-[#EB6658]/30 text-[11px] font-semibold transition flex items-center gap-1"
                title="Test intelligent key slot rotation and Free/Argon load balancing"
              >
                <Zap className="w-3 h-3" />
                <span>Rotate & Test</span>
              </button>
              <button
                type="button"
                onClick={handleResetGeminiQuota}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
                title="Reset session RPM & Argon budget counters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all duration-200 shadow-lg ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-black/20"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Gmail Workspace Panel inside Crew Studio */}
      {showGmailPanel && (
        <GmailWorkspacePanel
          compact
          onUseEmailAsCrewInput={(formattedTopic) => {
            setRunInput(formattedTopic);
            showNotification('success', 'Loaded Gmail thread into Crew Mission Input');
          }}
          defaultComposeSubject={`[${crew.name}] Autonomous Execution Report`}
          defaultComposeBody={
            logs.length > 0
              ? logs.map((l) => `[${l.type.toUpperCase()}] ${l.title}: ${l.content}`).join('\n\n')
              : executionHistory[0]?.summary || ''
          }
        />
      )}

      {/* Real-Time Agent Heartbeat Monitor & 24/7 Autonomous Watchdog */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Activity className={`w-5 h-5 ${isRunning ? 'text-[#EB6658] animate-bounce' : 'animate-pulse'}`} />
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                  isRunning ? 'bg-[#EB6658] animate-ping' : 'bg-emerald-400 animate-ping'
                }`}
              />
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                  isRunning ? 'bg-[#EB6658]' : 'bg-emerald-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Real-Time Agent Heartbeat & 24/7 Autonomous Watchdog
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold flex items-center gap-1.5 ${
                    isRunning
                      ? 'bg-[#EB6658]/20 text-[#EB6658] border-[#EB6658]/40'
                      : autonomousDaemon
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isRunning ? 'bg-[#EB6658] animate-ping' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  {isRunning
                    ? 'EXECUTING MISSION • HIGH-FREQUENCY PULSE'
                    : autonomousDaemon
                    ? `24/7 DAEMON ACTIVE • NEXT CYCLE IN ${daemonCountdown}S`
                    : `${crew.agents.length}/${crew.agents.length} AGENTS ONLINE • HEARTBEAT 200 OK`}
                </span>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                  Tick #{heartbeatTick} • Slot: {serverHeartbeatSlot}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Live telemetry pulse across all configured agents with automatic stalled-task recovery, key rotation, and 24/7 zero-supervision loop controls.
              </p>
            </div>
          </div>

          {/* 24/7 Autonomous Daemon & Blueprint Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setAutonomousDaemon((prev) => {
                  const next = !prev;
                  showNotification(
                    'success',
                    next
                      ? '24/7 Autonomous Zero-Supervision Daemon enabled (auto-cycling every 20s)'
                      : '24/7 Autonomous Daemon paused — manual kickoff mode'
                  );
                  return next;
                });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                autonomousDaemon
                  ? 'bg-indigo-600/25 border-indigo-400 text-indigo-200 shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
              title="Enable continuous 24/7 autonomous execution cycles with zero user supervision"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autonomousDaemon ? 'bg-indigo-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span>
                {autonomousDaemon
                  ? `24/7 Autonomous Loop: ON (${daemonCountdown}s • ${daemonCycles} cycles)`
                  : 'Enable 24/7 Zero-Supervision Daemon'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAutonomyBlueprint((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                showAutonomyBlueprint
                  ? 'bg-[#EB6658]/20 border-[#EB6658]/50 text-[#EB6658]'
                  : 'bg-slate-950 hover:bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>24/7 Autonomy Architecture (6/6 Active)</span>
            </button>
          </div>
        </div>

        {/* Live Agent Heartbeat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
          {crew.agents.map((agent) => {
            const hb = agentHeartbeats[agent.id] || {
              agentId: agent.id,
              status: 'standby_pulse' as AgentLiveStatus,
              latencyMs: 21,
              bpm: 30,
              lastPulse: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              currentActivity: `Heartbeat 200 OK • Ready on ${agent.model.replace('gemini/', '')}`,
              pulseWave: [18, 22, 20, 24, 19, 21, 23, 20, 22, 19, 21, 20],
              uptimePct: '99.98%'
            };

            const isSelected = agent.id === selectedAgentId;
            const isAgentBusy = hb.status === 'reasoning' || hb.status === 'tool_exec' || hb.status === 'delegating';

            const statusBadgeConfig: Record<
              AgentLiveStatus,
              { label: string; dotClass: string; badgeClass: string; strokeColor: string }
            > = {
              standby_pulse: {
                label: autonomousDaemon ? 'WATCHDOG PULSE' : 'HEARTBEAT OK',
                dotClass: 'bg-emerald-400',
                badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
                strokeColor: '#34d399'
              },
              reasoning: {
                label: 'REASONING',
                dotClass: 'bg-[#EB6658]',
                badgeClass: 'bg-[#EB6658]/20 text-[#EB6658] border-[#EB6658]/40',
                strokeColor: '#EB6658'
              },
              tool_exec: {
                label: 'TOOL EXEC',
                dotClass: 'bg-amber-400',
                badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                strokeColor: '#fbbf24'
              },
              delegating: {
                label: 'DELEGATING',
                dotClass: 'bg-sky-400',
                badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                strokeColor: '#38bdf8'
              },
              completed: {
                label: 'VERIFIED 200 OK',
                dotClass: 'bg-emerald-400',
                badgeClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50',
                strokeColor: '#10b981'
              },
              self_healing: {
                label: 'SELF-HEALING',
                dotClass: 'bg-purple-400',
                badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                strokeColor: '#c084fc'
              }
            };

            const cfg = statusBadgeConfig[hb.status];
            const wave = hb.pulseWave.length > 1 ? hb.pulseWave : [20, 24, 19, 22, 21, 25];
            const svgPoints = wave
              .map((val, idx) => {
                const x = Math.round((idx / (wave.length - 1)) * 120);
                const normalized = Math.max(4, Math.min(24, 26 - Math.round((val / 160) * 20)));
                return `${x},${normalized}`;
              })
              .join(' ');

            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isAgentBusy
                    ? 'bg-slate-900/95 border-[#EB6658]/60 ring-1 ring-[#EB6658]/30 shadow-md'
                    : isSelected
                    ? 'bg-slate-900/90 border-slate-700 ring-1 ring-[#EB6658]/25'
                    : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Animated Multi-Ring Heartbeat Indicator */}
                    <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                      <span
                        className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dotClass} ${
                          isAgentBusy ? 'animate-ping' : 'animate-pulse'
                        }`}
                      />
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cfg.dotClass}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{agent.role}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${cfg.badgeClass}`}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* Live ECG Sparkline + Metrics */}
                <div className="flex items-center justify-between gap-3 bg-slate-900/70 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                  <svg className="w-28 h-7 overflow-visible shrink-0" viewBox="0 0 120 28">
                    <polyline
                      fill="none"
                      stroke={cfg.strokeColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={svgPoints}
                    />
                  </svg>
                  <div className="text-right font-mono text-[10px] leading-tight">
                    <div className="text-slate-200 font-semibold">
                      {hb.latencyMs}ms <span className="text-slate-500">•</span> {hb.bpm} BPM
                    </div>
                    <div className="text-slate-500 text-[9px]">Pulse {hb.lastPulse}</div>
                  </div>
                </div>

                {/* Live Activity Stream Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                  <span className="truncate max-w-[75%]" title={hb.currentActivity}>
                    {hb.currentActivity}
                  </span>
                  <span className="text-emerald-400 font-semibold shrink-0">{hb.uptimePct}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible 24/7 Zero-Supervision Autonomous Architecture Blueprint */}
        {showAutonomyBlueprint && (
          <div className="pt-3 border-t border-slate-800/90 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#EB6658]" />
                <span>6 Pillars for 24/7 Zero-Supervision Autonomous Coding</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                All 6 Subsystems Wired in Studio
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center justify-between">
                  <span>1. Heartbeat & Stalled-Agent Watchdog</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pings every agent every 2s. If an LLM call hangs or exceeds max_iter, the watchdog auto-restarts the step without human input.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-[#EB6658] flex items-center justify-between">
                  <span>2. Zero-Halt Multi-Key & Model Failover</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Rotates across <code className="text-slate-300">GEMINI_API_KEY_0..3</code>, balances Paid <code className="text-slate-300">gemini-4-argon</code> vs Free Flash, and falls back to local Ollama if rate-limited at 3 AM.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-sky-400 flex items-center justify-between">
                  <span>3. Self-Healing PyTest Sandbox (Jules)</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Runs generated code inside an ephemeral Linux VM with <code className="text-slate-300">pytest</code> and AST lint checks, feeding tracebacks back to the coder agent until tests pass.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>4. Durable Flow Checkpointing (@persist)</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Persists workflow state after every task handoff so long-running 24/7 coding pipelines resume from exact checkpoints on restart.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-indigo-400 flex items-center justify-between">
                  <span>5. Continuous Daemon & Inbox Triggers</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Polls GitHub branches, scheduled cron queues, and Gmail inbox threads to ingest new coding tasks and dispatch status reports automatically.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <div className="font-bold text-purple-400 flex items-center justify-between">
                  <span>6. Guardrailed Git Branch & PR Gatekeeper</span>
                  <span className="text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pushes verified commits to isolated feature branches (<code className="text-slate-300">jules/feat-*</code>) and opens PRs with test coverage diffs—never breaking <code className="text-slate-300">main</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Autonomy Strategy Dashboard: Jules Self-Healing, Code Coverage & Task Efficiency */}
      <AutonomyStrategyDashboard
        crewName={crew.name}
        agentsCount={crew.agents.length}
        tasksCount={crew.tasks.length}
        isCrewRunning={isRunning}
        onTriggerSelfHealingPulse={(repairSummary) => {
          showNotification('success', repairSummary);
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAgentHeartbeats((prev) => {
            const next = { ...prev };
            crew.agents.forEach((a) => {
              const cur = prev[a.id];
              next[a.id] = {
                agentId: a.id,
                status: 'self_healing',
                latencyMs: 54,
                bpm: 88,
                lastPulse: nowStr,
                currentActivity: `Jules Self-Healing AST & PyTest Pass Verified`,
                pulseWave: [...(cur?.pulseWave || [20, 22, 19, 24, 21, 20, 23, 18, 22, 20, 21]).slice(-11), 54],
                uptimePct: '99.99%'
              };
            });
            return next;
          });
          setTimeout(() => {
            const doneStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setAgentHeartbeats((prev) => {
              const next = { ...prev };
              crew.agents.forEach((a) => {
                const cur = prev[a.id];
                next[a.id] = {
                  ...(cur || {
                    agentId: a.id,
                    latencyMs: 19,
                    bpm: 30,
                    pulseWave: [20, 21, 19, 22, 20, 19],
                    uptimePct: '99.99%'
                  }),
                  status: 'standby_pulse',
                  latencyMs: 19,
                  bpm: 30,
                  lastPulse: doneStr,
                  currentActivity: `Heartbeat 200 OK • Self-Healed & Coverage Verified`
                };
              });
              return next;
            });
          }, 2200);
        }}
        onOpenJulesSandbox={
          onOpenJules
            ? () =>
                onOpenJules({
                  targetType: 'crew',
                  targetName: crew.name,
                  suggestedPrompt: `Execute autonomous self-healing & coverage optimization pass for ${crew.name}. Target >= 95% PyTest coverage and zero AST/type errors.`,
                  codeSnippet: activeCodeTab === 'python' ? generatePythonCode() : generateJsonc()
                })
            : undefined
        }
      />

      {/* Autonomous PR Review Module: Intercepts Jules PRs, Runs Secondary Review Agent & Suggests Automated Revisions */}
      <AutonomousPRReviewModule
        crewName={crew.name}
        selectedRepo={selectedRepo}
        runInput={runInput}
        latestPrTrigger={latestInterceptedPr}
        onEmitAuditLog={(newLog) => {
          const fullLog: ExecutionLog = {
            stage: 'github',
            severity: 'info',
            traceId: 'tr-pr-review',
            spanId: `sp-${Math.floor(Math.random() * 90 + 10)}`,
            isoTimestamp: new Date().toISOString(),
            ...newLog,
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setLogs((prev) => [...prev, fullLog]);
        }}
        onNotify={showNotification}
      />

      {/* Predictive Insights Dashboard: Recharts Visualization of Historical Merge Patterns & Jules Indexing Triggers */}
      <PredictiveInsightsDashboard
        crewName={crew.name}
        selectedRepo={selectedRepo}
        latestPrTrigger={latestInterceptedPr}
        onEmitAuditLog={(newLog) => {
          const fullLog: ExecutionLog = {
            stage: 'orchestrator',
            severity: 'info',
            traceId: 'tr-pred-insights',
            spanId: `sp-${Math.floor(Math.random() * 90 + 10)}`,
            isoTimestamp: new Date().toISOString(),
            ...newLog,
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setLogs((prev) => [...prev, fullLog]);
        }}
        onNotify={showNotification}
      />
      <div className="mt-6">
        <RepositoryHealthWidget />
      </div>

      {/* Predictive Scheduler Module: Analyzes Historical PR Merge Patterns to Pre-Fetch Codebase Indexing */}
      <PredictiveSchedulerModule
        crewName={crew.name}
        selectedRepo={selectedRepo}
        latestPrTrigger={latestInterceptedPr}
        onEmitAuditLog={(newLog) => {
          const fullLog: ExecutionLog = {
            stage: 'jules',
            severity: 'info',
            traceId: 'tr-pred-sched',
            spanId: `sp-${Math.floor(Math.random() * 90 + 10)}`,
            isoTimestamp: new Date().toISOString(),
            ...newLog,
            id: `log-${Date.now()}-${Math.random()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          setLogs((prev) => [...prev, fullLog]);
        }}
        onNotify={showNotification}
      />

      {/* Remote Control Module: Antigravity Agent Access */}
      <RemoteControlModule
        onNotify={showNotification}
      />
      <WebhookSettingsPanel onNotify={showNotification} />

      {/* Main Grid: Builder Left & Simulator/Code Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Agents & Tasks Builder (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Crew Configuration Bar */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">Process Mode:</span>
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setCrew((c) => ({ ...c, process: 'sequential' }))}
                  className={`px-3 py-1 rounded font-medium transition ${
                    crew.process === 'sequential'
                      ? 'bg-[#EB6658] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sequential
                </button>
                <button
                  onClick={() => setCrew((c) => ({ ...c, process: 'hierarchical' }))}
                  className={`px-3 py-1 rounded font-medium transition ${
                    crew.process === 'hierarchical'
                      ? 'bg-[#EB6658] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Hierarchical
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {crew.process === 'hierarchical' && (
                <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">Manager:</span>
                    {providerStatus && !providerStatus[MODEL_PROVIDER_MAP[crew.managerModel || ''] || ''] && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Fallback</span>
                      </span>
                    )}
                  </div>
                  <select
                    value={crew.managerModel || 'gemini/gemini-4-argon'}
                    onChange={(e) => setCrew((c) => ({ ...c, managerModel: e.target.value }))}
                    className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-[#EB6658]"
                  >
                    <option value="gemini/gemini-4-argon">Gemini 4 Argon (Paid Pro)</option>
                    <option value="gemini/gemini-3.8-flash">Gemini 3.8 Flash (Free Pool)</option>
                    <option value="gemini/gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (High Quota)</option>
                    <option value="gemini/gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="groq/llama-3.3-70b">Groq 70B</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={crew.memory}
                  onChange={(e) => setCrew((c) => ({ ...c, memory: e.target.checked }))}
                  className="rounded border-slate-700 text-[#EB6658] focus:ring-[#EB6658]"
                />
                <span>Shared Memory</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={crew.verbose}
                  onChange={(e) => setCrew((c) => ({ ...c, verbose: e.target.checked }))}
                  className="rounded border-slate-700 text-[#EB6658] focus:ring-[#EB6658]"
                />
                <span>Verbose Logging</span>
              </label>
            </div>
          </div>

          {/* Agents List & Editor */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Configured Agents ({crew.agents.length})</h3>
              </div>
              <button
                onClick={handleAddAgent}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#EB6658] bg-[#EB6658]/10 hover:bg-[#EB6658]/20 border border-[#EB6658]/30 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Agent</span>
              </button>
            </div>

            {/* Agent Selector Pills with Live Heartbeat Status */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {crew.agents.map((agent) => {
                const hb = agentHeartbeats[agent.id];
                const isBusy = hb && (hb.status === 'reasoning' || hb.status === 'tool_exec' || hb.status === 'delegating');
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-2 ${
                      agent.id === selectedAgentId
                        ? 'bg-[#EB6658] text-white shadow-sm'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isBusy ? 'bg-amber-300' : 'bg-emerald-400'
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isBusy ? 'bg-amber-300' : 'bg-emerald-400'
                        }`}
                      />
                    </span>
                    <span>{agent.name}</span>
                    {hb && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                          agent.id === selectedAgentId
                            ? 'bg-black/25 text-white'
                            : 'bg-slate-900/90 text-emerald-400'
                        }`}
                      >
                        {isBusy ? hb.status.toUpperCase() : `${hb.latencyMs}ms`}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Agent Details Form */}
            {currentAgent && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Editing: {currentAgent.name}</span>
                    {agentHeartbeats[currentAgent.id] && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>
                          Heartbeat {agentHeartbeats[currentAgent.id].latencyMs}ms • {agentHeartbeats[currentAgent.id].bpm} BPM
                        </span>
                      </span>
                    )}
                  </div>
                  {crew.agents.length > 1 && (
                    <button
                      onClick={() => handleDeleteAgent(currentAgent.id)}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Agent Name</label>
                    <input
                      type="text"
                      value={currentAgent.name}
                      onChange={(e) => handleUpdateAgent(currentAgent.id, { name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[#EB6658] outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <label className="text-slate-400 font-medium">Model</label>
                        {providerStatus && !providerStatus[MODEL_PROVIDER_MAP[currentAgent.model] || ''] && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Fallback Active</span>
                          </span>
                        )}
                      </div>
                      {onOpenOllamaScanner && (
                        <button
                          type="button"
                          onClick={onOpenOllamaScanner}
                          className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
                          title="Scan local PC for installed Ollama models"
                        >
                          <Laptop className="w-3 h-3" />
                          <span>Scan PC Ollama</span>
                        </button>
                      )}
                    </div>
                    <select
                      value={currentAgent.model}
                      onChange={(e) => handleUpdateAgent(currentAgent.id, { model: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[#EB6658] outline-none"
                    >
                      <optgroup label="Google Gemini Credit Governor (Free Pool + Paid Argon)">
                        <option value="gemini/gemini-4-argon">Google Gemini 4 Argon (Paid Pro • Deep Reasoning)</option>
                        <option value="gemini/gemini-3.8-flash">Google Gemini 3.8 Flash (Free Tier • Fast Workhorse)</option>
                        <option value="gemini/gemini-3.1-flash-lite">Google Gemini 3.1 Flash Lite (Free Tier • 30 RPM High Quota)</option>
                        <option value="gemini/gemini-3-flash-preview">Google Gemini 3 Flash Preview (Free Tier Pool)</option>
                        <option value="gemini/gemini-2.5-flash">Google Gemini 2.5 Flash (Free Tier Stable)</option>
                      </optgroup>
                      <optgroup label="External Cloud Providers (Auto-Fallback Enabled)">
                        <option value="groq/llama-3.3-70b">Groq Llama 3.3 70B</option>
                        <option value="deepseek/deepseek-chat">DeepSeek Chat</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                        <option value="anthropic/claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                      </optgroup>
                      <optgroup label="Local PC Hardware (Zero Cost)">
                        <option value="ollama/llama3.2:3b">ollama/llama3.2:3b (Local PC)</option>
                        <option value="ollama/deepseek-r1:8b">ollama/deepseek-r1:8b (Local PC)</option>
                        <option value="ollama-pool/llama3.2">Ollama Cloud (Failover Pool)</option>
                      </optgroup>
                    </select>
                    {GEMINI_MODEL_TIERS[currentAgent.model] && (
                      <span
                        className={`text-[10px] font-medium mt-1 flex items-center gap-1.5 ${
                          GEMINI_MODEL_TIERS[currentAgent.model].tier === 'paid_argon'
                            ? 'text-indigo-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                            GEMINI_MODEL_TIERS[currentAgent.model].tier === 'paid_argon'
                              ? 'bg-indigo-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>
                          {GEMINI_MODEL_TIERS[currentAgent.model].tier === 'paid_argon'
                            ? `Paid Argon Tier (${geminiStrategy === 'free_tier_guard' ? 'Auto-Shifted to Free Flash by Guard' : 'Protected by Session Cap & Free-Pool Overflow'})`
                            : `Free Tier Multi-Slot Pool (${GEMINI_MODEL_TIERS[currentAgent.model].rpmLimit} RPM/key • Auto-Rotates Keys)`}
                        </span>
                      </span>
                    )}
                    {currentAgent.model.startsWith('ollama/') && (
                      <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Local Hardware Mode: 0 Token Cost (Unlimited Quota on PC)
                      </span>
                    )}
                    {currentAgent.model === 'ollama-pool/llama3.2' && (
                      <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Continuous Free Credit Flow (Auto-Failover Active)
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Role</label>
                  <input
                    type="text"
                    value={currentAgent.role}
                    onChange={(e) => handleUpdateAgent(currentAgent.id, { role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[#EB6658] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Goal</label>
                  <input
                    type="text"
                    value={currentAgent.goal}
                    onChange={(e) => handleUpdateAgent(currentAgent.id, { goal: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[#EB6658] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Backstory</label>
                  <textarea
                    rows={2}
                    value={currentAgent.backstory}
                    onChange={(e) => handleUpdateAgent(currentAgent.id, { backstory: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:border-[#EB6658] outline-none resize-none"
                  />
                </div>

                {/* Assigned Tools */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Equipped Tools</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TOOLS_CATALOG.slice(0, 8).map((tool) => {
                      const isEquipped = currentAgent.tools.includes(tool.name);
                      return (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => {
                            const newTools = isEquipped
                              ? currentAgent.tools.filter((t) => t !== tool.name)
                              : [...currentAgent.tools, tool.name];
                            handleUpdateAgent(currentAgent.id, { tools: newTools });
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-medium transition border ${
                            isEquipped
                              ? 'bg-[#EB6658]/20 border-[#EB6658] text-[#EB6658]'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {tool.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tasks Pipeline */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Tasks Pipeline ({crew.tasks.length})</h3>
              </div>
              <button
                onClick={handleAddTask}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#EB6658] bg-[#EB6658]/10 hover:bg-[#EB6658]/20 border border-[#EB6658]/30 rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="space-y-3">
              {crew.tasks.map((task, idx) => {
                const assignedAgent = crew.agents.find((a) => a.id === task.agentId);
                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EB6658]/20 text-[#EB6658] flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={task.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCrew((c) => ({
                              ...c,
                              tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, name: val } : t))
                            }));
                          }}
                          className="font-semibold text-slate-200 bg-transparent border-b border-transparent hover:border-slate-700 focus:border-[#EB6658] outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={task.agentId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCrew((c) => ({
                              ...c,
                              tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, agentId: val } : t))
                            }));
                          }}
                          className="bg-slate-900 text-[11px] text-slate-300 px-2 py-1 rounded border border-slate-700 outline-none"
                        >
                          {crew.agents.map((a) => (
                            <option key={a.id} value={a.id}>
                              Assign: {a.name}
                            </option>
                          ))}
                        </select>

                        {crew.tasks.length > 1 && (
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={task.description}
                        placeholder="Task description..."
                        onChange={(e) => {
                          const val = e.target.value;
                          setCrew((c) => ({
                            ...c,
                            tasks: c.tasks.map((t) => (t.id === task.id ? { ...t, description: val } : t))
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-300 outline-none focus:border-[#EB6658]"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Telemetry & Code Export (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Structured, Searchable Audit Log Stream Panel (Orchestrator -> Crew -> Jules -> GitHub PR) */}
          <StructuredAuditLogPanel
            logs={logs}
            agents={crew.agents}
            isRunning={isRunning}
            runInput={runInput}
            onRunInputChange={setRunInput}
            onKickoff={handleKickoff}
            fullCycleEnabled={fullCycleEnabled}
            onToggleFullCycle={setFullCycleEnabled}
            activeCycleStage={activeCycleStage}
            executionHistoryCount={executionHistory.length}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onLoadSampleCycleTrace={() => setLogs(buildSampleCycleLogs(crew, runInput))}
            onClearLogs={() => setLogs([])}
          />

          {/* Export Code Card */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#EB6658]" />
                <h3 className="text-sm font-bold text-white">Generated Code Export</h3>
              </div>

              <div className="flex items-center gap-2">
                {onOpenJules && (
                  <button
                    onClick={() =>
                      onOpenJules({
                        targetType: 'crew',
                        targetName: crew.name,
                        suggestedPrompt: `Autonomous validation & test suite for ${crew.name}. Boot cloud VM, install dependencies, run pytest suite, and open verified GitHub PR.`,
                        codeSnippet: activeCodeTab === 'python' ? generatePythonCode() : generateJsonc()
                      })
                    }
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-500/30 transition shadow-sm"
                    title="Run autonomous cloud VM tests and open a verified PR with Google Jules"
                  >
                    <Cpu className="w-3 h-3 text-blue-400" />
                    <span>Test & PR via Jules</span>
                  </button>
                )}

                {onNavigateToGitHub && (
                  <button
                    onClick={onNavigateToGitHub}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#EB6658] bg-[#EB6658]/10 hover:bg-[#EB6658]/20 px-2.5 py-1 rounded-lg border border-[#EB6658]/30 transition"
                  >
                    <span>Push to GitHub</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setActiveCodeTab('python')}
                    className={`px-2.5 py-0.5 rounded font-medium ${
                      activeCodeTab === 'python' ? 'bg-[#EB6658] text-white' : 'text-slate-400'
                    }`}
                  >
                    crew.py
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('jsonc')}
                    className={`px-2.5 py-0.5 rounded font-medium ${
                      activeCodeTab === 'jsonc' ? 'bg-[#EB6658] text-white' : 'text-slate-400'
                    }`}
                  >
                    crew.jsonc
                  </button>
                </div>
              </div>
            </div>

            <div className="relative rounded-xl border border-slate-800 bg-[#090D16] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-xs">
                <span className="font-mono text-[11px] text-slate-400">
                  {activeCodeTab === 'python' ? 'Python Standalone Script' : 'Modern JSONC Spec'}
                </span>
                <button
                  onClick={() => copyCode(activeCodeTab === 'python' ? generatePythonCode() : generateJsonc())}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
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
              <pre className="p-3 text-[11px] font-mono text-slate-300 h-64 overflow-y-auto leading-relaxed">
                <code>{activeCodeTab === 'python' ? generatePythonCode() : generateJsonc()}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Execution History Modal & Telemetry Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="w-full max-w-5xl bg-[#0B0F19] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-wide">Execution History</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-slate-700">
                      {executionHistory.length} Runs Recorded
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Audit log of previous agent workflow executions, timestamps, latency, token consumption, and outputs.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportHistory}
                  disabled={executionHistory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium transition cursor-pointer"
                  title="Export history to JSON"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Export JSON</span>
                </button>
                <button
                  onClick={handleClearHistory}
                  disabled={executionHistory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 disabled:opacity-40 text-xs font-medium transition cursor-pointer"
                  title="Clear all recorded execution runs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear History</span>
                </button>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Close modal (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="px-6 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Filter by crew name, topic, or log keyword..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px]">Status:</span>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  {(['all', 'completed', 'failed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setHistoryFilterStatus(st)}
                      className={`px-2.5 py-1 rounded capitalize font-medium transition cursor-pointer ${
                        historyFilterStatus === st ? 'bg-amber-500 text-black font-bold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Master-Detail Split Grid */}
            {(() => {
              const filteredHistory = executionHistory.filter((run) => {
                const matchesFilter = historyFilterStatus === 'all' || run.status === historyFilterStatus;
                const query = historySearchQuery.trim().toLowerCase();
                if (!query) return matchesFilter;
                const matchesQuery =
                  run.crewName.toLowerCase().includes(query) ||
                  run.inputTopic.toLowerCase().includes(query) ||
                  run.processMode.toLowerCase().includes(query) ||
                  run.logs.some((l) => l.content.toLowerCase().includes(query) || l.title.toLowerCase().includes(query));
                return matchesFilter && matchesQuery;
              });

              const activeRun =
                executionHistory.find((r) => r.id === selectedHistoryRunId) ||
                filteredHistory[0] ||
                executionHistory[0] ||
                null;

              return (
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  {/* Left Column: List of Run Records (5 cols) */}
                  <div className="md:col-span-5 overflow-y-auto p-4 space-y-2.5 max-h-[55vh] md:max-h-none">
                    {filteredHistory.length === 0 ? (
                      <div className="text-center p-8 text-slate-500 space-y-2">
                        <History className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs">No execution runs found matching filter.</p>
                      </div>
                    ) : (
                      filteredHistory.map((run) => {
                        const isSelected = activeRun?.id === run.id;
                        return (
                          <div
                            key={run.id}
                            onClick={() => setSelectedHistoryRunId(run.id)}
                            className={`p-3 rounded-2xl border transition cursor-pointer relative group ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md'
                                : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-semibold text-white truncate max-w-[170px]">{run.crewName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400">{run.timestamp}</span>
                                <button
                                  onClick={(e) => handleDeleteRun(run.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                                  title="Delete run record"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-400 truncate mb-2">
                              Topic: <span className="text-slate-200">"{run.inputTopic}"</span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/60">
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 capitalize border border-slate-800">
                                {run.processMode}
                              </span>
                              <span>{(run.durationMs / 1000).toFixed(1)}s</span>
                              <span>{run.tokensUsed.toLocaleString()} tokens</span>
                              <span className="text-emerald-400 font-bold">200 OK</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column: Run Detail Inspector (7 cols) */}
                  <div className="md:col-span-7 flex flex-col overflow-hidden bg-[#080B14]">
                    {activeRun ? (
                      <div className="flex flex-col h-full overflow-hidden">
                        {/* Detail Header */}
                        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">{activeRun.crewName}</h3>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                {activeRun.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              {activeRun.timestamp} • Topic: "{activeRun.inputTopic}"
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLoadRunLogs(activeRun)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#EB6658] to-[#C94C3C] text-white text-xs font-bold shadow-sm hover:shadow transition cursor-pointer"
                              title="Load this run's logs into the active Simulator view"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Load into Simulator</span>
                            </button>

                            <button
                              onClick={() => handleCopyRunLogs(activeRun)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                              title="Copy log transcript to clipboard"
                            >
                              {copiedHistoryId === activeRun.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Metrics Bar */}
                        <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Process:</span>
                            <span className="text-slate-200 capitalize">{activeRun.processMode}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Agents / Tasks:</span>
                            <span className="text-slate-200">{activeRun.agentsCount} / {activeRun.tasksCount}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Latency:</span>
                            <span className="text-slate-200">{(activeRun.durationMs / 1000).toFixed(2)}s</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Tokens:</span>
                            <span className="text-amber-400">{activeRun.tokensUsed.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Logs Stream */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-xs">
                          {activeRun.logs.map((log) => (
                            <div
                              key={log.id}
                              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-[#EB6658] flex items-center gap-1.5">
                                  {log.type === 'tool_call' && <Wrench className="w-3 h-3" />}
                                  {log.type === 'thought' && <Cpu className="w-3 h-3" />}
                                  {log.type === 'task_complete' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                  <span>{log.title}</span>
                                </span>
                                <span className="text-slate-500">{log.timestamp}</span>
                              </div>

                              <div className="text-slate-300 text-[11px] font-sans leading-relaxed whitespace-pre-wrap">
                                {log.content}
                              </div>

                              {log.meta && (
                                <div className="flex gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                                  {log.meta.tokens && <span>Tokens: {log.meta.tokens}</span>}
                                  {log.meta.durationMs && <span>Latency: {log.meta.durationMs}ms</span>}
                                  {log.meta.toolName && <span>Tool: {log.meta.toolName}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 text-center space-y-2">
                        <History className="w-10 h-10 text-slate-700" />
                        <p className="text-xs">Select a run from the history list to inspect its logs.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Bottom Footer */}
            <div className="px-6 py-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">
                Persisted to localStorage: <code className="text-slate-400">crewai_studio_execution_history</code>
              </span>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
