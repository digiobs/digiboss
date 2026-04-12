import { z } from 'zod';

const resourceLinkSchema = z.object({
  type: z.enum(['figma', 'gdocs', 'page', 'other']),
  url: z.string().url('URL invalide'),
  label: z.string().min(1, 'Label requis'),
});

const teamMemberRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  wrikeContactId: z.string().optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().default(''),
  taskType: z.enum(['contenu', 'seo', 'design', 'social_media', 'strategie', 'autre']).default('autre'),
  clientId: z.string().min(1, 'Client requis'),
  canal: z.union([
    z.enum(['LinkedIn', 'Blog', 'YouTube', 'Newsletter', 'Email', 'Site web']),
    z.literal(''),
  ]).default(''),
  format: z.union([
    z.enum(['Article', 'Post', 'Carrousel', 'Vidéo', 'Infographie', 'Story', 'Podcast']),
    z.literal(''),
  ]).default(''),
  thematique: z.string().default(''),
  startDate: z.string().nullable().default(null),
  dueDate: z.string().nullable().default(null),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.enum(['backlog', 'in_progress', 'review', 'done', 'cancelled']).default('backlog'),
  motCleCible: z.string().default(''),
  nombreMots: z.coerce.number().int().positive().nullable().default(null),
  resourceLinks: z.array(resourceLinkSchema).default([]),
  effortReserve: z.coerce.number().min(0).nullable().default(null),
  assigneeIds: z.array(teamMemberRefSchema).default([]),
  tags: z.array(z.string()).default([]),
  // Admin financial fields
  budgetTache: z.coerce.number().min(0).nullable().default(null),
  tarifCatalogue: z.coerce.number().min(0).nullable().default(null),
  forfaitMensuel: z.coerce.number().min(0).nullable().default(null),
  sousTraitance: z.coerce.number().min(0).nullable().default(null),
  marge: z.coerce.number().nullable().default(null),
  syncToWrike: z.boolean().default(false),
}).superRefine((data, ctx) => {
  // Canal required for content and social_media tasks
  if ((data.taskType === 'contenu' || data.taskType === 'social_media') && !data.canal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Canal requis pour ce type de tâche',
      path: ['canal'],
    });
  }
  // Format required if canal is set
  if (data.canal && !data.format) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Format requis quand un canal est sélectionné',
      path: ['format'],
    });
  }
});

export type CreateTaskSchemaType = z.infer<typeof createTaskSchema>;
