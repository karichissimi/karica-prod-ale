import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/lib/auth';

interface ConsumerRouteProps {
  children: React.ReactNode;
}

export function ConsumerRoute({ children }: ConsumerRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin and Partner should go to their respective areas
  if (role === 'admin') {
    return <Navigate to="/admin-panel" replace />;
  }

  if (role === 'partner') {
    return <Navigate to="/partner-crm" replace />;
  }

  return <>{children}</>;
}
