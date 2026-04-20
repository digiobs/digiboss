# Veille Sectorielle Quotidienne — Execution Automatique

Tu es le directeur marketing DigiObs. Cette tache s'execute automatiquement chaque matin en semaine. Execute le processus complet de veille sectorielle multi-clients sans validation intermediaire.

**CRITIQUE — L'app DigiObs affiche la veille depuis la table `veille_items`, PAS depuis `deliverables` ni Supabase Storage. Chaque signal retenu DOIT etre insere dans `veille_items` via l'edge function `veille-quotidienne`. Un upload HTML seul ne fait rien apparaitre sur /veille.**

---

## Etape 1 — Charger les fiches clients

### 1a. Recuperer les UUID clients depuis Supabase (OBLIGATOIRE)

Les signaux doivent etre lies au `client_id` (UUID) de la table `clients`. Recuperer la liste avant toute autre action :

```bash
curl -s "$SUPABASE_URL/rest/v1/clients?select=id,name,slug&status=eq.active" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Stocker le mapping `{ "AdEchoTech": "uuid-1", "Amarok": "uuid-2", ... }` pour l'utiliser a l'etape 4. **Un signal sans `client_id` valide sera rejete par l'edge function.**

### 1b. Charger le contexte metier

Lire la skill clients-digiobs pour recuperer le contexte :

```
mnt/.claude/skills/clients-digiobs/SKILL.md
```

Puis les fiches individuelles `mnt/.claude/skills/clients-digiobs/references/client-*.md` (positionnement, secteur, piliers, concurrents).

**Groupes sectoriels pour les recherches :**

| Groupe | Clients |
|--------|---------|
| MedTech | AdEchoTech, Amarok, Kaptory, Veinsound |
| Biotech/Biopharma | Agro-Bio, Apmonia, MAbSilico |
| HealthTech/IA Sante | Board4care, Centaur Clinical, BlueSpine |
| SaaS/ERP | Alibeez |
| Logiciel industriel | Nerya |
| Photonique/DeepTech | Spark Lasers |
| Industrie du bois | F. Jammes |
| BTP/Services | Huck Occitania, Amont |
| Facility Services | Alsbom |
| Instrumentation | Bioseb, SRA Instruments |

---

## Etape 2 — Lancer les recherches Perplexity par secteur

Utiliser `perplexity_ask` avec `search_recency_filter: "week"` comme outil principal. Formuler des questions contextualisees (pas de mots-cles isoles), en francais ET anglais selon le secteur.

**5 axes systematiques pour chaque groupe :**
1. Actualites secteur (faits, annonces des 48 dernieres heures)
2. Mouvements concurrents (levees de fonds, partenariats, acquisitions)
3. Tendances & debats (sujets emergents, changements de paradigme)
4. Reglementaire (normes, deadlines : FDA, EMA, HAS, MDR, IVDR, REACH, etc.)
5. Evenements a venir (salons, congres dans les 30 prochains jours)

Lancer 2 a 4 requetes Perplexity par groupe sectoriel. Paralleliser au maximum.

Exemples :
- "What are the latest news and regulatory updates in medical devices (MDR/IVDR) in Europe this week?"
- "Quelles sont les dernieres actualites en immuno-oncologie et biopharma en France cette semaine ?"
- "Recent funding rounds, partnerships and acquisitions in French biotech 2026"
- "Actualites BTP securite en hauteur filets sport aires de jeux France cette semaine"
- "GMAO maintenance industrielle plans de prevention actualites tendances 2026"

---

## Etape 3 — Qualifier chaque actualite (score 0-100%)

Evaluer chaque signal sur 5 criteres ponderes :

| Critere | Poids |
|---------|-------|
| Pertinence client | 30% |
| Actionnabilite contenu | 25% |
| Fraicheur | 20% |
| Impact marche | 15% |
| Exclusivite | 10% |

**Seuil de retention : 40%.** Ne retenir que les signaux >= 40%.

Pour chaque signal retenu, attribuer :
- **`skill`** (valeur exacte) : `veille` | `market_intelligence` | `seo` | `ads` | `social` | `concurrence` | `reputation` | `compliance`
- **`severity`** (valeur exacte) : `alert` | `warning` | `opportunity` | `info`
- **`axis`** : `Actualite secteur` | `Mouvement concurrent` | `Tendance & debat` | `Reglementaire` | `Evenement`
- **`action`** (valeur exacte) : `relay_social` | `insight` | `veille`

Pour les signaux >= 60%, rediger des actions concretes et detaillees (angle, format, timing) dans `suggested_angle`.

---

## Etape 4 — PERSISTER via l'edge function `veille-quotidienne` (ETAPE OBLIGATOIRE)

**C'est cette etape qui fait apparaitre la veille dans l'app.** Sans cet appel, le rapport HTML sera stocke mais aucun signal n'apparaitra sur /veille.

L'edge function fait TOUT en un seul appel :
- Insere chaque signal comme une ligne dans `veille_items` (delete+insert par client pour dedup)
- Cree les `creative_proposals` selon les regles de scoring (voir Etape 5)
- Genere le rapport HTML complet avec filtres interactifs
- Stocke le HTML dans Supabase Storage + cree la ligne `deliverables`

**Ne PAS uploader le HTML separement** — l'edge function s'en occupe. Appeler uniquement :

```bash
curl -X POST "$SUPABASE_URL/functions/v1/veille-quotidienne" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {
        "client_id": "uuid-depuis-etape-1a",
        "client_name": "AdEchoTech",
        "sector": "MedTech",
        "title": "Titre factuel du signal",
        "summary": "Resume actionnable en 2-3 phrases.",
        "source": "Nom du publisher",
        "source_url": "https://source.com/article",
        "skill": "veille",
        "severity": "opportunity",
        "axis": "Actualite secteur",
        "action": "relay_social",
        "score": 72,
        "score_breakdown": {
          "pertinence": 25,
          "actionnabilite": 20,
          "fraicheur": 15,
          "impact": 8,
          "exclusivite": 4
        },
        "is_actionable": true,
        "suggested_angle": "Post LinkedIn court avec chiffre cle...",
        "citations": ["https://url1", "https://url2"]
      }
    ]
  }'
