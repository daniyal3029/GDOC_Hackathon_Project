import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { OtpSuccessAnimation } from '../../components/shared/OtpSuccessAnimation';

type Step = 'register' | 'verify' | 'success';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, verifySignup, isLoading } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [step, setStep] = useState<Step>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    try {
      await register(name, email, password);
      addNotification({ type: 'success', title: 'Check Email', message: 'Verification OTP has been sent to your email.' });
      setStep('verify');
    } catch {
      // Error toast handled by axios interceptor
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    try {
      await verifySignup(email, otp);
      setStep('success'); // Show success animation
    } catch {
      // Error toast handled by axios interceptor
    }
  };

  const handleResendOtp = async () => {
    try {
      await register(name, email, password);
      addNotification({ type: 'success', title: 'OTP Resent', message: 'A new OTP has been sent to your email.' });
    } catch {
      // handled
    }
  };

  const inputClass = 'w-full bg-background border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm text-text-secondary placeholder:text-text-muted focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 outline-none transition-all';

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* Step 1: Registration Form */}
        {step === 'register' && (
          <motion.div
            key="register-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary">Create an account</h2>
              <p className="text-text-muted text-sm">Join Founder Brain to supercharge your meetings.</p>
            </div>

            <form onSubmit={handleRegister} className="flex flex-col gap-5">
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="text" required placeholder="Full Name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="email" required placeholder="Work Email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="password" required placeholder="Password (min 8 chars)" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <div className="orbital-spinner scale-50" /> : (<>Sign Up<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} /></>)}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-accent-glow hover:text-accent font-medium hover:underline transition-all">Sign in</Link>
            </p>
          </motion.div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'verify' && (
          <motion.div
            key="verify-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="w-8 h-8 text-accent-glow" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">Verify your email</h2>
              <p className="text-text-muted text-sm px-4">
                We sent a 6-digit code to <span className="text-text-primary font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col gap-5">
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter OTP code"
                  className="w-full bg-background border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-lg text-center font-mono tracking-[0.5em] text-text-primary placeholder:text-text-muted placeholder:tracking-normal placeholder:text-sm placeholder:font-sans focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 outline-none transition-all"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <div className="orbital-spinner scale-50" /> : (<>Verify Account<CheckCircle2 className="w-4 h-4" strokeWidth={2} /></>)}
              </button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-text-secondary">
                Didn't receive the code?{' '}
                <button onClick={handleResendOtp} disabled={isLoading} className="text-accent-glow hover:text-accent font-medium hover:underline transition-all disabled:opacity-50">
                  Resend
                </button>
              </p>
              <button onClick={() => setStep('register')} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                ← Back to registration
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Success Animation */}
        {step === 'success' && (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <OtpSuccessAnimation
              title="Account Verified!"
              subtitle="Your account is ready. Redirecting to sign in..."
              onComplete={() => navigate('/login')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
