// DigiObs Insights Mock Data - Meeting-first intelligence

import type {
  Meeting,
  NBA,
  PerformanceInsight,
  ExternalInsight,
  OpsInsight,
  MeetingParticipant,
} from '@/types/insights';

// ============ Participants ============

const participants: Record<string, MeetingParticipant> = {
  marie: {
    id: 'p1',
    name: 'Marie Dupont',
    role: 'CMO',
    company: 'Adechotech',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
  },
  thomas: {
    id: 'p2',
    name: 'Thomas Bernard',
    role: 'Marketing Director',
    company: 'Adechotech',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas',
  },
  julie: {
    id: 'p3',
    name: 'Julie Martin',
    role: 'Content Manager',
    company: 'Agency',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julie',
  },
  alex: {
    id: 'p4',
    name: 'Alexandre Petit',
    role: 'Account Manager',
    company: 'Agency',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  sophie: {
    id: 'p5',
    name: 'Sophie Leroy',
    role: 'SEO Specialist',
    company: 'Agency',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie',
  },
  pierre: {
    id: 'p6',
    name: 'Pierre Moreau',
    role: 'CEO',
    company: 'Adechotech',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre',
  },
};

// ============ Meetings ============

export const meetings: Meeting[] = [
  {
    id: 'm1',
    title: 'Q1 Strategy Review - Adechotech',
    date: '2024-01-29T14:00:00Z',
    duration: 58,
    videoUrl: 'https://example.com/video/m1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.marie, participants.thomas, participants.julie, participants.alex],
    transcript: [
      { id: 't1-1', speakerId: 'p1', speakerName: 'Marie Dupont', text: "Bonjour à tous. Aujourd'hui on fait le point sur notre stratégie Q1. Le marché évolue rapidement et on doit s'adapter.", startTime: 0, endTime: 12 },
      { id: 't1-2', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "Absolument Marie. On a analysé les données des 3 derniers mois et il y a des signaux intéressants côté SEO.", startTime: 12, endTime: 22 },
      { id: 't1-3', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Ce qui me préoccupe c'est notre positionnement sur les mots-clés stratégiques. On a perdu 5 positions sur 'solutions biotechnologie'.", startTime: 22, endTime: 35, isHighlight: true },
      { id: 't1-4', speakerId: 'p3', speakerName: 'Julie Martin', text: "On a identifié le problème. Les concurrents ont publié beaucoup plus de contenu technique. On propose un calendrier éditorial renforcé.", startTime: 35, endTime: 48 },
      { id: 't1-5', speakerId: 'p1', speakerName: 'Marie Dupont', text: "D'accord, mais on a besoin de cas clients concrets. Les prospects nous demandent des preuves tangibles de notre expertise.", startTime: 48, endTime: 62, isHighlight: true },
      { id: 't1-6', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "On peut lancer une série de témoignages vidéo. J'ai 3 clients prêts à participer.", startTime: 62, endTime: 72 },
      { id: 't1-7', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Le budget LinkedIn Ads aussi. On dépense mais le CPL est trop élevé. Il faut optimiser les audiences.", startTime: 72, endTime: 86 },
      { id: 't1-8', speakerId: 'p3', speakerName: 'Julie Martin', text: "Proposition: on cible uniquement les décideurs IT et biotech. Plus précis, moins de gaspillage.", startTime: 86, endTime: 98 },
    ],
    highlights: [
      { id: 'h1-1', title: 'Perte positions SEO', timestamp: 22, type: 'problem' },
      { id: 'h1-2', title: 'Besoin cas clients', timestamp: 48, type: 'opportunity' },
      { id: 'h1-3', title: 'Optimisation LinkedIn Ads', timestamp: 72, type: 'decision' },
    ],
    verbatims: [
      { id: 'v1-1', text: "On a perdu 5 positions sur 'solutions biotechnologie'", speakerName: 'Thomas Bernard', speakerId: 'p2', timestamp: 28, meetingId: 'm1', tags: ['pain'] },
      { id: 'v1-2', text: "Les prospects nous demandent des preuves tangibles de notre expertise", speakerName: 'Marie Dupont', speakerId: 'p1', timestamp: 55, meetingId: 'm1', tags: ['pain', 'objection'] },
      { id: 'v1-3', text: "J'ai 3 clients prêts à participer aux témoignages vidéo", speakerName: 'Alexandre Petit', speakerId: 'p4', timestamp: 68, meetingId: 'm1', tags: ['proof'] },
    ],
    aiSummary: {
      decisions: [
        'Lancer un calendrier éditorial renforcé pour reconquérir les positions SEO',
        'Optimiser les audiences LinkedIn Ads pour cibler décideurs IT/biotech uniquement',
        'Produire une série de témoignages vidéo clients',
      ],
      problems: [
        'Perte de 5 positions sur les mots-clés stratégiques biotechnologie',
        'CPL LinkedIn Ads trop élevé par rapport aux objectifs',
        'Manque de preuves tangibles (cas clients) pour convaincre les prospects',
      ],
      opportunities: [
        '3 clients existants prêts à témoigner',
        'Potentiel de réduction du CPL de 30% avec ciblage affiné',
      ],
      actionItems: [
        { action: 'Préparer calendrier éditorial Q1', owner: 'Julie Martin', dueDate: '2024-02-05' },
        { action: 'Contacter les 3 clients pour témoignages', owner: 'Alexandre Petit', dueDate: '2024-02-02' },
        { action: 'Réviser audiences LinkedIn Ads', owner: 'Sophie Leroy', dueDate: '2024-02-01' },
      ],
    },
    nbaCount: 4,
    tags: ['strategy', 'quarterly-review', 'seo', 'ads'],
    workflowTags: ['content', 'growth'],
  },
  {
    id: 'm2',
    title: 'Content Planning Session',
    date: '2024-01-26T10:00:00Z',
    duration: 42,
    videoUrl: 'https://example.com/video/m2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.julie, participants.thomas, participants.sophie],
    transcript: [
      { id: 't2-1', speakerId: 'p3', speakerName: 'Julie Martin', text: "On doit absolument renforcer notre présence sur les sujets 'IA et biotech'. C'est ce que cherchent nos personas.", startTime: 0, endTime: 12 },
      { id: 't2-2', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "Les données GSC confirment: +45% de recherches sur ces termes ce trimestre. On a une fenêtre d'opportunité.", startTime: 12, endTime: 25, isHighlight: true },
      { id: 't2-3', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Le problème c'est qu'on manque d'expertise interne sur l'IA appliquée. On ne peut pas écrire n'importe quoi.", startTime: 25, endTime: 38 },
      { id: 't2-4', speakerId: 'p3', speakerName: 'Julie Martin', text: "On pourrait interviewer notre CTO pour des articles techniques. Ça renforce aussi notre E-E-A-T.", startTime: 38, endTime: 50 },
      { id: 't2-5', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "Excellente idée. Un format vidéo + article serait idéal pour le référencement et les réseaux sociaux.", startTime: 50, endTime: 62 },
    ],
    highlights: [
      { id: 'h2-1', title: '+45% recherches IA biotech', timestamp: 12, type: 'opportunity' },
      { id: 'h2-2', title: 'Interview CTO proposée', timestamp: 38, type: 'decision' },
    ],
    verbatims: [
      { id: 'v2-1', text: "+45% de recherches sur les termes IA biotech ce trimestre", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 18, meetingId: 'm2', tags: ['proof', 'benefit'] },
      { id: 'v2-2', text: "On manque d'expertise interne sur l'IA appliquée", speakerName: 'Thomas Bernard', speakerId: 'p2', timestamp: 30, meetingId: 'm2', tags: ['pain', 'objection'] },
    ],
    aiSummary: {
      decisions: [
        'Créer une série de contenus IA + biotech',
        'Interviewer le CTO pour du contenu technique E-E-A-T',
        'Format hybride vidéo + article pour chaque sujet',
      ],
      problems: [
        'Manque d\'expertise interne sur l\'IA appliquée',
      ],
      opportunities: [
        '+45% de recherches sur IA biotech = fenêtre d\'opportunité SEO',
        'Format vidéo pour réseaux sociaux et référencement',
      ],
      actionItems: [
        { action: 'Planifier interview CTO', owner: 'Julie Martin', dueDate: '2024-02-08' },
        { action: 'Préparer brief éditorial IA biotech', owner: 'Julie Martin', dueDate: '2024-02-03' },
      ],
    },
    nbaCount: 2,
    tags: ['content', 'seo', 'planning'],
    workflowTags: ['content'],
  },
  {
    id: 'm3',
    title: 'Website Redesign Kickoff',
    date: '2024-01-24T15:00:00Z',
    duration: 65,
    videoUrl: 'https://example.com/video/m3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.marie, participants.pierre, participants.alex, participants.julie],
    transcript: [
      { id: 't3-1', speakerId: 'p6', speakerName: 'Pierre Moreau', text: "Le site actuel ne reflète plus notre positionnement premium. On perd des deals à cause de ça.", startTime: 0, endTime: 12, isHighlight: true },
      { id: 't3-2', speakerId: 'p1', speakerName: 'Marie Dupont', text: "Les analytics montrent un taux de rebond de 68% sur la homepage. C'est critique.", startTime: 12, endTime: 22 },
      { id: 't3-3', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "On propose une refonte complète avec focus sur la conversion. Nouveau design, nouvelles pages produits.", startTime: 22, endTime: 35 },
      { id: 't3-4', speakerId: 'p6', speakerName: 'Pierre Moreau', text: "Budget approuvé jusqu'à 50K€. Je veux que ce soit fait pour le salon de mars.", startTime: 35, endTime: 45, isHighlight: true },
      { id: 't3-5', speakerId: 'p3', speakerName: 'Julie Martin', text: "Timeline serrée. On doit livrer les contenus avant le 15 février pour intégration.", startTime: 45, endTime: 55 },
    ],
    highlights: [
      { id: 'h3-1', title: 'Site ne reflète plus le positionnement', timestamp: 0, type: 'problem' },
      { id: 'h3-2', title: 'Budget 50K€ approuvé', timestamp: 35, type: 'decision' },
      { id: 'h3-3', title: 'Deadline salon mars', timestamp: 35, type: 'key_moment' },
    ],
    verbatims: [
      { id: 'v3-1', text: "On perd des deals à cause du site actuel", speakerName: 'Pierre Moreau', speakerId: 'p6', timestamp: 8, meetingId: 'm3', tags: ['pain', 'proof'] },
      { id: 'v3-2', text: "Taux de rebond de 68% sur la homepage", speakerName: 'Marie Dupont', speakerId: 'p1', timestamp: 18, meetingId: 'm3', tags: ['pain', 'proof'] },
      { id: 'v3-3', text: "Budget approuvé jusqu'à 50K€", speakerName: 'Pierre Moreau', speakerId: 'p6', timestamp: 38, meetingId: 'm3', tags: ['benefit'] },
    ],
    aiSummary: {
      decisions: [
        'Lancer la refonte complète du site web',
        'Budget de 50K€ validé par la direction',
        'Deadline impérative: salon de mars',
      ],
      problems: [
        'Site actuel ne reflète pas le positionnement premium',
        'Taux de rebond de 68% sur la homepage',
        'Perte de deals due à l\'image véhiculée',
      ],
      opportunities: [
        'Refonte = opportunité de repenser les parcours de conversion',
        'Nouveau site pour le salon = impact commercial immédiat',
      ],
      actionItems: [
        { action: 'Livrer maquettes pour validation', owner: 'Agency Design', dueDate: '2024-02-10' },
        { action: 'Rédiger contenus nouvelles pages', owner: 'Julie Martin', dueDate: '2024-02-15' },
        { action: 'Setup tracking conversion', owner: 'Sophie Leroy', dueDate: '2024-02-20' },
      ],
    },
    nbaCount: 3,
    tags: ['web', 'redesign', 'high-priority'],
    workflowTags: ['web', 'branding'],
  },
  {
    id: 'm4',
    title: 'LinkedIn Campaign Review',
    date: '2024-01-22T11:00:00Z',
    duration: 35,
    videoUrl: 'https://example.com/video/m4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.thomas, participants.sophie, participants.alex],
    transcript: [
      { id: 't4-1', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "La campagne lead gen a généré 47 leads ce mois mais le CPL est à 78€, au-dessus de notre cible de 55€.", startTime: 0, endTime: 14, isHighlight: true },
      { id: 't4-2', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "C'est préoccupant. Quelles sont les audiences les plus performantes?", startTime: 14, endTime: 22 },
      { id: 't4-3', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "Les directeurs R&D convertissent 2x mieux que les autres. On devrait concentrer le budget là-dessus.", startTime: 22, endTime: 35 },
      { id: 't4-4', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "On peut aussi tester des formats vidéo. Le taux d'engagement est 3x supérieur aux images statiques.", startTime: 35, endTime: 48 },
    ],
    highlights: [
      { id: 'h4-1', title: 'CPL au-dessus de la cible', timestamp: 0, type: 'problem' },
      { id: 'h4-2', title: 'Directeurs R&D = meilleure conversion', timestamp: 22, type: 'opportunity' },
    ],
    verbatims: [
      { id: 'v4-1', text: "CPL à 78€, au-dessus de notre cible de 55€", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 10, meetingId: 'm4', tags: ['pain', 'proof'] },
      { id: 'v4-2', text: "Les directeurs R&D convertissent 2x mieux", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 28, meetingId: 'm4', tags: ['proof', 'benefit'] },
    ],
    aiSummary: {
      decisions: [
        'Concentrer le budget sur les audiences Directeurs R&D',
        'Tester des formats vidéo pour améliorer l\'engagement',
      ],
      problems: [
        'CPL à 78€ vs objectif 55€',
        'Performance inégale selon les audiences',
      ],
      opportunities: [
        'Directeurs R&D = 2x meilleure conversion',
        'Vidéo = 3x taux d\'engagement vs images statiques',
      ],
      actionItems: [
        { action: 'Réallouer budget vers audiences R&D', owner: 'Sophie Leroy', dueDate: '2024-01-25' },
        { action: 'Produire 2 vidéos pour tests', owner: 'Agency Creative', dueDate: '2024-02-01' },
      ],
    },
    nbaCount: 2,
    tags: ['ads', 'linkedin', 'optimization'],
    workflowTags: ['growth'],
  },
  {
    id: 'm5',
    title: 'Brand Guidelines Update',
    date: '2024-01-19T14:30:00Z',
    duration: 48,
    videoUrl: 'https://example.com/video/m5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1634942537034-2531766767d1?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.marie, participants.julie, participants.alex],
    transcript: [
      { id: 't5-1', speakerId: 'p1', speakerName: 'Marie Dupont', text: "Nos visuels sont incohérents sur les différents canaux. Les équipes terrain utilisent d'anciennes versions.", startTime: 0, endTime: 12 },
      { id: 't5-2', speakerId: 'p3', speakerName: 'Julie Martin', text: "On propose de créer un portail brand avec tous les assets à jour et des templates prêts à l'emploi.", startTime: 12, endTime: 24 },
      { id: 't5-3', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "Excellente idée. On peut le lier à notre DAM pour que tout soit centralisé.", startTime: 24, endTime: 35 },
    ],
    highlights: [
      { id: 'h5-1', title: 'Incohérence visuels cross-canal', timestamp: 0, type: 'problem' },
      { id: 'h5-2', title: 'Portail brand proposé', timestamp: 12, type: 'decision' },
    ],
    verbatims: [
      { id: 'v5-1', text: "Les équipes terrain utilisent d'anciennes versions", speakerName: 'Marie Dupont', speakerId: 'p1', timestamp: 8, meetingId: 'm5', tags: ['pain'] },
    ],
    aiSummary: {
      decisions: [
        'Créer un portail brand centralisé',
        'Intégrer le portail avec le DAM existant',
      ],
      problems: [
        'Visuels incohérents sur les différents canaux',
        'Équipes terrain utilisent des versions obsolètes',
      ],
      opportunities: [
        'Portail brand = meilleure cohérence et efficacité',
      ],
      actionItems: [
        { action: 'Définir architecture portail brand', owner: 'Julie Martin', dueDate: '2024-01-26' },
        { action: 'Auditer assets actuels', owner: 'Agency Design', dueDate: '2024-01-30' },
      ],
    },
    nbaCount: 1,
    tags: ['branding', 'guidelines', 'dam'],
    workflowTags: ['branding'],
  },
  {
    id: 'm6',
    title: 'SEO Monthly Review',
    date: '2024-01-17T10:00:00Z',
    duration: 40,
    videoUrl: 'https://example.com/video/m6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.sophie, participants.julie, participants.thomas],
    transcript: [
      { id: 't6-1', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "Bonne nouvelle: le trafic organique a augmenté de 23% ce mois. Principalement grâce aux articles techniques.", startTime: 0, endTime: 12, isHighlight: true },
      { id: 't6-2', speakerId: 'p3', speakerName: 'Julie Martin', text: "Super! Quels articles performent le mieux?", startTime: 12, endTime: 18 },
      { id: 't6-3', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "L'article sur les solutions de tracking génère 40% du nouveau trafic. Il se positionne en 3ème position sur Google.", startTime: 18, endTime: 32 },
      { id: 't6-4', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "On devrait doubler sur ce sujet. Créer une série d'articles satellites pour renforcer la topical authority.", startTime: 32, endTime: 45 },
    ],
    highlights: [
      { id: 'h6-1', title: '+23% trafic organique', timestamp: 0, type: 'key_moment' },
      { id: 'h6-2', title: 'Article tracking = 40% nouveau trafic', timestamp: 18, type: 'opportunity' },
    ],
    verbatims: [
      { id: 'v6-1', text: "Le trafic organique a augmenté de 23% ce mois", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 6, meetingId: 'm6', tags: ['benefit', 'proof'] },
      { id: 'v6-2', text: "L'article sur les solutions de tracking génère 40% du nouveau trafic", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 25, meetingId: 'm6', tags: ['proof', 'benefit'] },
    ],
    aiSummary: {
      decisions: [
        'Créer une série d\'articles satellites autour du tracking',
        'Renforcer la topical authority sur ce cluster',
      ],
      problems: [],
      opportunities: [
        '+23% trafic organique sur le mois',
        'Article tracking = fort potentiel à développer',
      ],
      actionItems: [
        { action: 'Planifier 5 articles satellites tracking', owner: 'Julie Martin', dueDate: '2024-01-24' },
        { action: 'Optimiser maillage interne', owner: 'Sophie Leroy', dueDate: '2024-01-26' },
      ],
    },
    nbaCount: 2,
    tags: ['seo', 'review', 'content'],
    workflowTags: ['content'],
  },
  {
    id: 'm7',
    title: 'Social Media Strategy',
    date: '2024-01-15T14:00:00Z',
    duration: 52,
    videoUrl: 'https://example.com/video/m7',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.julie, participants.marie, participants.alex],
    transcript: [
      { id: 't7-1', speakerId: 'p3', speakerName: 'Julie Martin', text: "Notre engagement LinkedIn a chuté de 35% sur les 2 derniers mois. On doit revoir notre stratégie de contenu.", startTime: 0, endTime: 14, isHighlight: true },
      { id: 't7-2', speakerId: 'p1', speakerName: 'Marie Dupont', text: "Les posts corporate ne marchent plus. Il faut du contenu plus humain, plus authentique.", startTime: 14, endTime: 26 },
      { id: 't7-3', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "On pourrait activer les employés ambassadeurs. Leur reach naturel est 10x supérieur aux pages entreprises.", startTime: 26, endTime: 40 },
    ],
    highlights: [
      { id: 'h7-1', title: '-35% engagement LinkedIn', timestamp: 0, type: 'problem' },
      { id: 'h7-2', title: 'Programme ambassadeurs proposé', timestamp: 26, type: 'opportunity' },
    ],
    verbatims: [
      { id: 'v7-1', text: "Notre engagement LinkedIn a chuté de 35%", speakerName: 'Julie Martin', speakerId: 'p3', timestamp: 8, meetingId: 'm7', tags: ['pain', 'proof'] },
      { id: 'v7-2', text: "Le reach des employés est 10x supérieur aux pages entreprises", speakerName: 'Alexandre Petit', speakerId: 'p4', timestamp: 35, meetingId: 'm7', tags: ['benefit', 'proof'] },
    ],
    aiSummary: {
      decisions: [
        'Lancer un programme d\'employés ambassadeurs',
        'Privilégier le contenu authentique vs corporate',
      ],
      problems: [
        '-35% d\'engagement LinkedIn sur 2 mois',
        'Contenu corporate peu performant',
      ],
      opportunities: [
        'Employés ambassadeurs = 10x reach des pages entreprises',
      ],
      actionItems: [
        { action: 'Définir programme ambassadeurs', owner: 'Julie Martin', dueDate: '2024-01-22' },
        { action: 'Identifier 10 employés volontaires', owner: 'Marie Dupont', dueDate: '2024-01-25' },
      ],
    },
    nbaCount: 2,
    tags: ['social', 'linkedin', 'strategy'],
    workflowTags: ['content', 'growth'],
  },
  {
    id: 'm8',
    title: 'CRM Data Quality Review',
    date: '2024-01-12T11:00:00Z',
    duration: 38,
    videoUrl: 'https://example.com/video/m8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.alex, participants.thomas, participants.sophie],
    transcript: [
      { id: 't8-1', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "L'audit CRM révèle que 34% des contacts n'ont pas d'email valide. C'est un problème majeur pour nos campagnes.", startTime: 0, endTime: 14, isHighlight: true },
      { id: 't8-2', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Et pour la segmentation? Est-ce qu'on a les données nécessaires?", startTime: 14, endTime: 22 },
      { id: 't8-3', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "Seulement 45% des contacts ont un secteur d'activité renseigné. On manque d'infos pour le ciblage.", startTime: 22, endTime: 35 },
      { id: 't8-4', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "On devrait mettre en place un enrichissement automatique via LinkedIn ou Clearbit.", startTime: 35, endTime: 48 },
    ],
    highlights: [
      { id: 'h8-1', title: '34% contacts sans email valide', timestamp: 0, type: 'problem' },
      { id: 'h8-2', title: 'Enrichissement data proposé', timestamp: 35, type: 'decision' },
    ],
    verbatims: [
      { id: 'v8-1', text: "34% des contacts n'ont pas d'email valide", speakerName: 'Alexandre Petit', speakerId: 'p4', timestamp: 8, meetingId: 'm8', tags: ['pain', 'proof'] },
      { id: 'v8-2', text: "Seulement 45% des contacts ont un secteur d'activité renseigné", speakerName: 'Alexandre Petit', speakerId: 'p4', timestamp: 28, meetingId: 'm8', tags: ['pain', 'proof'] },
    ],
    aiSummary: {
      decisions: [
        'Mettre en place un enrichissement automatique des données',
        'Nettoyer la base de contacts existante',
      ],
      problems: [
        '34% des contacts sans email valide',
        'Seulement 45% avec secteur d\'activité renseigné',
      ],
      opportunities: [
        'Enrichissement = meilleure segmentation et ciblage',
      ],
      actionItems: [
        { action: 'Évaluer solutions enrichissement (Clearbit, etc)', owner: 'Alexandre Petit', dueDate: '2024-01-19' },
        { action: 'Nettoyer emails invalides', owner: 'Agency Ops', dueDate: '2024-01-26' },
      ],
    },
    nbaCount: 2,
    tags: ['crm', 'data-quality', 'tracking'],
    workflowTags: ['growth'],
  },
  {
    id: 'm9',
    title: 'Paid Media Budget Allocation',
    date: '2024-01-10T15:00:00Z',
    duration: 45,
    videoUrl: 'https://example.com/video/m9',
    thumbnailUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.marie, participants.thomas, participants.sophie],
    transcript: [
      { id: 't9-1', speakerId: 'p1', speakerName: 'Marie Dupont', text: "On doit revoir la répartition budget. Google Ads prend 60% mais ne génère que 30% des leads qualifiés.", startTime: 0, endTime: 14, isHighlight: true },
      { id: 't9-2', speakerId: 'p5', speakerName: 'Sophie Leroy', text: "En effet, LinkedIn génère 55% des MQL avec seulement 30% du budget. Le ROI est nettement meilleur.", startTime: 14, endTime: 28 },
      { id: 't9-3', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Proposition: on inverse les proportions. 50% LinkedIn, 35% Google, 15% retargeting multi-plateforme.", startTime: 28, endTime: 42 },
    ],
    highlights: [
      { id: 'h9-1', title: 'Déséquilibre budget vs performance', timestamp: 0, type: 'problem' },
      { id: 'h9-2', title: 'Réallocation budget proposée', timestamp: 28, type: 'decision' },
    ],
    verbatims: [
      { id: 'v9-1', text: "Google Ads prend 60% du budget mais ne génère que 30% des leads qualifiés", speakerName: 'Marie Dupont', speakerId: 'p1', timestamp: 8, meetingId: 'm9', tags: ['pain', 'proof'] },
      { id: 'v9-2', text: "LinkedIn génère 55% des MQL avec seulement 30% du budget", speakerName: 'Sophie Leroy', speakerId: 'p5', timestamp: 22, meetingId: 'm9', tags: ['proof', 'benefit'] },
    ],
    aiSummary: {
      decisions: [
        'Réallouer budget: 50% LinkedIn, 35% Google, 15% retargeting',
        'Rééquilibrer en fonction du ROI par canal',
      ],
      problems: [
        'Google Ads: 60% budget pour 30% leads qualifiés',
        'Mauvaise allocation actuelle',
      ],
      opportunities: [
        'LinkedIn: 55% MQL avec 30% budget = fort potentiel',
      ],
      actionItems: [
        { action: 'Implémenter nouvelle répartition', owner: 'Sophie Leroy', dueDate: '2024-01-15' },
        { action: 'Définir KPIs suivi mensuel', owner: 'Thomas Bernard', dueDate: '2024-01-12' },
      ],
    },
    nbaCount: 2,
    tags: ['ads', 'budget', 'optimization'],
    workflowTags: ['growth'],
  },
  {
    id: 'm10',
    title: 'Quarterly Business Review',
    date: '2024-01-08T09:00:00Z',
    duration: 75,
    videoUrl: 'https://example.com/video/m10',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=320&h=180&fit=crop',
    transcriptStatus: 'ready',
    participants: [participants.pierre, participants.marie, participants.thomas, participants.alex, participants.julie],
    transcript: [
      { id: 't10-1', speakerId: 'p6', speakerName: 'Pierre Moreau', text: "Le Q4 a dépassé nos objectifs de 12%. L'équipe a fait un travail remarquable.", startTime: 0, endTime: 12, isHighlight: true },
      { id: 't10-2', speakerId: 'p1', speakerName: 'Marie Dupont', text: "Le pipeline est sain: 1.2M€ qualifié pour Q1. Notre plus gros pipeline depuis 2 ans.", startTime: 12, endTime: 26 },
      { id: 't10-3', speakerId: 'p2', speakerName: 'Thomas Bernard', text: "Les défis: le marché US reste difficile à pénétrer. On n'a que 5% de nos leads là-bas.", startTime: 26, endTime: 40 },
      { id: 't10-4', speakerId: 'p4', speakerName: 'Alexandre Petit', text: "Pour le US, on devrait envisager des partenariats avec des distributeurs locaux plutôt que de l'outreach direct.", startTime: 40, endTime: 55 },
    ],
    highlights: [
      { id: 'h10-1', title: 'Q4 +12% vs objectifs', timestamp: 0, type: 'key_moment' },
      { id: 'h10-2', title: 'Pipeline 1.2M€', timestamp: 12, type: 'opportunity' },
      { id: 'h10-3', title: 'Marché US difficile', timestamp: 26, type: 'problem' },
    ],
    verbatims: [
      { id: 'v10-1', text: "Le Q4 a dépassé nos objectifs de 12%", speakerName: 'Pierre Moreau', speakerId: 'p6', timestamp: 6, meetingId: 'm10', tags: ['proof', 'benefit'] },
      { id: 'v10-2', text: "Pipeline de 1.2M€ qualifié pour Q1 - notre plus gros depuis 2 ans", speakerName: 'Marie Dupont', speakerId: 'p1', timestamp: 20, meetingId: 'm10', tags: ['proof', 'benefit'] },
      { id: 'v10-3', text: "On n'a que 5% de nos leads aux US", speakerName: 'Thomas Bernard', speakerId: 'p2', timestamp: 35, meetingId: 'm10', tags: ['pain', 'proof'] },
    ],
    aiSummary: {
      decisions: [
        'Explorer partenariats distributeurs US',
        'Maintenir la dynamique Q4 pour Q1',
      ],
      problems: [
        'Pénétration marché US difficile (5% des leads)',
      ],
      opportunities: [
        'Q4 +12% vs objectifs',
        'Pipeline Q1 = 1.2M€ (record 2 ans)',
      ],
      actionItems: [
        { action: 'Identifier 5 distributeurs US potentiels', owner: 'Alexandre Petit', dueDate: '2024-01-20' },
        { action: 'Préparer plan US market entry', owner: 'Marie Dupont', dueDate: '2024-02-01' },
      ],
    },
    nbaCount: 3,
    tags: ['qbr', 'strategy', 'pipeline'],
    workflowTags: ['growth', 'branding'],
  },
];

// ============ NBA (Next Best Actions) ============

export const nbas: NBA[] = [
  // From meetings
  {
    id: 'nba1',
    title: 'Lancer série témoignages vidéo clients',
    type: 'content',
    funnel: 'consideration',
    impact: 'high',
    effort: 'm',
    confidence: 85,
    whyBullets: [
      '3 clients prêts à témoigner identifiés',
      'Prospects demandent des preuves tangibles (verbatim meeting Q1 Review)',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm1', timestamp: 55, text: "Les prospects nous demandent des preuves tangibles" },
      { type: 'meeting_timestamp', meetingId: 'm1', timestamp: 68 },
    ],
    status: 'proposed',
    createdAt: '2024-01-29T15:00:00Z',
    meetingId: 'm1',
    score: 88,
  },
  {
    id: 'nba2',
    title: 'Optimiser audiences LinkedIn Ads: cibler Directeurs R&D',
    type: 'paid',
    funnel: 'awareness',
    impact: 'high',
    effort: 's',
    confidence: 92,
    whyBullets: [
      'Directeurs R&D convertissent 2x mieux que les autres audiences',
      'CPL actuel 78€ vs objectif 55€ (42% au-dessus)',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm4', timestamp: 28, text: "Les directeurs R&D convertissent 2x mieux" },
      { type: 'performance_data', source: 'LinkedIn Ads', link: '/reporting?section=paid' },
    ],
    status: 'accepted',
    assignedTo: 'Sophie Leroy',
    createdAt: '2024-01-22T12:00:00Z',
    meetingId: 'm4',
    score: 94,
  },
  {
    id: 'nba3',
    title: 'Créer cluster contenu IA + Biotech',
    type: 'seo',
    funnel: 'awareness',
    impact: 'high',
    effort: 'l',
    confidence: 88,
    whyBullets: [
      '+45% de recherches sur termes IA biotech ce trimestre',
      'Fenêtre d\'opportunité SEO identifiée via GSC',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm2', timestamp: 18, text: "+45% de recherches sur les termes IA biotech" },
      { type: 'performance_data', source: 'Google Search Console', link: '/reporting?section=seo' },
    ],
    status: 'proposed',
    createdAt: '2024-01-26T11:00:00Z',
    meetingId: 'm2',
    score: 86,
  },
  {
    id: 'nba4',
    title: 'Préparer contenus site avant deadline salon',
    type: 'content',
    funnel: 'conversion',
    impact: 'high',
    effort: 'l',
    confidence: 95,
    whyBullets: [
      'Budget 50K€ validé pour refonte site',
      'Deadline salon mars = impératif business',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm3', timestamp: 38, text: "Budget approuvé jusqu'à 50K€" },
      { type: 'meeting_timestamp', meetingId: 'm3', timestamp: 45 },
    ],
    status: 'accepted',
    assignedTo: 'Julie Martin',
    createdAt: '2024-01-24T16:00:00Z',
    meetingId: 'm3',
    score: 96,
  },
  {
    id: 'nba5',
    title: 'Lancer programme employés ambassadeurs LinkedIn',
    type: 'social',
    funnel: 'awareness',
    impact: 'medium',
    effort: 'm',
    confidence: 78,
    whyBullets: [
      'Engagement LinkedIn -35% sur 2 mois',
      'Reach employés = 10x pages entreprises',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm7', timestamp: 35, text: "Le reach des employés est 10x supérieur" },
    ],
    status: 'proposed',
    createdAt: '2024-01-15T15:00:00Z',
    meetingId: 'm7',
    score: 75,
  },
  {
    id: 'nba6',
    title: 'Mettre en place enrichissement données CRM',
    type: 'crm',
    funnel: 'conversion',
    impact: 'medium',
    effort: 'm',
    confidence: 82,
    whyBullets: [
      '34% contacts sans email valide',
      'Seulement 45% avec secteur d\'activité renseigné',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm8', timestamp: 8, text: "34% des contacts n'ont pas d'email valide" },
      { type: 'verbatim', meetingId: 'm8', timestamp: 28, text: "Seulement 45% des contacts ont un secteur d'activité" },
    ],
    status: 'proposed',
    createdAt: '2024-01-12T12:00:00Z',
    meetingId: 'm8',
    score: 79,
  },
  {
    id: 'nba7',
    title: 'Réalloquer budget: 50% LinkedIn, 35% Google',
    type: 'paid',
    funnel: 'awareness',
    impact: 'high',
    effort: 's',
    confidence: 90,
    whyBullets: [
      'LinkedIn: 55% MQL avec 30% budget = meilleur ROI',
      'Google Ads: 60% budget pour 30% leads qualifiés',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm9', timestamp: 22, text: "LinkedIn génère 55% des MQL avec seulement 30% du budget" },
    ],
    status: 'implemented',
    assignedTo: 'Sophie Leroy',
    createdAt: '2024-01-10T16:00:00Z',
    meetingId: 'm9',
    score: 91,
  },
  {
    id: 'nba8',
    title: 'Créer articles satellites cluster tracking',
    type: 'seo',
    funnel: 'awareness',
    impact: 'medium',
    effort: 'm',
    confidence: 85,
    whyBullets: [
      'Article tracking = 40% du nouveau trafic organique',
      'Position 3 sur Google = potentiel featured snippet',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm6', timestamp: 25, text: "L'article tracking génère 40% du nouveau trafic" },
    ],
    status: 'accepted',
    assignedTo: 'Julie Martin',
    createdAt: '2024-01-17T11:00:00Z',
    meetingId: 'm6',
    score: 82,
  },
  {
    id: 'nba9',
    title: 'Identifier partenaires distributeurs US',
    type: 'brand',
    funnel: 'awareness',
    impact: 'high',
    effort: 'l',
    confidence: 70,
    whyBullets: [
      'Seulement 5% des leads viennent des US',
      'Outreach direct non performant sur ce marché',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm10', timestamp: 35, text: "On n'a que 5% de nos leads aux US" },
    ],
    status: 'proposed',
    createdAt: '2024-01-08T10:00:00Z',
    meetingId: 'm10',
    score: 72,
  },
  {
    id: 'nba10',
    title: 'Créer portail brand centralisé',
    type: 'brand',
    funnel: 'conversion',
    impact: 'medium',
    effort: 'm',
    confidence: 80,
    whyBullets: [
      'Visuels incohérents sur différents canaux',
      'Équipes terrain utilisent versions obsolètes',
    ],
    evidence: [
      { type: 'verbatim', meetingId: 'm5', timestamp: 8, text: "Les équipes terrain utilisent d'anciennes versions" },
    ],
    status: 'proposed',
    createdAt: '2024-01-19T15:00:00Z',
    meetingId: 'm5',
    score: 77,
  },
  // Performance-based NBAs
  {
    id: 'nba11',
    title: 'Optimiser pages avec CTR < 2% sur GSC',
    type: 'seo',
    funnel: 'awareness',
    impact: 'medium',
    effort: 's',
    confidence: 88,
    whyBullets: [
      '15 pages avec impressions > 1000 mais CTR < 2%',
      'Potentiel +3000 clics/mois avec meta optimisées',
    ],
    evidence: [
      { type: 'performance_data', source: 'Google Search Console', link: '/reporting?section=seo' },
    ],
    status: 'proposed',
    createdAt: '2024-01-25T09:00:00Z',
    score: 84,
  },
  {
    id: 'nba12',
    title: 'Relancer campagne email abandonnée panier',
    type: 'cro',
    funnel: 'conversion',
    impact: 'high',
    effort: 's',
    confidence: 85,
    whyBullets: [
      '127 abandons panier ce mois sans relance',
      'Taux de récupération moyen estimé: 8-12%',
    ],
    evidence: [
      { type: 'performance_data', source: 'GA4 Ecommerce', link: '/reporting?section=conversions' },
    ],
    status: 'proposed',
    createdAt: '2024-01-28T10:00:00Z',
    score: 87,
  },
];

// ============ Performance Insights ============

export const performanceInsights: PerformanceInsight[] = [
  {
    id: 'perf1',
    source: 'ga4',
    tldr: 'Taux de rebond homepage en hausse de 12% vs mois précédent',
    soWhat: 'Les visiteurs ne trouvent pas ce qu\'ils cherchent. Revoir le hero et la proposition de valeur.',
    evidence: [
      { label: 'GA4 Rapport Engagement', link: '/reporting?section=website' },
    ],
    score: 82,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    theme: 'cro',
    createdAt: '2024-01-30T08:00:00Z',
  },
  {
    id: 'perf2',
    source: 'gsc',
    tldr: 'Position moyenne améliorée: 14.2 → 11.8 sur le mois',
    soWhat: 'La stratégie de contenu technique porte ses fruits. Continuer à investir sur les clusters identifiés.',
    evidence: [
      { label: 'GSC Performance', link: '/reporting?section=seo' },
    ],
    score: 75,
    impact: 'medium',
    urgency: 'later',
    status: 'reviewed',
    theme: 'seo',
    createdAt: '2024-01-29T09:00:00Z',
  },
  {
    id: 'perf3',
    source: 'ads',
    tldr: 'Coût par lead Google Ads +25% sur les 2 dernières semaines',
    soWhat: 'Concurrence accrue sur les enchères. Revoir la stratégie d\'enchères ou les mots-clés ciblés.',
    evidence: [
      { label: 'Google Ads Dashboard', link: '/reporting?section=paid' },
    ],
    score: 88,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    theme: 'paid',
    createdAt: '2024-01-30T07:00:00Z',
  },
  {
    id: 'perf4',
    source: 'linkedin',
    tldr: 'Taux d\'engagement posts page entreprise -15% ce mois',
    soWhat: 'Le contenu corporate ne résonne plus. Tester des formats plus authentiques et personnels.',
    evidence: [
      { label: 'LinkedIn Analytics', link: '/reporting?section=social' },
    ],
    score: 70,
    impact: 'medium',
    urgency: 'soon',
    status: 'new',
    theme: 'social',
    createdAt: '2024-01-28T14:00:00Z',
  },
  {
    id: 'perf5',
    source: 'ga4',
    tldr: 'Page /solutions/tracking convertit 3x mieux que la moyenne',
    soWhat: 'Cette page a le meilleur taux de conversion. Analyser ce qui fonctionne et répliquer sur d\'autres pages.',
    evidence: [
      { label: 'GA4 Conversions', link: '/reporting?section=conversions' },
    ],
    score: 78,
    impact: 'medium',
    urgency: 'later',
    status: 'reviewed',
    theme: 'cro',
    createdAt: '2024-01-27T11:00:00Z',
  },
];

// ============ External Insights (Perplexity) ============

export const externalInsights: ExternalInsight[] = [
  {
    id: 'ext1',
    perplexityQuestion: 'Quelles sont les tendances marketing B2B biotech en 2024?',
    tldr: 'L\'IA générative et le content marketing personnalisé dominent les stratégies B2B biotech.',
    soWhat: 'Investir dans des outils d\'IA pour la personnalisation de contenu. Nos concurrents adoptent déjà ces technologies.',
    citations: [
      { title: 'B2B Biotech Marketing Trends 2024', url: 'https://www.fiercebiotech.com/marketing-trends-2024', date: '2024-01-15' },
      { title: 'AI in Life Sciences Marketing', url: 'https://www.mckinsey.com/ai-life-sciences', date: '2024-01-10' },
      { title: 'Content Marketing for Biotech', url: 'https://www.contentmarketinginstitute.com/biotech', date: '2024-01-08' },
    ],
    confidence: 92,
    isVerified: true,
    score: 85,
    impact: 'high',
    urgency: 'soon',
    status: 'new',
    theme: 'content',
    createdAt: '2024-01-29T16:00:00Z',
  },
  {
    id: 'ext2',
    perplexityQuestion: 'Comment nos concurrents Bioseb et BlueSpine communiquent sur LinkedIn?',
    tldr: 'Bioseb publie 4x/semaine avec focus sur les témoignages clients. BlueSpine mise sur le thought leadership du CEO.',
    soWhat: 'Notre fréquence de publication (2x/semaine) est insuffisante. Les formats témoignages et personal branding fonctionnent.',
    citations: [
      { title: 'Bioseb LinkedIn Page Analysis', url: 'https://linkedin.com/company/bioseb', date: '2024-01-28' },
      { title: 'BlueSpine Social Strategy', url: 'https://linkedin.com/company/bluespine', date: '2024-01-28' },
    ],
    confidence: 88,
    isVerified: true,
    score: 80,
    impact: 'medium',
    urgency: 'soon',
    status: 'new',
    theme: 'social',
    createdAt: '2024-01-28T10:00:00Z',
  },
  {
    id: 'ext3',
    perplexityQuestion: 'Quelles sont les meilleures pratiques SEO pour le secteur biotech?',
    tldr: 'E-E-A-T est critique. Les articles techniques signés par des experts convertissent 2x mieux.',
    soWhat: 'Ajouter des bios d\'auteurs experts sur nos articles. Mettre en avant les credentials scientifiques.',
    citations: [
      { title: 'Healthcare SEO Best Practices', url: 'https://searchengineland.com/healthcare-seo', date: '2024-01-20' },
      { title: 'E-E-A-T for Medical Content', url: 'https://developers.google.com/search/docs/eeat', date: '2024-01-15' },
      { title: 'Biotech Content Marketing Guide', url: 'https://www.searchenginejournal.com/biotech-seo', date: '2024-01-12' },
    ],
    confidence: 90,
    isVerified: true,
    score: 82,
    impact: 'high',
    urgency: 'soon',
    status: 'reviewed',
    theme: 'seo',
    createdAt: '2024-01-25T14:00:00Z',
  },
  {
    id: 'ext4',
    perplexityQuestion: 'Évolutions réglementaires marketing santé Europe 2024?',
    tldr: 'Nouvelles restrictions sur les claims santé dans les publicités digitales à partir de Q2 2024.',
    soWhat: 'Auditer nos créas publicitaires pour conformité. Risque de suspension de campagnes si non-conforme.',
    citations: [
      { title: 'EU Health Advertising Regulations 2024', url: 'https://ec.europa.eu/health/advertising', date: '2024-01-18' },
    ],
    confidence: 75,
    isVerified: true,
    score: 78,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    theme: 'paid',
    createdAt: '2024-01-27T09:00:00Z',
  },
  {
    id: 'ext5',
    perplexityQuestion: 'Quel est l\'impact des mises à jour Google 2024 sur le secteur santé?',
    tldr: 'Les sites YMYL sans signaux d\'expertise forte perdent en moyenne 40% de visibilité.',
    soWhat: 'Vérifier que nos pages sensibles ont tous les signaux E-E-A-T requis. Priorité haute.',
    citations: [], // No citations - should be unverified
    confidence: 45,
    isVerified: false,
    score: 55,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    theme: 'seo',
    createdAt: '2024-01-26T11:00:00Z',
  },
];

// ============ Ops Insights ============

export const opsInsights: OpsInsight[] = [
  {
    id: 'ops1',
    type: 'blocker',
    title: 'Maquettes site web en attente validation client',
    description: 'Les maquettes V2 ont été envoyées le 22/01. Deadline dépassée de 5 jours. Bloque le développement.',
    linkedTaskId: 'task-web-maquettes',
    linkedMeetingId: 'm3',
    score: 95,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    createdAt: '2024-01-30T08:00:00Z',
  },
  {
    id: 'ops2',
    type: 'validation_pending',
    title: 'Contenus newsletter février à valider',
    description: '3 articles en attente de validation depuis 4 jours. Date d\'envoi prévue: 02/02.',
    linkedTaskId: 'task-newsletter-feb',
    score: 80,
    impact: 'medium',
    urgency: 'now',
    status: 'new',
    createdAt: '2024-01-29T14:00:00Z',
  },
  {
    id: 'ops3',
    type: 'dependency_missing',
    title: 'Accès LinkedIn Ads Manager non fourni',
    description: 'Impossible de lancer les optimisations décidées en meeting. Demande envoyée le 23/01.',
    linkedMeetingId: 'm4',
    score: 88,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    createdAt: '2024-01-28T10:00:00Z',
  },
  {
    id: 'ops4',
    type: 'blocker',
    title: 'API GA4 en erreur depuis 48h',
    description: 'Les données de performance ne sont plus synchronisées. Impact sur les rapports automatiques.',
    score: 92,
    impact: 'high',
    urgency: 'now',
    status: 'new',
    createdAt: '2024-01-30T06:00:00Z',
  },
];

// ============ Helper Functions ============

export function getMeetingById(id: string): Meeting | undefined {
  return meetings.find(m => m.id === id);
}

export function getNBAsByMeetingId(meetingId: string): NBA[] {
  return nbas.filter(nba => nba.meetingId === meetingId);
}

export function getVerbatimsByMeetingId(meetingId: string): Meeting['verbatims'] {
  const meeting = getMeetingById(meetingId);
  return meeting?.verbatims || [];
}

export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const verbatimTagConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pain: { label: 'Pain', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  objection: { label: 'Objection', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  benefit: { label: 'Benefit', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  proof: { label: 'Proof', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  feature: { label: 'Feature', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
};

export const nbaTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  seo: { label: 'SEO', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  content: { label: 'Content', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  paid: { label: 'Paid', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  social: { label: 'Social', color: 'text-pink-700 dark:text-pink-400', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  cro: { label: 'CRO', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  crm: { label: 'CRM', color: 'text-teal-700 dark:text-teal-400', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  tracking: { label: 'Tracking', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  brand: { label: 'Brand', color: 'text-indigo-700 dark:text-indigo-400', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
};
