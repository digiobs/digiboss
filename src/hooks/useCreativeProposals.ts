import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';

export type ProposalStatus = 'new' | 'pending' | 'approved' | 'rejected' | 'archived';

export interface CreativeProposal {
  id: string;
  client_id: string;
  source_skill: string;
  proposal_type: string;
  target_skill: string;
  title: string;
  description: string;
  rationale: string;
  urgency: string;
  tags: string[];
  status: ProposalStatus;
  is_wild_card: boolean;
  is_marronnier: boolean;
  marronnier_name: string | null;
  marronnier_date: string | null;
  convergence_cluster_id: string | null;
  draft_content: string | null;
  source_insight: string | null;
  source_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  decided_at: string | null;
  archived_at: string | null;
}

export interface Convergence {
  id: string;
  client_id: string;
  combined_title: string;
  combined_description: string | null;
  combined_action: string | null;
  source_skills: string[];
  combined_types: string[];
  cluster_members: string[];
  urgency: string;
  urgency_multiplier: number;
  confidence: number;
  status: string;
  created_at: string;
}

const sb = supabase as unknown as { from: (t: string) => Record<string, unknown> };

export function useCreativeProposals() {
  const { currentClient, isAllClientsSelected } = useClient();
  const [proposals, setProposals] = useState<CreativeProposal[]>([]);
  const [convergences, setConvergences] = useState<Convergence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    if (!currentClient?.id) return;
    setIsLoading(true);

    let query = sb
      .from('creative_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAllClientsSelected) {
      query = query.eq('client_id', currentClient.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('creative_proposals query error:', error);
    } else {
      setProposals((data ?? []) as CreativeProposal[]);
    }

    // Fetch convergences
    let convQuery = sb
      .from('creative_proposal_convergences')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAllClientsSelected) {
      convQuery = convQuery.eq('client_id', currentClient.id);
    }

    const { data: convData, error: convError } = await convQuery;
    if (!convError) {
      setConvergences((convData ?? []) as Convergence[]);
    }

    setIsLoading(false);
  }, [currentClient?.id, isAllClientsSelected]);

  useEffect(() => {
    fetchProposals();

    // Realtime subscription
    const channel = supabase
      .channel('creative-proposals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_proposals' }, () => {
        fetchProposals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProposals]);

  const updateProposalStatus = useCallback(async (proposalId: string, newStatus: ProposalStatus) => {
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'approved' || newStatus === 'rejected') {
      updateData.decided_at = new Date().toISOString();
    }
    if (newStatus === 'archived') {
      updateData.archived_at = new Date().toISOString();
    }

    const { error } = await sb
      .from('creative_proposals')
      .update(updateData)
      .eq('id', proposalId);

    if (error) {
      console.error('Error updating proposal:', error);
      throw error;
    }

    // If approved, call the approve_proposal RPC to auto-schedule
    if (newStatus === 'approved') {
      const { error: rpcError } = await (supabase as unknown as { rpc: (fn: string, params: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }).rpc('approve_proposal', { proposal_id: proposalId });
      if (rpcError) {
        console.warn('approve_proposal RPC failed (non-blocking):', rpcError);
      }
    }

    await fetchProposals();
  }, [fetchProposals]);

  const proposalsByStatus = {
    new: proposals.filter((p) => p.status === 'new'),
    pending: proposals.filter((p) => p.status === 'pending'),
    approved: proposals.filter((p) => p.status === 'approved'),
    rejected: proposals.filter((p) => p.status === 'rejected'),
  };

  const stats = {
    total: proposals.filter((p) => p.status !== 'archived').length,
    new: proposalsByStatus.new.length,
    pending: proposalsByStatus.pending.length,
    approved: proposalsByStatus.approved.length,
    rejected: proposalsByStatus.rejected.length,
    convergences: convergences.length,
  };

  return {
    proposals,
    convergences,
    proposalsByStatus,
    stats,
    isLoading,
    updateProposalStatus,
    refetch: fetchProposals,
  };
}