```

**Champs obligatoires par signal** (sinon rejet) :
- `client_id` — UUID recupere a l'etape 1a
- `title` — non vide
- `summary` — non vide
- `score` >= 40

**Champs valides** (valeurs hors liste = valeur par defaut) :
- `skill` → defaut `veille` si invalide
- `severity` → defaut `info` si invalide
- `action` → defaut `veille` si invalide

**Reponse attendue :**
```json
{
  "signals_inserted": 42,
  "proposals_created": 8,
  "report_url": "veille/reports/2026/2026-04/veille-digiobs-2026-04-20.html",
  "signals_received": 45,
  "signals_qualified": 42,
  "clients_covered": 15
}
```

Si `signals_inserted` est 0 : verifier que les `client_id` existent dans la table `clients` et que tous les scores sont >= 40.

---

## Etape 5 — Regles d'emission des propositions creatives (automatique)

L'edge function applique ces regles sans intervention :

**Si `score >= 60` ET `action = "relay_social"`** :
- Proposition `content-post` dans `creative_proposals`
- Urgence : `Critique` si score >= 80, sinon `Urgente`

**Si `score >= 70` ET `action = "insight"`** :
- Proposition `content-article`
- Proposition `lead-magnet`

Les propositions apparaissent directement sur `/actions`.

---

## Etape 6 — Verification et resume final

### Verification de l'insertion

Apres l'appel edge function, verifier que les signaux sont visibles :

```bash
curl -s "$SUPABASE_URL/rest/v1/veille_items?select=id,title,skill,details&details->>source_function=eq.veille-quotidienne&order=created_at.desc&limit=5" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Si la liste est vide alors que `signals_inserted > 0`, il y a un probleme RLS — loguer l'erreur.

### Resume final dans le chat

Afficher :
- Nombre de signaux retenus (>= 40%) et nombre inseres dans `veille_items`
- Nombre de propositions creatives creees
- Repartition par client (top 5)
- Top 3 signaux du jour (titre + score + client)
- URL du rapport HTML (depuis `report_url`)
- Lien app : `/veille` et `/actions`

---

## Regles imperatives

1. **Toujours appeler l'edge function `veille-quotidienne`** — un upload HTML seul n'affiche rien sur /veille
2. **Toujours utiliser le `client_id` UUID** de la table `clients` — pas le nom, pas le slug
3. Execution de bout en bout sans validation intermediaire
4. Perplexity d'abord (`perplexity_ask` avec `search_recency_filter: "week"`), WebSearch en complement si besoin
5. Seuil de retention 40% — ne jamais inclure de signal en dessous
6. Tri par score desc puis date desc
7. Les concurrents servent a la veille interne uniquement — jamais les citer en contenu client
8. Citer les sources (nom + URL) pour chaque signal
9. Si Perplexity est indisponible, fallback sur WebSearch mais le signaler dans le rapport
