import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import type { NotificationType } from '../../stores/notificationStore';

const iconMap: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />,
  error: <AlertCircle className="w-5 h-5 text-error" strokeWidth={1.5} />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" strokeWidth={1.5} />,
  info: <Info className="w-5 h-5 text-accent-glow" strokeWidth={1.5} />,
};

const bgMap: Record<NotificationType, string> = {
  success: 'border-success/20',
  error: 'border-error/20',
  warning: 'border-warning/20',
  info: 'border-accent-primary/20',
};

export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto glass-strong rounded-xl border ${bgMap[notif.type]} p-4 shadow-card`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5">{iconMap[notif.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                {notif.message && (
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{notif.message}</p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="shrink-0 p-1 hover:bg-elevated rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
