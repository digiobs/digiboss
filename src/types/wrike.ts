export interface WrikeClient {
  name: string;
  wrikeId: string;
  sector?: 'biotech' | 'medtech' | 'saas' | 'industrial' | 'internal';
}

export const WRIKE_CLIENTS: WrikeClient[] = [
  { name: 'Amarok', wrikeId: 'IEAETAZKI5D6HJZ6', sector: 'industrial' },
  { name: 'AlibeeZ', wrikeId: 'MQAAAAEBPUT2', sector: 'biotech' },
  { name: 'Mabsilico', wrikeId: 'MQAAAAEBlpcg', sector: 'biotech' },
  { name: 'Adechotech', wrikeId: 'MQAAAAEB66qf', sector: 'saas' },
  { name: 'Nerya', wrikeId: 'MQAAAABq_LDQ', sector: 'medtech' },
  { name: 'Bioseb', wrikeId: 'MQAAAABqzpy4', sector: 'biotech' },
  { name: 'SRA Instruments', wrikeId: 'MQAAAABqztZc', sector: 'industrial' },
  { name: 'Centaur Clinical', wrikeId: 'MQAAAAEBerRZ', sector: 'medtech' },
  { name: 'Huck Occitania', wrikeId: 'MQAAAAECB8_j', sector: 'industrial' },
  { name: 'Veinsound', wrikeId: 'MQAAAAECC8BV', sector: 'medtech' },
  { name: 'Agro-Bio', wrikeId: 'MQAAAAECN40T', sector: 'biotech' },
  { name: 'Alsbom', wrikeId: 'MQAAAAECOOjx', sector: 'industrial' },
  { name: 'Amont', wrikeId: 'MQAAAAECOOv_', sector: 'industrial' },
  { name: 'Apmonia Therapeutics', wrikeId: 'MQAAAAECOO6W', sector: 'biotech' },
  { name: 'BlueSpine', wrikeId: 'MQAAAAECOO8j', sector: 'medtech' },
  { name: 'Board4care', wrikeId: 'MQAAAAECOO9H', sector: 'medtech' },
  { name: 'Spark Lasers', wrikeId: 'IEAETAZKI45U2O2G', sector: 'industrial' },
  { name: 'Primalian', wrikeId: 'IEAETAZKI5PBVEVE', sector: 'saas' },
  { name: 'F Jammes', wrikeId: 'MQAAAAED56X2', sector: 'industrial' },
  { name: 'DigiObs', wrikeId: 'MQAAAAECOQrR', sector: 'internal' },
];

export const WRIKE_SPACES = {
  ACTIVE: 'IEAETAZKI4VTWN6S',
  ARCHIVES: 'IEAETAZKI5PMUA5G',
};

// Custom field IDs
export const WRIKE_FIELDS = {
  // Client-visible
  THEMATIQUE: 'IEAETAZKJUAE3VV2',
  CANAL_DIFFUSION: 'IEAETAZKJUAGUPRZ',
  FORMAT: 'IEAETAZKJUAGU5LL',
  LIEN_CONTENU_PROD: 'IEAETAZKJUAGUNSK',
  // Admin only
  LIEN_FIGMA: 'IEAETAZKJUAIIP4J',
  LIEN_CONTENU_REDAC: 'IEAETAZKJUAIIP4M',
  MOT_CLE_CIBLE: 'IEAETAZKJUAIJ7IP',
  NOMBRE_MOTS: 'IEAETAZKJUAIJ7LK',
  EFFORT_RESERVE: 'IEAETAZKJUAI5LO7',
  TARIF_CATALOGUE: 'IEAETAZKJUAJDXQF',
  FORFAIT_MENSUEL: 'IEAETAZKJUAJKEXT',
  SOUS_TRAITANCE: 'IEAETAZKJUAJNUSE',
  BUDGET_TACHE: 'IEAETAZKJUAIWUH6',
  MARGE: 'IEAETAZKJUAJDXT2',
};

// Workflow status mappings
export const WORKFLOW_STATUSES = {
  PLANNING_EDITORIAL: 'IEAETAZKK4FC6DZG',
  FLUX_PRESTATION: 'IEAETAZKK4DPSJBC',
};

export const KANBAN_COLUMNS = [
  { id: 'proposition', label: "Proposition d'idée", color: 'bg-muted' },
  { id: 'redaction', label: 'En cours de rédaction', color: 'bg-primary/20' },
  { id: 'validation', label: 'À valider', color: 'bg-warning/20' },
  { id: 'publication', label: 'À publier', color: 'bg-accent' },
  { id: 'publie', label: 'Publié', color: 'bg-success/20' },
];

export interface WrikeTask {
  id: string;
  title: string;
  status: string;
  customStatusId?: string;
  importance?: string;
  dates?: {
    start?: string;
    due?: string;
    type?: string;
  };
  customFields?: Array<{
    id: string;
    value: string | number | string[];
  }>;
  parentIds?: string[];
  scope?: string;
  // Parsed fields
  canal?: string;
  format?: string;
  thematique?: string;
  lienContenuProd?: string;
  lienFigma?: string;
  lienContenuRedac?: string;
  motCleCible?: string;
  nombreMots?: string;
  effortReserve?: number;
  tarifCatalogue?: number;
  forfaitMensuel?: number;
  sousTraitance?: number;
  budgetTache?: number;
  marge?: number;
  // Enriched
  clientName?: string;
  clientSector?: string;
}

export interface WrikeFolder {
  id: string;
  title: string;
  childIds?: string[];
  project?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

export function parseCustomFields(task: WrikeTask): WrikeTask {
  const fields = task.customFields || [];
  const get = (id: string) => fields.find(f => f.id === id)?.value;

  return {
    ...task,
    canal: formatFieldValue(get(WRIKE_FIELDS.CANAL_DIFFUSION)),
    format: formatFieldValue(get(WRIKE_FIELDS.FORMAT)),
    thematique: formatFieldValue(get(WRIKE_FIELDS.THEMATIQUE)),
    lienContenuProd: get(WRIKE_FIELDS.LIEN_CONTENU_PROD) as string,
    lienFigma: get(WRIKE_FIELDS.LIEN_FIGMA) as string,
    lienContenuRedac: get(WRIKE_FIELDS.LIEN_CONTENU_REDAC) as string,
    motCleCible: get(WRIKE_FIELDS.MOT_CLE_CIBLE) as string,
    nombreMots: get(WRIKE_FIELDS.NOMBRE_MOTS) as string,
    effortReserve: get(WRIKE_FIELDS.EFFORT_RESERVE) as number,
    tarifCatalogue: get(WRIKE_FIELDS.TARIF_CATALOGUE) as number,
    forfaitMensuel: get(WRIKE_FIELDS.FORFAIT_MENSUEL) as number,
    sousTraitance: get(WRIKE_FIELDS.SOUS_TRAITANCE) as number,
    budgetTache: get(WRIKE_FIELDS.BUDGET_TACHE) as number,
    marge: get(WRIKE_FIELDS.MARGE) as number,
  };
}

function formatFieldValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'string') return value;
  return '';
}

export function getSectorColor(sector?: string): string {
  switch (sector) {
    case 'biotech': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'medtech': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'saas': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'industrial': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'internal': return 'bg-muted text-muted-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
}
