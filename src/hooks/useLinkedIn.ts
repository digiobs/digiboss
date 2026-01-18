import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInPost {
  id: string;
  content: string;
  imageUrl: string | null;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  timestamp: string;
  url: string;
}

interface LinkedInData {
  companyPage: {
    name: string;
    followers: number;
    followersChange: number;
    impressions: number;
    impressionsChange: number;
    engagement: number;
    engagementChange: number;
  };
  recentPosts: LinkedInPost[];
  isConnected: boolean;
  error?: string;
}

async function fetchLinkedInData(): Promise<LinkedInData> {
  const { data, error } = await supabase.functions.invoke('linkedin');
  
  if (error) {
    console.error('LinkedIn function error:', error);
    throw new Error(error.message);
  }
  
  return data as LinkedInData;
}

export function useLinkedIn() {
  return useQuery({
    queryKey: ['linkedin-data'],
    queryFn: fetchLinkedInData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
