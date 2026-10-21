import React, { useState, useEffect } from 'react';
import { GitCommit, GitPullRequest, Activity } from 'lucide-react';

export const RepositoryHealthWidget: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/github/repository-health')
      .then(res => res.json())
      .then(data => {
        setHealth(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch repository health:', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="text-slate-400">Loading Repository Health...</div>;
  if (!health) return <div className="text-red-400">Failed to load Repository Health</div>;

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-4">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-400" />
        Repository Health
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 p-3 rounded-lg">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <GitCommit className="w-3 h-3" /> Commit Frequency
          </div>
          <div className="text-xl font-bold text-white">{health.commitFrequency} <span className="text-xs text-slate-500">/week</span></div>
        </div>
        <div className="bg-slate-900 p-3 rounded-lg">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <GitPullRequest className="w-3 h-3" /> PR Success Rate
          </div>
          <div className="text-xl font-bold text-white">{health.prSuccessRate}%</div>
        </div>
      </div>
    </div>
  );
};
