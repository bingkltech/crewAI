import React, { useState, useEffect } from 'react';
import { Bell, Webhook, Save } from 'lucide-react';

export const WebhookSettingsPanel: React.FC<{ onNotify: (type: 'success' | 'error', message: string) => void }> = ({ onNotify }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookType, setWebhookType] = useState<'slack' | 'discord'>('slack');

  useEffect(() => {
    fetch('/api/webhooks')
      .then(res => res.json())
      .then(data => {
        setWebhookUrl(data.url || '');
        setWebhookType(data.type || 'slack');
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, type: webhookType })
      });
      if (res.ok) {
        onNotify('success', 'Webhook settings saved successfully');
      } else {
        onNotify('error', 'Failed to save webhook settings');
      }
    } catch {
      onNotify('error', 'Network error while saving webhook');
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2">
        <Bell className="w-4 h-4 text-amber-400" />
        Automated Alerts Settings
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Webhook Type</label>
          <select 
            value={webhookType} 
            onChange={(e) => setWebhookType(e.target.value as 'slack' | 'discord')}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          >
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1">Webhook URL</label>
          <input 
            type="text" 
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
        >
          <Save className="w-3.5 h-3.5" />
          Save Webhook
        </button>
      </div>
    </div>
  );
};
