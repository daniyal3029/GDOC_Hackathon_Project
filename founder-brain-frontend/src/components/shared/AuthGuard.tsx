import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const AuthGuard: React.FC = () => {
  const { isAuthenticated, checkAuth, isLoading, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Only check auth blindly on mount if we are not authenticated but have a token
    if (!isAuthenticated) {
      checkAuth();
    }
  }, [checkAuth, isAuthenticated]);

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="orbital-spinner" />
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
