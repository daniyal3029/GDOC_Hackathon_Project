import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, CheckCircle2,
  Sparkles, Copy, Check, FileText, Lightbulb, ListChecks,
  AlertCircle,
} from 'lucide-react';
import { meetingApi } from '../../services/api/meetingApi';
import { taskApi } from '../../services/api/taskApi';
import { format } from '../../utils/dateFormatter';
import { cn, getStatusDot, getDeadlineBg, getInitials, truncate } from '../../utils/constants';
import { useNotificationStore } from '../../stores/notificationStore';
import { SkeletonCard } from '../../components/shared/SkeletonLoader';
import type { Task } from '../../types/meeting.types';

type Tab = 'summary' | 'decisions' | 'tasks' | 'raw';

export const MeetingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [copied, setCopied] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingApi.getMeeting(id!),
    enabled: !!id,
    staleTime: 300_000,
  });

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, version }: { taskId: string; version: number }) =>
      taskApi.completeTask(taskId, version),
    onMutate: async ({ taskId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['meeting', id] });
      const prev = queryClient.getQueryData(['meeting', id]);
      queryClient.setQueryData(['meeting', id], (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) =>
            t._id === taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['meeting', id], context?.prev);
      addNotification({ type: 'error', title: 'Failed to complete task', message: 'Version conflict — please refresh.' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-[400px]" />
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-text-muted" strokeWidth={1.5} />
        <h2 className="text-xl font-semibold text-text-primary mb-2">Meeting not found</h2>
        <Link to="/meetings" className="text-accent-glow hover:underline">← Back to Meetings</Link>
      </div>
    );
  }

  const tasks = (meeting.tasks || []) as Task[];
  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'summary', label: 'Summary', icon: <FileText className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'decisions', label: 'Decisions', icon: <Lightbulb className="w-4 h-4" strokeWidth={1.5} />, count: meeting.decisions?.length },
    { key: 'tasks', label: 'Tasks', icon: <ListChecks className="w-4 h-4" strokeWidth={1.5} />, count: tasks.length },
    { key: 'raw', label: 'Raw Text', icon: <FileText className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/meetings')}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} /> Meetings
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {meeting.summary ? truncate(meeting.summary, 80) : 'Meeting Details'}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              {format(meeting.createdAt, 'MMM dd, yyyy')}
            </span>
            {meeting.metadata?.mentionedPeople && (
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" strokeWidth={1.5} />
                {meeting.metadata.mentionedPeople.length} people mentioned
              </span>
            )}
            <div className={cn('flex items-center gap-1.5')}>
              <div className={cn('w-2 h-2 rounded-full', getStatusDot(meeting.processingStatus))} />
              <span className="capitalize">{meeting.processingStatus}</span>
            </div>
          </div>
        </div>
        <Link
          to="/ask"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary/10 text-accent-glow rounded-lg text-sm font-medium hover:bg-accent-primary/20 transition-colors"
        >
          <Sparkles className="w-4 h-4" strokeWidth={1.5} />
          Ask AI about this
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded-xl glow-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-accent-primary/15 text-accent-glow'
                : 'text-text-secondary hover:text-text-primary hover:bg-elevated'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                activeTab === tab.key ? 'bg-accent-primary/20' : 'bg-elevated'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'summary' && (
          <div className="bg-surface rounded-2xl p-8 glow-border space-y-6">
            <div className="prose prose-invert max-w-none">
              <p className="text-text-primary leading-relaxed text-base">
                {meeting.summary || 'No summary available.'}
              </p>
            </div>
            {meeting.metadata?.mentionedPeople && meeting.metadata.mentionedPeople.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Mentioned People</h4>
                <div className="flex flex-wrap gap-2">
                  {meeting.metadata.mentionedPeople.map((name) => (
                    <div
                      key={name}
                      className="flex items-center gap-2 px-3 py-1.5 bg-elevated rounded-full text-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent-primary/20 flex items-center justify-center text-[10px] font-bold text-accent-glow">
                        {getInitials(name)}
                      </div>
                      <span className="text-text-primary">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="space-y-3">
            {!meeting.decisions || meeting.decisions.length === 0 ? (
              <div className="bg-surface rounded-2xl p-12 text-center glow-border">
                <Lightbulb className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" strokeWidth={1.5} />
                <p className="text-text-secondary">No decisions extracted</p>
              </div>
            ) : (
              meeting.decisions.map((decision, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.005 }}
                  className="bg-surface rounded-xl p-5 glow-border hover:glow-border-hover transition-shadow flex items-start gap-4"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-primary/15 flex items-center justify-center shrink-0 text-sm font-bold text-accent-glow">
                    {i + 1}
                  </div>
                  <p className="text-text-primary text-sm leading-relaxed">{decision}</p>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="bg-surface rounded-2xl p-12 text-center glow-border">
                <ListChecks className="w-10 h-10 mx-auto mb-3 text-text-muted opacity-40" strokeWidth={1.5} />
                <p className="text-text-secondary">No tasks extracted</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl glow-border overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border-subtle text-xs text-text-muted font-medium uppercase tracking-wider">
                  <div className="col-span-1">Status</div>
                  <div className="col-span-5">Task</div>
                  <div className="col-span-2">Owner</div>
                  <div className="col-span-2">Deadline</div>
                  <div className="col-span-2">Source</div>
                </div>
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={cn(
                      'grid grid-cols-12 gap-4 px-6 py-4 border-b border-border-subtle/50 hover:bg-elevated/50 transition-colors items-center',
                      task.status === 'completed' && 'opacity-50'
                    )}
                  >
                    <div className="col-span-1">
                      <button
                        onClick={() =>
                          task.status === 'pending' &&
                          completeTaskMutation.mutate({ taskId: task._id, version: task.version })
                        }
                        disabled={task.status === 'completed'}
                        className="group"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-text-muted group-hover:border-accent-glow transition-colors" />
                        )}
                      </button>
                    </div>
                    <div className="col-span-5">
                      <span className={cn('text-sm text-text-primary', task.status === 'completed' && 'line-through')}>
                        {task.description}
                      </span>
                    </div>
                    <div className="col-span-2">
                      {task.owner ? (
                        <span className="text-sm text-text-secondary">{task.owner}</span>
                      ) : (
                        <span className="text-xs text-text-muted">Unassigned</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {task.deadline ? (
                        <span className={cn('text-xs px-2 py-1 rounded-full', getDeadlineBg(task.deadline))}>
                          {format(task.deadline, 'MMM dd')}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-text-muted">Meeting</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="bg-surface rounded-2xl glow-border relative">
            <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted">
                  {meeting.metadata?.wordCount || meeting.rawText?.split(/\s+/).length || 0} words
                </span>
              </div>
              <button
                onClick={() => copyText(meeting.rawText)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary bg-elevated rounded-lg transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="p-6 text-sm text-text-secondary font-mono whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {meeting.rawText}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
};
