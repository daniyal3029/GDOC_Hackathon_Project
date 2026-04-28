import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { OtpSuccessAnimation } from '../../components/shared/OtpSuccessAnimation';

type Step = 'email' | 'otp' | 'newPassword' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, isLoading } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inputClass = 'w-full bg-background border border-border-subtle rounded-xl py-3 pl-11 pr-4 text-sm text-text-secondary placeholder:text-text-muted focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 outline-none transition-all';

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await forgotPassword(email);
      addNotification({ type: 'success', title: 'OTP Sent', message: 'If your email is registered, you will receive a reset code.' });
      setStep('otp');
    } catch {
      // handled
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return;
    setStep('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      addNotification({ type: 'warning', title: 'Mismatch', message: 'Passwords do not match.' });
      return;
    }
    try {
      await resetPassword(email, otp, newPassword);
      setStep('success'); // Show success animation
    } catch {
      // handled
    }
  };

  const handleResendOtp = async () => {
    try {
      await forgotPassword(email);
      addNotification({ type: 'success', title: 'OTP Resent', message: 'A new OTP has been sent to your email.' });
    } catch {
      // handled
    }
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <motion.div
            key="email-step"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary">Forgot Password?</h2>
              <p className="text-text-muted text-sm">Enter your email and we'll send you a reset code.</p>
            </div>

            <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="email" required placeholder="Your registered email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <div className="orbital-spinner scale-50" /> : (<>Send Reset Code<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} /></>)}
              </button>
            </form>

            <p className="text-center text-sm text-text-secondary">
              <Link to="/login" className="text-accent-glow hover:text-accent font-medium hover:underline transition-all flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </p>
          </motion.div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <motion.div
            key="otp-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-8 h-8 text-accent-glow" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-semibold text-text-primary">Enter Reset Code</h2>
              <p className="text-text-muted text-sm px-4">
                We sent a 6-digit code to <span className="text-text-primary font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
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
                disabled={otp.length < 6}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Continue<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </button>
            </form>

            <div className="text-center space-y-2">
              <p className="text-sm text-text-secondary">
                Didn't receive the code?{' '}
                <button onClick={handleResendOtp} disabled={isLoading} className="text-accent-glow hover:text-accent font-medium hover:underline transition-all disabled:opacity-50">
                  Resend
                </button>
              </p>
              <button onClick={() => setStep('email')} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                ← Change email
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: New Password */}
        {step === 'newPassword' && (
          <motion.div
            key="password-step"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-text-primary">Set New Password</h2>
              <p className="text-text-muted text-sm">Choose a strong password for your account.</p>
            </div>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="password" required placeholder="New Password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>

              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent-glow transition-colors" strokeWidth={1.5} />
                <input type="password" required placeholder="Confirm New Password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-accent-primary to-accent hover:from-accent-primary/90 hover:to-accent/90 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-accent/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <div className="orbital-spinner scale-50" /> : (<>Reset Password<CheckCircle2 className="w-4 h-4" strokeWidth={2} /></>)}
              </button>
            </form>

            <button onClick={() => setStep('otp')} className="text-center text-xs text-text-muted hover:text-text-secondary transition-colors">
              ← Back to OTP
            </button>
          </motion.div>
        )}

        {/* Step 4: Success Animation */}
        {step === 'success' && (
          <motion.div
            key="success-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <OtpSuccessAnimation
              title="Password Reset!"
              subtitle="Your password has been changed. Redirecting to sign in..."
              onComplete={() => navigate('/login')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
