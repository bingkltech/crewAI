import React, { useState } from 'react';
import { Terminal, RefreshCw, Send } from 'lucide-react';

interface RemoteControlModuleProps {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

export const RemoteControlModule: React.FC<RemoteControlModuleProps> = ({ onNotify }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async () => {
    if (!input) return;
    setIsExecuting(true);
    setOutput('Executing command...');
    try {
      const res = await fetch('/api/remote-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (res.ok) {
        setOutput(data.output || 'No output.');
        onNotify?.('success', 'Antigravity agent executed successfully.');
      } else {
        setOutput(`Error: ${data.error}`);
        onNotify?.('error', 'Remote control execution failed.');
      }
    } catch (err: any) {
      setOutput(`Error: ${err.message}`);
      onNotify?.('error', 'Remote control execution failed.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-4">
      <div className="flex items-center gap-2 text-white font-bold">
        <Terminal className="w-5 h-5 text-indigo-400" />
        <h3>Remote Control (Antigravity Agent)</h3>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Command for the antigravity agent..."
          className="flex-grow p-2 rounded bg-slate-800 border border-slate-700 text-white"
        />
        <button
          onClick={handleExecute}
          disabled={isExecuting}
          className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:opacity-50"
        >
          {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-3 rounded bg-slate-950 text-slate-300 font-mono text-sm h-40 overflow-y-auto whitespace-pre-wrap border border-slate-800">
        {output || 'Agent output will appear here.'}
      </div>
    </div>
  );
};
