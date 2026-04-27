import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, Zap, ChevronDown, ExternalLink,
} from 'lucide-react';
import { getSocket } from '../../services/websocket/socket';
import { queryApi } from '../../services/api/queryApi';
import { useWebSocket } from '../../hooks';
import { cn } from '../../utils/constants';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
  sources?: { id: number; meetingId: string; textSnippet: string }[];
  timestamp: Date;
}

const suggestedQueries = [
  'What are my pending tasks?',
  'Decisions from last week?',
  'What did we decide about pricing?',
  'Show action items with deadlines',
];

export const AskAIPage: React.FC = () => {
  const { connected } = useWebSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Listen for WebSocket streaming events
  useEffect(() => {
    const socket = getSocket();

    const handleChunk = (data: { requestId: string; token: string }) => {
      setMessages((prev) => {
        const existing = prev.find((m) => m.id === data.requestId);
        if (existing) {
          return prev.map((m) =>
            m.id === data.requestId
              ? { ...m, content: m.content + data.token }
              : m
          );
        }
        return prev;
      });
    };

    const handleComplete = (data: { requestId: string; answer: string; sources: any[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.requestId
            ? { ...m, content: data.answer || m.content, isStreaming: false, sources: data.sources }
            : m
        )
      );
      setIsLoading(false);
    };

    const handleError = (data: { requestId: string; message: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === data.requestId
            ? { ...m, content: `Error: ${data.message}`, isStreaming: false }
            : m
        )
      );
      setIsLoading(false);
    };

    socket.on('query:chunk', handleChunk);
    socket.on('query:complete', handleComplete);
    socket.on('query:error', handleError);

    return () => {
      socket.off('query:chunk', handleChunk);
      socket.off('query:complete', handleComplete);
      socket.off('query:error', handleError);
    };
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInputValue('');
    setIsLoading(true);

    // Try WebSocket streaming first
    const socket = getSocket();
    if (socket.connected) {
      socket.emit('query:ask', {
        requestId: aiMsgId,
        question: text.trim(),
        maxSources: 5,
      });
    } else {
      // Fallback to REST
      try {
        const result = await queryApi.askQuestion(text.trim());
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content: result.answer,
                  isStreaming: false,
                  sources: result.sources?.map((s, i) => ({
                    id: i + 1,
                    meetingId: s.meetingId,
                    textSnippet: s.excerpt,
                  })),
                }
              : m
          )
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, content: 'Failed to get a response. Please try again.', isStreaming: false }
              : m
          )
        );
      }
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      next.has(msgId) ? next.delete(msgId) : next.add(msgId);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">Ask Founder Brain</h1>
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs', connected ? 'bg-success/10 text-success' : 'bg-error/10 text-error')}>
            <div className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-success animate-pulse' : 'bg-error')} />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
        <p className="text-sm text-text-secondary mt-1">Query your meeting intelligence</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-accent-glow" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">What would you like to know?</h3>
            <p className="text-sm text-text-secondary mb-8 text-center max-w-sm">
              Ask questions about your meetings, decisions, and tasks.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {suggestedQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="p-3 bg-surface border border-border-subtle hover:border-accent-primary/30 rounded-xl text-sm text-text-secondary hover:text-text-primary transition-all text-left hover:bg-elevated"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn('max-w-[80%]')}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-hero flex items-center justify-center">
                      <Zap className="w-3 h-3 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-xs text-text-muted">Founder Brain</span>
                  </div>
                )}
                <div
                  className={cn(
                    'px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-accent-primary text-white rounded-2xl rounded-tr-sm'
                      : 'bg-surface border border-border-subtle rounded-2xl rounded-tl-sm'
                  )}
                >
                  {msg.content || (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  )}
                  {msg.isStreaming && msg.content && (
                    <span className="inline-block w-1.5 h-4 bg-accent-glow ml-0.5 animate-pulse" />
                  )}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors"
                    >
                      <ChevronDown
                        className={cn('w-3.5 h-3.5 transition-transform', expandedSources.has(msg.id) && 'rotate-180')}
                        strokeWidth={1.5}
                      />
                      {msg.sources.length} source{msg.sources.length !== 1 ? 's' : ''}
                    </button>
                    <AnimatePresence>
                      {expandedSources.has(msg.id) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1.5">
                            {msg.sources.map((src) => (
                              <a
                                key={src.id}
                                href={`/meetings/${src.meetingId}`}
                                className="flex items-center gap-2 p-2 bg-elevated/50 rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                                <span className="truncate">{src.textSnippet || `Meeting ${src.meetingId.slice(-6)}`}</span>
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-base via-base to-transparent">
        <div className="relative bg-surface border border-border-subtle rounded-xl focus-within:border-accent-primary transition-colors">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your meetings..."
            rows={1}
            className="w-full px-4 py-3.5 pr-12 bg-transparent text-sm text-text-primary placeholder-text-muted resize-none focus:outline-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg transition-all',
              inputValue.trim()
                ? 'bg-accent-primary text-white hover:bg-accent-primary/80'
                : 'text-text-muted'
            )}
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        <p className="text-center text-[11px] text-text-muted mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
