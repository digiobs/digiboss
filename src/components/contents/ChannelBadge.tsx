import { FileText, Play, Mail, Linkedin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Channel } from '@/hooks/useContents';

const channelConfig: Record<Channel, { label: string; icon: React.ElementType; bgClass: string; textClass: string }> = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, bgClass: 'bg-blue-50', textClass: 'text-[#0A66C2]' },
  blog: { label: 'Blog', icon: FileText, bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
  youtube: { label: 'YouTube', icon: Play, bgClass: 'bg-red-50', textClass: 'text-red-600' },
  newsletter: { label: 'Newsletter', icon: Mail, bgClass: 'bg-violet-50', textClass: 'text-violet-600' },
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const cfg = channelConfig[channel];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`${cfg.bgClass} ${cfg.textClass} border-0 gap-1 font-medium`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </Badge>
  );
}

export { channelConfig };
