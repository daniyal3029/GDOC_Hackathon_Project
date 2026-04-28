import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
      addNotification({ type: 'success', title: 'Welcome Back', message: 'Signed in successfully ✅' });
      navigate('/');
    } catch {
      // Error toast handled by axios interceptor
    }
  };

  const inputClass = 'w-full bg-background border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm text-text-secondary placeholder:text-text-muted focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 outline-none transition-all';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col gap-8"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-text-primary">Sign in to your account</h2>
        <p className="text-text-muted text-sm">Welcome back! Please enter your details.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
          <input type="email" required placeholder="Work Email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
          <input type="password" required placeholder="Password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-accent-glow hover:text-accent hover:underline transition-all">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? <div className="orbital-spinner scale-50" /> : (<>Sign In<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} /></>)}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link to="/register" className="text-accent-glow hover:text-accent font-medium hover:underline transition-all">Sign up</Link>
      </p>
    </motion.div>
  );
};

