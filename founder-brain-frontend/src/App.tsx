import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ToastContainer } from './components/shared/ToastContainer';

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const InputMeetingPage = lazy(() => import('./pages/InputMeeting/InputMeetingPage').then(m => ({ default: m.InputMeetingPage })));
const MeetingsPage = lazy(() => import('./pages/Meetings/MeetingsPage').then(m => ({ default: m.MeetingsPage })));
const MeetingDetailPage = lazy(() => import('./pages/MeetingDetail/MeetingDetailPage').then(m => ({ default: m.MeetingDetailPage })));
const TaskBoardPage = lazy(() => import('./pages/TaskBoard/TaskBoardPage').then(m => ({ default: m.TaskBoardPage })));
const AskAIPage = lazy(() => import('./pages/AskAI/AskAIPage').then(m => ({ default: m.AskAIPage })));
const SettingsPage = lazy(() => import('./pages/Settings/SettingsPage').then(m => ({ default: m.SettingsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="orbital-spinner" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/meetings/new"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <InputMeetingPage />
                  </Suspense>
                }
              />
              <Route
                path="/meetings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MeetingsPage />
                  </Suspense>
                }
              />
              <Route
                path="/meetings/:id"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MeetingDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="/tasks"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TaskBoardPage />
                  </Suspense>
                }
              />
              <Route
                path="/ask"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AskAIPage />
                  </Suspense>
                }
              />
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <SettingsPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
          <ToastContainer />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
