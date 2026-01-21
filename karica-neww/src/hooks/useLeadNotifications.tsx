import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LeadNotification {
  leadId: string;
  unreadMessages: number;
  hasStatusUpdate: boolean;
}

export const useLeadNotifications = (userType: 'consumer' | 'partner') => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('lead-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lead_messages'
        },
        (payload) => {
          // Reload notifications when a new message arrives
          loadNotifications();
        }
      )
      .subscribe();

    // Subscribe to lead status changes
    const leadsChannel = supabase
      .channel('leads-status-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          // Reload notifications when lead status changes
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(leadsChannel);
    };
  }, [userType]);

  const loadNotifications = async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      setLoading(false);
      return;
    }

    const userId = session.session.user.id;

    if (userType === 'consumer') {
      await loadConsumerNotifications(userId);
    } else {
      await loadPartnerNotifications(userId);
    }

    setLoading(false);
  };

  const loadConsumerNotifications = async (userId: string) => {
    // Get all leads for this consumer
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, status, updated_at')
      .eq('user_id', userId);

    if (error || !leads) {
      setUnreadCount(0);
      return;
    }

    let totalUnread = 0;
    const notifs: LeadNotification[] = [];

    for (const lead of leads) {
      // Count messages from partner that consumer hasn't "seen"
      // For simplicity, count partner messages in last 24h as "unread"
      const { count } = await supabase
        .from('lead_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('sender_type', 'partner')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const unreadMessages = count || 0;

      if (unreadMessages > 0) {
        totalUnread += unreadMessages;
        notifs.push({
          leadId: lead.id,
          unreadMessages,
          hasStatusUpdate: false
        });
      }
    }

    setUnreadCount(totalUnread);
    setNotifications(notifs);
  };

  const loadPartnerNotifications = async (userId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user?.email) {
      setUnreadCount(0);
      return;
    }

    // Get partner profile
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('contact_email', userData.user.email)
      .maybeSingle();

    if (!partner) {
      setUnreadCount(0);
      return;
    }

    // Get all leads assigned to this partner
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, status, updated_at')
      .eq('partner_id', partner.id);

    if (error || !leads) {
      setUnreadCount(0);
      return;
    }

    let totalUnread = 0;
    const notifs: LeadNotification[] = [];

    for (const lead of leads) {
      // Count messages from user that partner hasn't "seen"
      const { count } = await supabase
        .from('lead_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('sender_type', 'user')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const unreadMessages = count || 0;

      if (unreadMessages > 0) {
        totalUnread += unreadMessages;
        notifs.push({
          leadId: lead.id,
          unreadMessages,
          hasStatusUpdate: false
        });
      }
    }

    setUnreadCount(totalUnread);
    setNotifications(notifs);
  };

  return {
    unreadCount,
    notifications,
    loading,
    refresh: loadNotifications
  };
};
