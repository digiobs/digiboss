import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  nextBestActions,
  type ActionType,
  type NextBestAction,
} from "@/data/dashboardData";
import { NextBestActionCard } from "@/components/dashboard/NextBestActionCard";
import { ActionFilters } from "@/components/dashboard/ActionFilters";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, LayoutGrid, Plug, RefreshCw, Wand2, Zap } from "lucide-react";

interface HomeNextBestActionsProps {
  isEmpty?: boolean;
  selectedAction: NextBestAction | null;
  onSelectAction: (action: NextBestAction | null) => void;
  generateSignal?: number;
  clientScope?: string;
  clientName?: string;
  aiContext?: string;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

interface AISuggestion {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  category: string;
  estimatedHours?: number;
  tags?: string[];
}

function toActionType(category: string, title: string, tags: string[]): ActionType {
  const text = `${category} ${title} ${tags.join(" ")}`.toLowerCase();
  if (text.includes("seo")) return "seo";
  if (text.includes("linkedin") || text.includes("social")) return "social";
  if (text.includes("ads") || text.includes("paid")) return "paid";
  if (text.includes("crm") || text.includes("email") || text.includes("lead")) return "crm";
  if (text.includes("brand")) return "brand";
  if (text.includes("tracking") || text.includes("tech")) return "tech";
  if (text.includes("conversion") || text.includes("landing") || text.includes("funnel")) return "cro";
  return "content";
}

function mapSuggestionToAction(suggestion: AISuggestion, index: number): NextBestAction {
  const tags = Array.isArray(suggestion.tags) ? suggestion.tags : [];
  const actionType = toActionType(suggestion.category, suggestion.title, tags);
  const estimatedHours = typeof suggestion.estimatedHours === "number" ? suggestion.estimatedHours : 3;
  const effort = estimatedHours <= 2 ? "S" : estimatedHours <= 6 ? "M" : "L";
  const priority = suggestion.priority ?? "medium";
  const impact = priority === "high" ? "high" : priority === "low" ? "low" : "medium";
  const confidence = priority === "high" ? 88 : priority === "low" ? 72 : 80;
  const urgencyScore = priority === "high" ? 90 : priority === "low" ? 55 : 74;
  const impactScore = priority === "high" ? 88 : priority === "low" ? 52 : 72;
  const effortScore = effort === "S" ? 92 : effort === "M" ? 70 : 45;
  const funnelStage =
    actionType === "crm" || actionType === "cro"
      ? "conversion"
      : actionType === "paid" || actionType === "content"
        ? "consideration"
        : "awareness";

  return {
    id: `ai-nba-${Date.now()}-${index}`,
    title: suggestion.title,
    type: actionType,
    funnelStage,
    impact,
    confidence,
    effort,
    whyNow: [suggestion.description, `Estimated effort: ${estimatedHours}h`],
    evidenceLinks: [{ label: "Claude recommendation", type: "ga4" }],
    isContentRelated: ["content", "social", "seo"].includes(actionType),
    urgencyScore,
    impactScore,
    effortScore,
  };
}

export function HomeNextBestActions({
  isEmpty = false,
  selectedAction,
  onSelectAction,
  generateSignal = 0,
  clientScope,
  clientName,
  aiContext,
  onGeneratingChange,
}: HomeNextBestActionsProps) {
  const [aiActions, setAiActions] = useState<NextBestAction[]>([]);
  const [hasGeneratedAttempt, setHasGeneratedAttempt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<ActionType[]>([]);
  const [sortBy, setSortBy] = useState<"recommended" | "impact" | "quickwins" | "urgent">("recommended");
  const lastGenerateSignal = useRef(generateSignal);

  const handleTypeToggle = (type: ActionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const runGeneration = useCallback(async () => {
    setHasGeneratedAttempt(true);
    setIsGenerating(true);
    setAiError(null);
    onGeneratingChange?.(true);
    try {
      const contextParts = [
        aiContext,
        clientScope && clientScope !== "all-clients" ? `Client scope: ${clientName ?? clientScope}` : "Client scope: global",
      ].filter(Boolean);

      const currentTasks = (aiActions.length > 0 ? aiActions : nextBestActions).slice(0, 8).map((action) => ({
        title: action.title,
        status: "backlog",
        priority: action.impact === "high" ? "high" : action.impact === "low" ? "low" : "medium",
      }));

      const { data, error } = await supabase.functions.invoke("ai-suggest-tasks", {
        body: {
          currentTasks,
          context: contextParts.join(" | "),
        },
      });

      if (error) throw new Error(error.message || "Failed to generate actions");
      const suggestions = Array.isArray(data?.suggestions) ? (data.suggestions as AISuggestion[]) : [];
      const mapped = suggestions.map((item, index) => mapSuggestionToAction(item, index));
      setAiActions(mapped);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
        setAiError("Rate limit reached. Please retry in a moment.");
      } else if (message.includes("402")) {
        setAiError("AI credits unavailable. Please check billing.");
      } else {
        setAiError(message || "Failed to generate Claude actions.");
      }
    } finally {
      setIsGenerating(false);
      onGeneratingChange?.(false);
    }
  }, [aiActions, aiContext, clientName, clientScope, onGeneratingChange]);

  useEffect(() => {
    if (generateSignal !== lastGenerateSignal.current) {
      lastGenerateSignal.current = generateSignal;
      void runGeneration();
    }
  }, [generateSignal, runGeneration]);

  const sourceActions = useMemo(() => {
    if (aiActions.length > 0) return aiActions;
    if (!hasGeneratedAttempt) return nextBestActions;
    return [];
  }, [aiActions, hasGeneratedAttempt]);

  const filteredAndSortedActions = useMemo(() => {
    let actions = [...sourceActions];

    if (selectedTypes.length > 0) {
      actions = actions.filter((a) => selectedTypes.includes(a.type));
    }

    switch (sortBy) {
      case "impact":
        actions.sort((a, b) => b.impactScore - a.impactScore);
        break;
      case "quickwins":
        actions.sort((a, b) => b.effortScore - a.effortScore);
        break;
      case "urgent":
        actions.sort((a, b) => b.urgencyScore - a.urgencyScore);
        break;
      case "recommended":
      default:
        actions.sort(
          (a, b) =>
            (b.urgencyScore + b.impactScore + b.confidence) / 3 -
            (a.urgencyScore + a.impactScore + a.confidence) / 3
        );
        break;
    }

    return actions;
  }, [selectedTypes, sortBy, sourceActions]);

  if (isEmpty) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Next Best Actions</h2>
        </div>
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Wand2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            No recommendations yet — let's generate your first action list
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Connect data sources or import insights to enable Next Best Actions.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" className="gap-2">
              <Plug className="w-4 h-4" />
              Connect data
            </Button>
            <Button className="gap-2" onClick={() => void runGeneration()} disabled={isGenerating}>
              <Wand2 className="w-4 h-4" />
              {isGenerating ? "Generating..." : "Generate actions"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <div>
          <h2 className="font-semibold">Next Best Actions</h2>
          <p className="text-xs text-muted-foreground">
            Ranked by opportunity, impact, and confidence.
          </p>
        </div>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredAndSortedActions.length} actions
        </span>
        <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => void runGeneration()} disabled={isGenerating}>
          {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          {isGenerating ? "Generating" : "Refresh AI"}
        </Button>
      </div>

      {aiError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{aiError}</span>
            <Button size="sm" variant="outline" onClick={() => void runGeneration()} disabled={isGenerating}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ActionFilters
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {isGenerating ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            Claude is generating prioritized actions for {clientName ?? "this scope"}...
          </div>
        ) : filteredAndSortedActions.length > 0 ? (
          filteredAndSortedActions.map((action) => (
            <NextBestActionCard
              key={action.id}
              action={action}
              isSelected={selectedAction?.id === action.id}
              onSelect={() =>
                onSelectAction(selectedAction?.id === action.id ? null : action)
              }
            />
          ))
        ) : hasGeneratedAttempt ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No AI actions returned for this scope</p>
            <Button variant="link" className="text-sm mt-1" onClick={() => void runGeneration()}>
              Retry generation
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <LayoutGrid className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No actions match your filters</p>
            <button
              className="text-primary text-sm mt-2 hover:underline"
              onClick={() => setSelectedTypes([])}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
