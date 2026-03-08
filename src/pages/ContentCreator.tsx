import { useState } from 'react';
import { 
  PenTool, 
  Sparkles, 
  LayoutGrid, 
  Calendar, 
  BarChart3,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout,
  Plus,
  Database,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { OpportunityCard } from '@/components/content/OpportunityCard';
import { OpportunityFilters, SortOption } from '@/components/content/OpportunityFilters';
import { ContentStudio } from '@/components/content/ContentStudio';
import { ContentKanban } from '@/components/content/ContentKanban';
import { ContentCalendar } from '@/components/content/ContentCalendar';
import { FeedbackLoop } from '@/components/content/FeedbackLoop';
import { 
  mockOpportunities, 
  mockContentItems, 
  contentTemplates 
} from '@/data/contentData';
import { 
  ContentOpportunity, 
  ContentItem, 
  ContentType, 
  ContentObjective, 
  ContentStatus,
  contentTypeLabels
} from '@/types/content';
import { Task } from '@/types/tasks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TabDataStatusBanner } from '@/components/data/TabDataStatusBanner';
import { useNavigate } from 'react-router-dom';
import { dispatchContentTaskCreated } from '@/hooks/useContentPlanLink';

type MainTab = 'opportunities' | 'studio' | 'workflow' | 'feedback';
type WorkflowView = 'kanban' | 'calendar';

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

export default function ContentCreator() {
  const navigate = useNavigate();
  
  // Main state
  const [activeTab, setActiveTab] = useState<MainTab>('opportunities');
  const [workflowView, setWorkflowView] = useState<WorkflowView>('kanban');
  const [opportunities] = useState<ContentOpportunity[]>(mockOpportunities);
  const [contentItems, setContentItems] = useState<ContentItem[]>(mockContentItems);
  
  // Studio state
  const [studioOpen, setStudioOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<ContentOpportunity | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('blog-post');
  
  // Content type picker dialog
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  
  // Filter state
  const [objective, setObjective] = useState<ContentObjective | 'all'>('all');
  const [contentType, setContentType] = useState<ContentType | 'all'>('all');
  const [persona, setPersona] = useState('All Personas');
  const [channel, setChannel] = useState('All Channels');
  const [language, setLanguage] = useState<'fr' | 'en' | 'all'>('all');
  const [signals, setSignals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('score');

  // Filter opportunities
  const filteredOpportunities = opportunities
    .filter(opp => {
      if (objective !== 'all' && opp.objective !== objective) return false;
      if (contentType !== 'all' && opp.contentType !== contentType) return false;
      if (persona !== 'All Personas' && opp.persona !== persona) return false;
      if (channel !== 'All Channels' && opp.channel !== channel) return false;
      if (language !== 'all' && opp.language !== language) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.opportunityScore - a.opportunityScore;
        case 'impact':
          return b.scoreBreakdown.impactPotential - a.scoreBreakdown.impactPotential;
        case 'effort':
          return b.scoreBreakdown.feasibility - a.scoreBreakdown.feasibility;
        case 'urgency':
          return b.scoreBreakdown.timing - a.scoreBreakdown.timing;
        default:
          return 0;
      }
    });

  const activeFiltersCount = [
    objective !== 'all',
    contentType !== 'all',
    persona !== 'All Personas',
    channel !== 'All Channels',
    language !== 'all',
    signals.length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setObjective('all');
    setContentType('all');
    setPersona('All Personas');
    setChannel('All Channels');
    setLanguage('all');
    setSignals([]);
  };

  // Handlers
  const handleGenerateDraft = (opp: ContentOpportunity) => {
    setSelectedOpportunity(opp);
    setSelectedContentType(opp.contentType);
    setStudioOpen(true);
    setActiveTab('studio');
  };

  const handleCreateTask = (opp: ContentOpportunity) => {
    const newTask: Task = {
      id: `content-opp-${Date.now()}`,
      title: `Create: ${opp.suggestedTitle}`,
      description: `${opp.suggestedAngle}\n\nWhy now:\n${opp.whyNow.map(w => `• ${w}`).join('\n')}`,
      status: 'backlog',
      priority: opp.opportunityScore >= 80 ? 'high' : opp.opportunityScore >= 60 ? 'medium' : 'low',
      assignee: null,
      dueDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [contentTypeLabels[opp.contentType], opp.funnelStage, 'content'],
      subtasks: [
        { id: `s-${Date.now()}-1`, title: 'Draft content', completed: false },
        { id: `s-${Date.now()}-2`, title: 'Review & approve', completed: false },
        { id: `s-${Date.now()}-3`, title: 'Schedule/publish', completed: false },
      ],
      comments: [],
      linkedContentId: opp.id,
      linkedContentType: 'opportunity',
      sourceModule: 'content-creator',
    };
    
    dispatchContentTaskCreated(newTask);
    toast.success(
      <div className="flex items-center gap-2">
        <span>Task created in Plan</span>
        <Button 
          variant="link" 
          size="sm" 
          className="p-0 h-auto text-primary" 
          onClick={() => navigate('/plan')}
        >
          View <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  };

  const handleSchedule = (opp: ContentOpportunity) => {
    toast.success(`Added to schedule: ${opp.suggestedTitle}`);
  };

  const handleSaveToBacklog = (opp: ContentOpportunity) => {
    toast.success(`Saved to backlog: ${opp.suggestedTitle}`);
  };

  const handleNewContent = (type: ContentType) => {
    setSelectedOpportunity(null);
    setSelectedContentType(type);
    setTypePickerOpen(false);
    setStudioOpen(true);
    setActiveTab('studio');
  };

  const handleSaveDraft = (content: Record<string, string>) => {
    toast.success('Draft saved successfully!');
  };

  const handleSendToPlan = (content: Record<string, string>) => {
    const newItem: ContentItem = {
      id: `content-${Date.now()}`,
      title: content.title || content.headline || content.hook || 'Untitled',
      contentType: selectedContentType,
      status: 'idea',
      funnelStage: selectedOpportunity?.funnelStage || 'awareness',
      opportunityId: selectedOpportunity?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setContentItems(prev => [newItem, ...prev]);
    setStudioOpen(false);
    setActiveTab('workflow');
    toast.success('Content added to workflow!');
  };

  const handleContentStatusChange = (itemId: string, newStatus: ContentStatus) => {
    setContentItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, status: newStatus, updatedAt: new Date().toISOString() } : item
      )
    );
  };

  const handleItemClick = (item: ContentItem) => {
    toast.info(`Opening: ${item.title}`);
  };

  // Render Studio View
  if (studioOpen) {
    return (
      <div className="h-[calc(100vh-4rem)] -m-6 animate-fade-in">
        <ContentStudio
          opportunity={selectedOpportunity || undefined}
          contentType={selectedContentType}
          onBack={() => setStudioOpen(false)}
          onSave={handleSaveDraft}
          onSendToPlan={handleSendToPlan}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <PenTool className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Content Creator</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            AI-powered content opportunities ranked by impact. Create what matters most.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setTypePickerOpen(true)}>
          <Plus className="w-4 h-4" />
          New Content
        </Button>
      </div>
      <TabDataStatusBanner tab="content" />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MainTab)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="opportunities" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Opportunities
          </TabsTrigger>
          <TabsTrigger value="studio" className="gap-2">
            <PenTool className="w-4 h-4" />
            Studio
          </TabsTrigger>
          <TabsTrigger value="workflow" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Calendar & Workflow
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Feedback Loop
          </TabsTrigger>
        </TabsList>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities" className="space-y-4 mt-4">
          <OpportunityFilters
            objective={objective}
            contentType={contentType}
            persona={persona}
            channel={channel}
            language={language}
            signals={signals}
            sortBy={sortBy}
            onObjectiveChange={setObjective}
            onContentTypeChange={setContentType}
            onPersonaChange={setPersona}
            onChannelChange={setChannel}
            onLanguageChange={setLanguage}
            onSignalsChange={setSignals}
            onSortChange={setSortBy}
            onReset={resetFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Opportunities Found</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Connect data sources to unlock AI-powered content scoring, or adjust your filters.
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  onGenerateDraft={handleGenerateDraft}
                  onCreateTask={handleCreateTask}
                  onSchedule={handleSchedule}
                  onSaveToBacklog={handleSaveToBacklog}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Studio Tab (Empty State) */}
        <TabsContent value="studio" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PenTool className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Content Studio</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              Select an opportunity to generate a draft, or start fresh with a new piece of content.
            </p>
            <Button onClick={() => setTypePickerOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Content
            </Button>
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4 mt-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={workflowView === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setWorkflowView('kanban')}
                className="gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Kanban
              </Button>
              <Button
                variant={workflowView === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setWorkflowView('calendar')}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>
            </div>
          </div>

          {workflowView === 'kanban' ? (
            <ContentKanban
              items={contentItems}
              onItemClick={handleItemClick}
              onStatusChange={handleContentStatusChange}
            />
          ) : (
            <ContentCalendar
              items={contentItems}
              onItemClick={handleItemClick}
            />
          )}
        </TabsContent>

        {/* Feedback Loop Tab */}
        <TabsContent value="feedback" className="mt-4">
          <FeedbackLoop
            items={contentItems}
            onItemClick={handleItemClick}
          />
        </TabsContent>
      </Tabs>

      {/* Content Type Picker Dialog */}
      <Dialog open={typePickerOpen} onOpenChange={setTypePickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Content Type</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 py-4">
            {contentTemplates.map((template) => {
              const Icon = contentTypeIcons[template.contentType] || FileText;
              return (
                <button
                  key={template.contentType}
                  onClick={() => handleNewContent(template.contentType)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{template.label}</p>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
