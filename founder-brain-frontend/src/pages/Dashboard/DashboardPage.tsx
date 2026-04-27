import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle2, Clock, Lightbulb,
  ArrowRight, ArrowUpRight, ArrowDownRight, AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { meetingApi } from '../../services/api/meetingApi';
import { taskApi } from '../../services/api/taskApi';
import { useDemoStore } from '../../stores/demoStore';
import { format, formatDistanceToNow } from '../../utils/dateFormatter';
import { cn, getStatusDot, getDeadlineBg, truncate } from '../../utils/constants';
import { SkeletonCard } from '../../components/shared/SkeletonLoader';
import type { Meeting, Task } from '../../types/meeting.types';

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  tasks: Math.floor(Math.random() * 8) + 1,
}));

interface StatCard {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend: number;
  color: string;
}

export const DashboardPage: React.FC = () => {
  const { userName } = useDemoStore();

  const { data: meetingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['meetingStats'],
    queryFn: meetingApi.getMeetingStats,
    staleTime: 300_000,
  });

  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings', 1],
    queryFn: () => meetingApi.getMeetings(1, 5),
    staleTime: 300_000,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: () => taskApi.getTasks({ limit: 100 }),
    staleTime: 60_000,
  });

  const meetings = meetingsData?.data || [];
  const tasks = tasksData?.data || [];
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const totalDecisions = meetings.reduce((acc, m) => acc + (m.decisions?.length || 0), 0);

  const stats: StatCard[] = [
    {
      label: 'Total Meetings',
      value: meetingStats?.total || meetings.length,
      icon: <FileText className="w-5 h-5" strokeWidth={1.5} />,
      trend: 12,
      color: 'text-accent-glow',
    },
    {
      label: 'Tasks Completed',
      value: completedTasks,
      icon: <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />,
      trend: 8,
      color: 'text-success',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks,
      icon: <Clock className="w-5 h-5" strokeWidth={1.5} />,
      trend: -3,
      color: 'text-warning',
    },
    {
      label: 'Decisions Made',
      value: totalDecisions,
      icon: <Lightbulb className="w-5 h-5" strokeWidth={1.5} />,
      trend: 15,
      color: 'text-accent-cyan',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Upcoming deadlines
  const upcomingTasks = tasks
    .filter((t) => t.status === 'pending' && t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Greeting */}
      <div>
        <h1 className="text-3xl font-semibold text-text-primary">
          {greeting}, {userName} 👋
        </h1>
        <p className="text-text-secondary mt-1">Here's what needs your attention today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || meetingsLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="h-[140px]" />)
          : stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                className="bg-surface rounded-2xl p-6 glow-border hover:glow-border-hover transition-shadow duration-150 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-accent-primary/10', stat.color)}>
                      {stat.icon}
                    </div>
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                        stat.trend > 0 ? 'text-success bg-success/10' : 'text-error bg-error/10'
                      )}
                    >
                      {stat.trend > 0 ? (
                        <ArrowUpRight className="w-3 h-3" strokeWidth={2} />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" strokeWidth={2} />
                      )}
                      {Math.abs(stat.trend)}%
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-text-primary">
                    {stat.value}
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Main Grid: Activity + Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-surface rounded-2xl p-6 glow-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Activity</h3>
              <p className="text-sm text-text-secondary">Tasks completed per day</p>
            </div>
            <TrendingUp className="w-5 h-5 text-accent-glow" strokeWidth={1.5} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A24',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="#7C3AED"
                strokeWidth={2}
                fill="url(#colorTasks)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-surface rounded-2xl p-6 glow-border"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4">Upcoming Deadlines</h3>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-text-muted text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" strokeWidth={1.5} />
              No upcoming deadlines
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const isOverdue = new Date(task.deadline!) < new Date();
                return (
                  <div
                    key={task._id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-elevated/50 hover:bg-elevated transition-colors"
                  >
                    {isOverdue && <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" strokeWidth={1.5} />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{task.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.owner && (
                          <span className="text-xs text-text-muted">{task.owner}</span>
                        )}
                        <span className={cn('text-xs', isOverdue ? 'text-error' : 'text-text-secondary')}>
                          {formatDistanceToNow(task.deadline!)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Meetings */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Meetings</h3>
          <Link
            to="/meetings"
            className="text-sm text-accent-glow hover:text-accent-primary flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
          </Link>
        </div>
        {meetingsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-[72px]" />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center glow-border">
            <FileText className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-40" strokeWidth={1.5} />
            <h4 className="text-lg font-medium text-text-primary mb-2">No meetings yet</h4>
            <p className="text-sm text-text-secondary mb-6">Process your first meeting to get started.</p>
            <Link
              to="/meetings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg transition-colors shadow-glow"
            >
              Process Meeting <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <Link
                key={meeting._id}
                to={`/meetings/${meeting._id}`}
                className="group flex items-center justify-between p-4 bg-surface rounded-xl glow-border hover:glow-border-hover hover:bg-elevated transition-all duration-150"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', getStatusDot(meeting.processingStatus))} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {meeting.summary ? truncate(meeting.summary, 60) : 'Processing...'}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(meeting.createdAt, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {meeting.decisions && (
                    <span className="text-xs text-text-muted bg-elevated px-2 py-1 rounded-full">
                      {meeting.decisions.length} decisions
                    </span>
                  )}
                  {meeting.tasks && (
                    <span className="text-xs text-text-muted bg-elevated px-2 py-1 rounded-full">
                      {meeting.tasks.length} tasks
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-glow transition-colors" strokeWidth={1.5} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
