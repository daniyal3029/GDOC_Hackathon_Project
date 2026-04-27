import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Clock, Search, Filter, X,
  CheckSquare, AlertTriangle, ListChecks,
} from 'lucide-react';
import { taskApi } from '../../services/api/taskApi';
import { useDebounce } from '../../hooks';
import { useNotificationStore } from '../../stores/notificationStore';
import { format, formatDistanceToNow } from '../../utils/dateFormatter';
import { cn, getDeadlineBg } from '../../utils/constants';
import { SkeletonList } from '../../components/shared/SkeletonLoader';
import type { Task } from '../../types/meeting.types';

type StatusFilter = 'all' | 'pending' | 'completed';

export const TaskBoardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      taskApi.getTasks({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 200,
      }),
    staleTime: 60_000,
  });

  const tasks = tasksData?.data || [];

  // Client-side search filter
  const filteredTasks = tasks.filter((t) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      (t.owner && t.owner.toLowerCase().includes(q))
    );
  });

  // Group by meeting
  const grouped = filteredTasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.meetingId || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {});

  const completeTaskMutation = useMutation({
    mutationFn: ({ taskId, version }: { taskId: string; version: number }) =>
      taskApi.completeTask(taskId, version),
    onMutate: async ({ taskId }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const prev = queryClient.getQueryData(['tasks', statusFilter === 'all' ? undefined : statusFilter]);
      queryClient.setQueryData(
        ['tasks', statusFilter === 'all' ? undefined : statusFilter],
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((t: Task) =>
              t._id === taskId ? { ...t, status: 'completed', completedAt: new Date().toISOString() } : t
            ),
          };
        }
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(
        ['tasks', statusFilter === 'all' ? undefined : statusFilter],
        context?.prev
      );
      addNotification({ type: 'error', title: 'Failed to complete task' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkComplete = () => {
    selectedTasks.forEach((id) => {
      const task = tasks.find((t) => t._id === id && t.status === 'pending');
      if (task) completeTaskMutation.mutate({ taskId: id, version: task.version });
    });
    setSelectedTasks(new Set());
  };

  const totalCount = tasksData?.pagination?.total || tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">Task Board</h1>
          <span className="px-2.5 py-1 text-xs font-medium bg-accent-primary/10 text-accent-glow rounded-full">
            {totalCount} tasks
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Status Toggles */}
        <div className="flex items-center p-1 bg-surface rounded-xl glow-border">
          {(['all', 'pending', 'completed'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize',
                statusFilter === status
                  ? 'bg-accent-primary/15 text-accent-glow'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : filteredTasks.length === 0 ? (
        <div className="bg-surface rounded-2xl p-16 text-center glow-border">
          <ListChecks className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-40" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No tasks found</h3>
          <p className="text-sm text-text-secondary mb-6">
            {statusFilter !== 'all' ? 'Try changing the filter.' : 'Process a meeting to extract tasks.'}
          </p>
          <Link
            to="/meetings/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg text-sm transition-colors shadow-glow"
          >
            Process Meeting →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([meetingId, groupTasks]) => (
            <motion.div
              key={meetingId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface rounded-2xl glow-border overflow-hidden"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-elevated/30">
                <Link
                  to={`/meetings/${meetingId}`}
                  className="text-sm font-medium text-text-secondary hover:text-accent-glow transition-colors"
                >
                  Meeting {meetingId.slice(-6)}
                </Link>
                <span className="text-xs text-text-muted">
                  {groupTasks.filter((t) => t.status === 'completed').length}/{groupTasks.length} done
                </span>
              </div>

              {/* Tasks */}
              {groupTasks.map((task) => (
                <div
                  key={task._id}
                  className={cn(
                    'flex items-center gap-4 px-6 py-4 border-b border-border-subtle/30 hover:bg-elevated/30 transition-colors',
                    task.status === 'completed' && 'opacity-50'
                  )}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() =>
                      task.status === 'pending'
                        ? completeTaskMutation.mutate({ taskId: task._id, version: task.version })
                        : null
                    }
                    disabled={task.status === 'completed'}
                    className="shrink-0"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-text-muted hover:border-accent-glow transition-colors" />
                    )}
                  </button>

                  {/* Text */}
                  <p className={cn('flex-1 text-sm text-text-primary', task.status === 'completed' && 'line-through')}>
                    {task.description}
                  </p>

                  {/* Owner */}
                  {task.owner && (
                    <span className="text-xs text-text-secondary bg-elevated px-2 py-1 rounded-full shrink-0">
                      {task.owner}
                    </span>
                  )}

                  {/* Deadline */}
                  {task.deadline && (
                    <span className={cn('text-xs px-2 py-1 rounded-full shrink-0', getDeadlineBg(task.deadline))}>
                      {format(task.deadline, 'MMM dd')}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </div>
      )}

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass-strong rounded-xl px-6 py-4 shadow-glow flex items-center gap-4"
          >
            <span className="text-sm text-text-primary font-medium">
              {selectedTasks.size} selected
            </span>
            <button
              onClick={handleBulkComplete}
              className="px-4 py-2 bg-accent-primary text-white rounded-lg text-sm font-medium hover:bg-accent-primary/80 transition-colors"
            >
              Mark {selectedTasks.size} complete
            </button>
            <button
              onClick={() => setSelectedTasks(new Set())}
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
