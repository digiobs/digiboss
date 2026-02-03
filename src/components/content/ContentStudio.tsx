import { useState } from 'react';
import { 
  ArrowLeft,
  Save,
  Send,
  Download,
  FileText,
  Quote,
  Video,
  Linkedin,
  Layout,
  Lightbulb,
  Search,
  Tag,
  ExternalLink,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ContentOpportunity, 
  ContentType, 
} from '@/types/content';
import { contentTemplates } from '@/data/contentData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContentStudioProps {
  opportunity?: ContentOpportunity;
  contentType: ContentType;
  onBack: () => void;
  onSave: (content: Record<string, string>) => void;
  onSendToPlan: (content: Record<string, string>) => void;
}

const contentTypeIcons: Record<string, React.ElementType> = {
  'blog-post': FileText,
  'testimonial': Quote,
  'webinar': Video,
  'linkedin-post': Linkedin,
  'landing-page': Layout,
};

// Mock related insights for context panel
const mockRelatedInsights = [
  { id: '1', title: 'SEO Gap: B2B lead scoring keywords', type: 'insight' },
  { id: '2', title: 'Competitor published similar content last week', type: 'insight' },
  { id: '3', title: 'b2b lead scoring - 1.2K/mo, KD: 32', type: 'keyword' },
  { id: '4', title: 'lead scoring software - 890/mo, KD: 45', type: 'keyword' },
  { id: '5', title: '/blog/lead-generation (Top 10)', type: 'page' },
];

const mockBrandTone = [
  'Professional but approachable',
  'Data-driven with concrete examples',
  'Avoid jargon, explain complex terms',
  'Use active voice',
  'Include actionable takeaways',
];

export function ContentStudio({ 
  opportunity, 
  contentType, 
  onBack, 
  onSave, 
  onSendToPlan 
}: ContentStudioProps) {
  const template = contentTemplates.find(t => t.contentType === contentType);
  const Icon = contentTypeIcons[contentType] || FileText;
  
  const [content, setContent] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    template?.sections.forEach(section => {
      initial[section.id] = '';
    });
    // Pre-fill title if coming from opportunity
    if (opportunity && initial.title !== undefined) {
      initial.title = opportunity.suggestedTitle;
    }
    if (opportunity && initial.headline !== undefined) {
      initial.headline = opportunity.suggestedTitle;
    }
    if (opportunity && initial.hook !== undefined) {
      initial.hook = opportunity.suggestedTitle;
    }
    return initial;
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleFieldChange = (fieldId: string, value: string) => {
    setContent(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleGenerateWithAI = async () => {
    // Only generate for blog posts
    if (contentType !== 'blog-post') {
      toast.info('AI generation is currently available for blog posts only');
      return;
    }

    const title = content.title || opportunity?.suggestedTitle || '';
    if (!title.trim()) {
      toast.error('Please enter a title first');
      return;
    }

    setIsGenerating(true);

    try {
      const keywords = opportunity?.evidenceLinks
        .filter(e => e.type === 'keyword')
        .map(e => e.label) || [];

      const { data, error } = await supabase.functions.invoke('generate-blog-content', {
        body: {
          title,
          keywords,
          brandTone: mockBrandTone,
          context: opportunity?.whyNow?.join('. ') || '',
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate content');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const generated = data?.content;
      if (generated) {
        setContent(prev => ({
          ...prev,
          metaDescription: generated.metaDescription || prev.metaDescription || '',
          introduction: generated.introduction || prev.introduction || '',
          body: generated.body || prev.body || '',
          conclusion: generated.conclusion || prev.conclusion || '',
          callToAction: generated.callToAction || prev.callToAction || '',
        }));

        if (data?.citations?.length > 0) {
          toast.success(`Content generated with ${data.citations.length} sources`);
        } else {
          toast.success('Content generated successfully');
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate content';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!template) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Template not found for {contentType}</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{template.label} Editor</h2>
            <p className="text-sm text-muted-foreground">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onSave(content)}>
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2" onClick={() => onSendToPlan(content)}>
            <Send className="w-4 h-4" />
            Send to Plan
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* AI Generate Button */}
            {contentType === 'blog-post' && (
              <Button 
                variant="outline" 
                className="w-full gap-2 h-12 border-dashed border-primary/30 hover:bg-primary/5 hover:border-primary/50"
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-primary" />
                )}
                {isGenerating ? 'Generating with Perplexity AI...' : 'Generate with AI'}
              </Button>
            )}

            {/* Template Sections */}
            {template.sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <Label htmlFor={section.id} className="text-sm font-medium">
                  {section.label}
                </Label>
                {section.type === 'text' ? (
                  <Input
                    id={section.id}
                    placeholder={section.placeholder}
                    value={content[section.id] || ''}
                    onChange={(e) => handleFieldChange(section.id, e.target.value)}
                    className="h-11"
                  />
                ) : (
                  <Textarea
                    id={section.id}
                    placeholder={section.placeholder}
                    value={content[section.id] || ''}
                    onChange={(e) => handleFieldChange(section.id, e.target.value)}
                    className="min-h-[120px] resize-y"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Context Panel */}
        <div className="w-80 border-l border-border bg-muted/30 overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Related Insights */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Related Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockRelatedInsights.map((insight) => (
                    <a
                      key={insight.id}
                      href="#"
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                    >
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {insight.type}
                      </Badge>
                      <span className="text-muted-foreground line-clamp-2">
                        {insight.title}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
                    </a>
                  ))}
                </CardContent>
              </Card>

              {/* Keywords/Pages */}
              {opportunity && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary" />
                      Target Keywords
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {opportunity.evidenceLinks
                        .filter(e => e.type === 'keyword')
                        .map((link, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {link.label}
                          </Badge>
                        ))}
                      {opportunity.evidenceLinks.filter(e => e.type === 'keyword').length === 0 && (
                        <p className="text-xs text-muted-foreground">No keywords linked</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Brand Tone */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Brand Tone Guidelines
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="text-xs text-muted-foreground space-y-1.5">
                    {mockBrandTone.map((rule, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Opportunity Context */}
              {opportunity && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Opportunity Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Why Now</p>
                      <ul className="space-y-1">
                        {opportunity.whyNow.map((reason, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">{opportunity.opportunityScore}/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{opportunity.confidence}%</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
