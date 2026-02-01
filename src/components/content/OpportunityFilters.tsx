import { 
  Filter, 
  SlidersHorizontal,
  Target,
  FileText,
  Users,
  Globe,
  Languages,
  Calendar,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  ContentType, 
  ContentObjective, 
  contentTypeLabels, 
  objectiveLabels 
} from '@/types/content';
import { signalFilters } from '@/data/contentData';

export type SortOption = 'score' | 'impact' | 'effort' | 'urgency';

interface OpportunityFiltersProps {
  objective: ContentObjective | 'all';
  contentType: ContentType | 'all';
  persona: string;
  channel: string;
  language: 'fr' | 'en' | 'all';
  signals: string[];
  sortBy: SortOption;
  onObjectiveChange: (value: ContentObjective | 'all') => void;
  onContentTypeChange: (value: ContentType | 'all') => void;
  onPersonaChange: (value: string) => void;
  onChannelChange: (value: string) => void;
  onLanguageChange: (value: 'fr' | 'en' | 'all') => void;
  onSignalsChange: (signals: string[]) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
  activeFiltersCount: number;
}

const personas = [
  'All Personas',
  'CMO',
  'VP Sales',
  'Marketing Manager',
  'Marketing Director',
  'Finance Director',
  'Small Business Owner',
];

const channels = [
  'All Channels',
  'Website',
  'LinkedIn',
  'Webinar',
  'Paid',
];

export function OpportunityFilters({
  objective,
  contentType,
  persona,
  channel,
  language,
  signals,
  sortBy,
  onObjectiveChange,
  onContentTypeChange,
  onPersonaChange,
  onChannelChange,
  onLanguageChange,
  onSignalsChange,
  onSortChange,
  onReset,
  activeFiltersCount,
}: OpportunityFiltersProps) {
  const toggleSignal = (signalId: string) => {
    if (signals.includes(signalId)) {
      onSignalsChange(signals.filter(s => s !== signalId));
    } else {
      onSignalsChange([...signals, signalId]);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      {/* Top Row - Main Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Objective */}
        <Select value={objective} onValueChange={(v) => onObjectiveChange(v as ContentObjective | 'all')}>
          <SelectTrigger className="w-[180px]">
            <Target className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Objective" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Objectives</SelectItem>
            {Object.entries(objectiveLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Content Type */}
        <Select value={contentType} onValueChange={(v) => onContentTypeChange(v as ContentType | 'all')}>
          <SelectTrigger className="w-[160px]">
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(contentTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Persona */}
        <Select value={persona} onValueChange={onPersonaChange}>
          <SelectTrigger className="w-[160px]">
            <Users className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Persona" />
          </SelectTrigger>
          <SelectContent>
            {personas.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Channel */}
        <Select value={channel} onValueChange={onChannelChange}>
          <SelectTrigger className="w-[140px]">
            <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {channels.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Language */}
        <Select value={language} onValueChange={(v) => onLanguageChange(v as 'fr' | 'en' | 'all')}>
          <SelectTrigger className="w-[120px]">
            <Languages className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-8" />

        {/* Signals Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Zap className="w-4 h-4" />
              Signals
              {signals.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {signals.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Filter by Data Signals</p>
              <div className="space-y-2">
                {signalFilters.map((signal) => (
                  <div key={signal.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={signal.id}
                      checked={signals.includes(signal.id)}
                      onCheckedChange={() => toggleSignal(signal.id)}
                    />
                    <Label 
                      htmlFor={signal.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {signal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1" />

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Highest Score</SelectItem>
            <SelectItem value="impact">Highest Impact</SelectItem>
            <SelectItem value="effort">Lowest Effort</SelectItem>
            <SelectItem value="urgency">Most Urgent</SelectItem>
          </SelectContent>
        </Select>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}
