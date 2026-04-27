import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, FileText, ArrowRight,
  CheckCircle2, Clock, AlertCircle, ChevronLeft, ChevronRight, X,
} from 'lucide-react';
import { meetingApi } from '../../services/api/meetingApi';
import { useDebounce } from '../../hooks';
import { format } from '../../utils/dateFormatter';
import { cn, getStatusDot, truncate } from '../../utils/constants';
import { SkeletonCard } from '../../components/shared/SkeletonLoader';

export const MeetingsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading } = useQuery({
    queryKey: ['meetings', page, debouncedSearch],
    queryFn: () => meetingApi.getMeetings(page, 20, debouncedSearch || undefined),
    staleTime: 300_000,
  });

  const meetings = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">Meetings</h1>
        <Link
          to="/meetings/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg text-sm font-medium transition-colors shadow-glow"
        >
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          New Meeting
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" strokeWidth={1.5} />
        <input
          type="text"
          placeholder="Search meetings..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary transition-colors"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-text-muted" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Meeting List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} className="h-[100px]" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-surface rounded-2xl p-16 text-center glow-border">
          <FileText className="w-14 h-14 mx-auto mb-4 text-text-muted opacity-30" strokeWidth={1.5} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {searchQuery ? 'No meetings match your search' : 'No meetings yet'}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {searchQuery ? 'Try a different search term.' : 'Process your first meeting to get started.'}
          </p>
          {!searchQuery && (
            <Link
              to="/meetings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-white rounded-lg text-sm transition-colors shadow-glow"
            >
              Process your first meeting <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {meetings.map((meeting, i) => {
            const taskCount = Array.isArray(meeting.tasks) ? meeting.tasks.length : 0;
            const decisionCount = meeting.decisions?.length || 0;

            return (
              <motion.div
                key={meeting.id || meeting._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/meetings/${meeting.id || meeting._id}`}
                  className="group block bg-surface rounded-2xl p-5 glow-border hover:glow-border-hover transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', getStatusDot(meeting.processingStatus))} />
                        <h3 className="text-base font-medium text-text-primary truncate">
                          {meeting.summary ? truncate(meeting.summary, 80) : 'Processing...'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 ml-5 text-xs text-text-muted">
                        <span>{format(meeting.createdAt, 'MMM dd, yyyy')}</span>
                        {meeting.metadata?.mentionedPeople && (
                          <span>{meeting.metadata.mentionedPeople.length} participants</span>
                        )}
                        {meeting.metadata?.wordCount && (
                          <span>{meeting.metadata.wordCount.toLocaleString()} words</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {decisionCount > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-accent-primary/10 rounded-full text-xs text-accent-glow">
                          {decisionCount} decisions
                        </div>
                      )}
                      {taskCount > 0 && (
                        <div className="flex items-center gap-1 px-2.5 py-1 bg-success/10 rounded-full text-xs text-success">
                          {taskCount} tasks
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-glow transition-colors" strokeWidth={1.5} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrev}
            className="p-2 rounded-lg bg-surface border border-border-subtle hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
          <span className="text-sm text-text-secondary px-4">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!pagination.hasNext}
            className="p-2 rounded-lg bg-surface border border-border-subtle hover:bg-elevated disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};
