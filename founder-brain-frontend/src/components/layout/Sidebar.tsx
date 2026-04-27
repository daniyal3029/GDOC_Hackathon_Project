import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Plus,
  FileText,
  CheckSquare,
  Sparkles,
  Settings,
  ChevronLeft,
  Zap,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../utils/constants';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/meetings/new', label: 'New Meeting', icon: Plus },
  { path: '/meetings', label: 'Meetings', icon: FileText },
  { path: '/tasks', label: 'Task Board', icon: CheckSquare },
  { path: '/ask', label: 'Ask AI', icon: Sparkles, badge: 'NEW' },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed left-0 top-0 h-screen z-40 glass-strong flex flex-col"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center shrink-0 shadow-glow-sm">
            <Zap className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-semibold text-text-primary whitespace-nowrap"
            >
              Founder Brain
            </motion.span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <NavLink
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative',
                  isActive
                    ? 'bg-accent-primary/10 text-accent-glow'
                    : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn('w-5 h-5 shrink-0', isActive ? 'text-accent-glow' : '')}
                  strokeWidth={1.5}
                />
                {!sidebarCollapsed && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-gradient-hero text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-white/[0.06]">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-elevated transition-all"
        >
          <Settings className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:text-text-secondary hover:bg-elevated transition-all mt-1"
        >
          <motion.div
            animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={1.5} />
          </motion.div>
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>

        {/* User avatar */}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-surface">
            <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-xs font-bold text-white">
              D
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">Daniyal</p>
              <p className="text-xs text-text-muted truncate">demo-user-001</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
};
