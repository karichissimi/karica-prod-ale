import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UseUserRoleReturn {
  role: AppRole | null;
  loading: boolean;
  isConsumer: boolean;
  isPartner: boolean;
  isAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
}

export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Check for admin role first (highest priority)
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (adminRole) {
          setRole('admin');
          setLoading(false);
          return;
        }

        // Check for partner role
        const { data: partnerRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'partner')
          .maybeSingle();

        if (partnerRole) {
          setRole('partner');
          setLoading(false);
          return;
        }

        // Check for consumer role
        const { data: consumerRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'consumer')
          .maybeSingle();

        if (consumerRole) {
          setRole('consumer');
        } else {
          // Default to consumer if no role assigned
          setRole('consumer');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('consumer'); // Default to consumer on error
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchRole();
    }
  }, [user, authLoading]);

  const hasRole = (checkRole: AppRole): boolean => {
    return role === checkRole;
  };

  return {
    role,
    loading: authLoading || loading,
    isConsumer: role === 'consumer',
    isPartner: role === 'partner',
    isAdmin: role === 'admin',
    hasRole,
  };
}
