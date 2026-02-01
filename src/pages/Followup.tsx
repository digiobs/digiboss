import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { FollowupTopBar } from '@/components/followup/FollowupTopBar';
import { ProjectSteeringOverview } from '@/components/followup/ProjectSteeringOverview';
import { MeetingIntelligence } from '@/components/followup/MeetingIntelligence';
import { OperationalTodo } from '@/components/followup/OperationalTodo';
import { FollowupNextBestActions } from '@/components/followup/FollowupNextBestActions';
import { ActivityFeed } from '@/components/followup/ActivityFeed';
import {
  mockWorkflowHealth,
  mockMilestones,
  mockTranscripts,
  mockMeetingSummaries,
  mockVerbatims,
  mockTasks,
  mockRecommendations,
  mockActivityFeed,
  mockSystemHealth,
} from '@/data/followupData';
import { WorkflowType, Priority, TaskStatus, RecommendationStatus } from '@/types/followup';

export default function Followup() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  const [selectedWorkflows, setSelectedWorkflows] = useState<WorkflowType[]>([
    'branding',
    'content',
    'web',
    'growth',
  ]);
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  const [recommendations, setRecommendations] = useState(mockRecommendations);

  const handleRecommendationStatusChange = (id: string, status: RecommendationStatus, note?: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? { ...rec, status, learningNote: note || rec.learningNote }
          : rec
      )
    );
  };

  // Filter tasks based on selections
  const filteredTasks = mockTasks.filter((task) => {
    if (selectedWorkflows.length > 0 && !selectedWorkflows.includes(task.workflow)) {
      return false;
    }
    if (selectedOwner !== 'All' && task.owner !== selectedOwner) {
      return false;
    }
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
      return false;
    }
    if (selectedStatus !== 'all' && task.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Follow-up</h1>
        <p className="text-muted-foreground">
          Meeting intelligence, task tracking, and strategic recommendations in one operational cockpit.
        </p>
      </div>

      {/* Top Bar with Filters */}
      <FollowupTopBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedWorkflows={selectedWorkflows}
        onWorkflowsChange={setSelectedWorkflows}
        selectedOwner={selectedOwner}
        onOwnerChange={setSelectedOwner}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Top Row: Project Steering Overview */}
      <ProjectSteeringOverview
        workflowHealth={mockWorkflowHealth}
        milestones={mockMilestones}
      />

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Meeting Intelligence */}
        <div className="lg:col-span-1">
          <MeetingIntelligence
            transcripts={mockTranscripts}
            summaries={mockMeetingSummaries}
            verbatims={mockVerbatims}
          />
        </div>

        {/* Center: Operational To-Do */}
        <div className="lg:col-span-1">
          <OperationalTodo
            tasks={filteredTasks}
            milestones={mockMilestones}
          />
        </div>

        {/* Right: Next Best Actions + Activity Feed */}
        <div className="lg:col-span-1 space-y-6">
          <FollowupNextBestActions
            recommendations={recommendations}
            onStatusChange={handleRecommendationStatusChange}
          />
          <ActivityFeed
            activities={mockActivityFeed}
            systemHealth={mockSystemHealth}
          />
        </div>
      </div>
    </div>
  );
}
