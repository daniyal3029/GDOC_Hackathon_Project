import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, ClipboardPaste, FileText, CheckCircle2,
  Loader2, Sparkles, Lightbulb, ListChecks, AlertCircle, Zap,
} from 'lucide-react';
import { meetingApi } from '../../services/api/meetingApi';
import { getSocket } from '../../services/websocket/socket';
import { useNotificationStore } from '../../stores/notificationStore';
import { SAMPLE_MEETING_TEXT } from '../../utils/constants';
import type { WSMeetingStatus } from '../../types/websocket.types';

type ProcessingStep = 'queued' | 'processing' | 'ai_analysis' | 'saving_tasks' | 'generating_embeddings' | 'completed' | 'failed';

const stepConfig: { key: ProcessingStep; label: string; icon: React.ReactNode }[] = [
  { key: 'queued', label: 'Queued', icon: <Loader2 className="w-4 h-4" strokeWidth={1.5} /> },
  { key: 'ai_analysis', label: 'AI Analysis', icon: <Sparkles className="w-4 h-4" strokeWidth={1.5} /> },
  { key: 'saving_tasks', label: 'Extracting Tasks', icon: <ListChecks className="w-4 h-4" strokeWidth={1.5} /> },
  { key: 'generating_embeddings', label: 'Building Index', icon: <Zap className="w-4 h-4" strokeWidth={1.5} /> },
  { key: 'completed', label: 'Complete', icon: <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} /> },
];

