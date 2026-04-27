import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, ChevronRight } from 'lucide-react';
import { useWebSocket } from '../../hooks';
import { useUIStore } from '../../stores/uiStore';

const breadcrumbMap: Record<string, string> = {
  '/': 'Dashboard',
  '/meetings/new': 'New Meeting',
  '/meetings': 'Meetings',
  '/tasks': 'Task Board',
  '/ask': 'Ask AI',
  '/settings': 'Settings',
};

export const Header: React.FC = () => {
  const location = useLocation();
  const { connected } = useWebSocket();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    ...pathSegments.map((seg, i) => {
      const path = '/' + pathSegments.slice(0, i + 1).join('/');
      return {
        label: breadcrumbMap[path] || seg.charAt(0).toUpperCase() + seg.slice(1),
        path,
      };
    }),
  ];

  return (
    <header className="fixed top-0 right-0 left-0 h-14 z-30 glass-strong border-b border-white/[0.06]">
      <motion.div
        animate={{ marginLeft: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="h-full flex items-center justify-between px-6"
      >
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path + i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />}
              <span
                className={
                  i === breadcrumbs.length - 1
                    ? 'text-text-primary font-medium'
                    : 'text-text-muted'
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* WebSocket status */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-success animate-pulse-dot' : 'bg-error'
              }`}
            />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-elevated transition-colors">
            <Bell className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-primary rounded-full" />
          </button>

          {/* User */}
          <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-bold text-white cursor-pointer">
            D
          </div>
        </div>
      </motion.div>
    </header>
  );
};
