import React from 'react';
import { User, Bell, Shield } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>

      <div className="space-y-4">
        {[
          { icon: <User className="w-5 h-5" strokeWidth={1.5} />, title: 'Profile', desc: 'Manage your account information' },
          { icon: <Bell className="w-5 h-5" strokeWidth={1.5} />, title: 'Notifications', desc: 'Configure notification preferences' },
          { icon: <Shield className="w-5 h-5" strokeWidth={1.5} />, title: 'API Keys', desc: 'Manage API keys and integrations' },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-surface rounded-2xl p-6 glow-border hover:glow-border-hover transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-glow">
                {item.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{item.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-border-subtle">
        <p className="text-xs text-text-muted">
          Founder Brain v1.0.0 · Built for GDOC Hackathon
        </p>
      </div>
    </div>
  );
};