export const InputMeetingPage: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotificationStore();

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingId, setMeetingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ProcessingStep | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const isValid = charCount >= 50 && charCount <= 50000;

  // WebSocket listener for processing status
  useEffect(() => {
    if (!meetingId) return;

    const socket = getSocket();

    // Join meeting room
    socket.emit('join:room', { room: `meeting:${meetingId}` });

    const handleStatus = (data: WSMeetingStatus) => {
      if (data.meetingId !== meetingId) return;
      setProgress(data.progress || 0);
      if (data.step) setCurrentStep(data.step as ProcessingStep);
      if (data.status === 'completed') setCurrentStep('completed');
    };

    const handleCompleted = (data: any) => {
      if (data.meetingId !== meetingId) return;
      setCurrentStep('completed');
      setProgress(100);
      addNotification({ type: 'success', title: 'Meeting processed!', message: `${data.tasksCount || 0} tasks extracted.` });
    };

    const handleFailed = (data: any) => {
      if (data.meetingId !== meetingId) return;
      setCurrentStep('failed');
      setError(data.error || 'Processing failed');
      addNotification({ type: 'error', title: 'Processing failed', message: data.error });
    };

    socket.on('meeting:status', handleStatus);
    socket.on('meeting:completed', handleCompleted);
    socket.on('meeting:failed', handleFailed);

    return () => {
      socket.off('meeting:status', handleStatus);
      socket.off('meeting:completed', handleCompleted);
      socket.off('meeting:failed', handleFailed);
      socket.emit('leave:room', { room: `meeting:${meetingId}` });
    };
  }, [meetingId, addNotification]);

  // Polling fallback for status
  useEffect(() => {
    if (!meetingId || currentStep === 'completed' || currentStep === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const status = await meetingApi.getMeetingStatus(meetingId);
        setProgress(status.progress || 0);
        if (status.step) setCurrentStep(status.step as ProcessingStep);
        if (status.status === 'completed') {
          setCurrentStep('completed');
          setProgress(100);
          clearInterval(interval);
        }
        if (status.status === 'failed') {
          setCurrentStep('failed');
          setError(status.error || 'Processing failed');
          clearInterval(interval);
        }
      } catch { /* silent */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [meetingId, currentStep]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await meetingApi.processMeeting(text);
      setMeetingId(result.meetingId);
      setCurrentStep('queued');
      setProgress(5);
    } catch {
      setIsSubmitting(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      setText(clipText);
    } catch {
      addNotification({ type: 'warning', title: 'Clipboard access denied' });
    }
  };

  const currentStepIdx = stepConfig.findIndex((s) => s.key === currentStep);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-6">Process Meeting</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-3">
          <div className="bg-surface rounded-2xl p-6 glow-border space-y-5">
            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Meeting Notes <span className="text-error">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your meeting notes, transcript, or minutes here..."
                  disabled={!!meetingId}
                  className="w-full min-h-[320px] p-4 bg-base border border-border-subtle rounded-lg text-sm text-text-primary font-mono placeholder-text-muted resize-y focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30 transition-colors disabled:opacity-50"
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-3">
                  <span className={`text-xs ${charCount < 50 ? 'text-error' : charCount > 50000 ? 'text-error' : 'text-text-muted'}`}>
                    {charCount.toLocaleString()} / 50,000
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            {!meetingId && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePaste}
                  className="flex items-center gap-2 px-4 py-2.5 bg-elevated hover:bg-border-subtle text-text-secondary rounded-lg text-sm transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4" strokeWidth={1.5} />
                  Paste
                </button>
                <button
                  onClick={() => setText(SAMPLE_MEETING_TEXT)}
                  className="flex items-center gap-2 px-4 py-2.5 text-text-muted hover:text-text-secondary text-sm transition-colors"
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  Load Example
                </button>
              </div>
            )}

            {/* Submit */}
            {!meetingId && (
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-accent-primary hover:bg-accent-primary/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all shadow-glow disabled:shadow-none"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                ) : (
                  <>
                    Process Meeting
                    <Send className="w-4 h-4" strokeWidth={1.5} />
                  </>
                )}
              </button>
            )}

            {/* Processing Status */}
            <AnimatePresence>
              {meetingId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t border-border-subtle"
                >
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-base rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-gradient-hero rounded-full"
                    />
                  </div>

                  {/* Steps */}
                  <div className="space-y-3">
                    {stepConfig.map((step, i) => {
                      const isDone = i < currentStepIdx;
                      const isActive = i === currentStepIdx && currentStep !== 'completed';
                      const isCurrent = step.key === currentStep;
                      const isFailed = currentStep === 'failed' && isActive;

                      return (
                        <div
                          key={step.key}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isDone
                              ? 'bg-success/5'
                              : isActive
                              ? 'bg-accent-primary/10'
                              : 'bg-base/50'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isDone
                                ? 'bg-success/20 text-success'
                                : isActive
                                ? 'bg-accent-primary/20 text-accent-glow'
                                : 'bg-elevated text-text-muted'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                            ) : isActive ? (
                              <div className="animate-spin">{step.icon}</div>
                            ) : isCurrent && step.key === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.5} />
                            ) : (
                              step.icon
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isDone
                                ? 'text-success'
                                : isActive
                                ? 'text-text-primary'
                                : 'text-text-muted'
                            }`}
                          >
                            {step.label}
                          </span>
                          {isActive && (
                            <div className="ml-auto w-2 h-2 rounded-full bg-accent-glow animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-error shrink-0" strokeWidth={1.5} />
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}

                  {/* View Results */}
                  {currentStep === 'completed' && (
                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => navigate(`/meetings/${meetingId}`)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-success hover:bg-success/80 text-white font-medium rounded-lg transition-colors"
                    >
                      View Results
                      <Send className="w-4 h-4" strokeWidth={1.5} />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
              What you'll get
            </h3>
            {[
              { icon: <FileText className="w-5 h-5 text-accent-glow" strokeWidth={1.5} />, title: 'AI Summary', desc: 'Concise meeting summary highlighting key points' },
              { icon: <Lightbulb className="w-5 h-5 text-accent-cyan" strokeWidth={1.5} />, title: 'Key Decisions', desc: 'All decisions made, extracted and organized' },
              { icon: <ListChecks className="w-5 h-5 text-success" strokeWidth={1.5} />, title: 'Action Items', desc: 'Tasks with owners and deadlines, auto-assigned' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-surface rounded-2xl p-5 glow-border group hover:glow-border-hover transition-shadow"
                style={{ transform: `perspective(800px) rotateY(-2deg)` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{item.title}</h4>
                    <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
