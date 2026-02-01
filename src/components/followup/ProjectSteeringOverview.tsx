import { WorkflowHealthCard } from './WorkflowHealthCard';
import { MilestonesPreview } from './MilestonesPreview';
import { WorkflowHealth, Milestone } from '@/types/followup';

interface ProjectSteeringOverviewProps {
  workflowHealth: WorkflowHealth[];
  milestones: Milestone[];
}

export function ProjectSteeringOverview({ workflowHealth, milestones }: ProjectSteeringOverviewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
      {/* Workflow Health Cards */}
      <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {workflowHealth.map((health) => (
          <WorkflowHealthCard key={health.id} health={health} />
        ))}
      </div>

      {/* Milestones Preview */}
      <div className="lg:col-span-2">
        <MilestonesPreview milestones={milestones} />
      </div>
    </div>
  );
}
