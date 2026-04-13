# Routage des livrables DigiObs

**Status :** source de vérité pour le routage des rapports skill → destination physique.
**Code miroir :** [`supabase/functions/_shared/deliverables-routing.ts`](../supabase/functions/_shared/deliverables-routing.ts)

Tout rapport produit par un skill **doit** atterrir dans l'un des deux providers
pris en charge (Supabase Storage ou OneDrive) **et** être enregistré dans la
table `public.deliverables` via la RPC `register_deliverable`. Notion n'est plus
supporté comme destination.

---

## 1. Table de routage (10 skills)

| Skill | Type | Provider | Dossier canonique | Label UI |
|-------|------|----------|-------------------|----------|
| `seo-strategy` | `seo-strategy` | OneDrive | `seo/strategy` | SEO Strategy |
| `audit-seo` | `audit-seo` | OneDrive | `seo/audits` | Audit SEO |
| `analyse-pmf` | `analyse-pmf` | OneDrive | `pmf` | Analyse PMF |
| `rapport-performance` | `rapport-performance` | OneDrive | `reporting` | Rapport Performance |
| `architecture-site` | `architecture-site` | OneDrive | `tech/architecture` | Architecture Site |
| `campagne` | `campagne` | OneDrive | `campagnes` | Campagne |
| `content-post` | `content-post` | Supabase Storage | `content/posts` | Post |
| `content-article` | `content-article` | Supabase Storage | `content/articles` | Article |
| `veille` | `veille` | Supabase Storage | `veille` | Veille |
| `orchestrateur` | `orchestrateur` | Supabase Storage | `orchestrateur` | Orchestrateur |

**Règle générale :**
- **OneDrive** → contenus édités par un humain, binaires, longue durée de vie
  (stratégies, audits, rapports PDF, documents de campagne).
- **Supabase Storage** → contenus auto-générés par le pipeline, HTML/JSON,
  éphémères ou à forte fréquence de mise à jour.

---

## 2. Convention de path

Le même schéma s'applique aux deux providers :

```
{root}/{client_slug}/{folder}/{yyyy}/{yyyy-mm}/{filename}
```

Où `{root}` dépend du provider :

| Provider | `{root}` |
|----------|----------|
| Supabase Storage | racine du bucket privé `deliverables` |
| OneDrive | `{client_drives.root_folder}/livrables` |

**Exemples :**

```
# Supabase Storage
deliverables/agro-bio/content/articles/2026/2026-04/veille-avril.html
deliverables/agro-bio/veille/2026/2026-04/2026-04-12-newsletter.json

# OneDrive (relatif à root_folder)
livrables/seo/strategy/2026/2026-04/strategy-q2.pdf
livrables/pmf/2026/2026-04/analyse-avril.docx
```

Le `client_slug` est obtenu via `slugifyClient(client.name)` : *Agro-Bio* → `agro-bio`.

---

## 3. Procédure — producteur de rapport

Quand votre skill crée un nouveau rapport, suivez **exactement** ces 3 étapes :

### a) Construire le path

Importer le helper depuis `_shared/deliverables-routing.ts` :

```ts
import {
  buildStoragePath,
  buildOneDrivePath,
  slugifyClient,
  SKILL_BY_NAME,
} from "../_shared/deliverables-routing.ts";

const slug = slugifyClient(client.name);
const storagePath = buildStoragePath(slug, "content-article", "my-article.html", "2026-04");
// → "agro-bio/content/articles/2026/2026-04/my-article.html"
```

Pour OneDrive :

```ts
const onedrivePath = buildOneDrivePath("seo-strategy", "strategy-q2.pdf", "2026-04");
// → "livrables/seo/strategy/2026/2026-04/strategy-q2.pdf"
```

Le helper **throw** si le skill n'existe pas dans la table ou si le provider
ne correspond pas à la cible.

### b) Uploader le fichier

**Supabase Storage :**

```ts
await supabase.storage
  .from("deliverables")
  .upload(storagePath, fileBytes, { contentType: "text/html", upsert: true });
```

**OneDrive** (via MS Graph, réutilise le pattern de `onedrive-semrush-sync/index.ts`) :

```ts
const fullPath = `${drive.root_folder}/${onedrivePath}`;
await fetch(
  `https://graph.microsoft.com/v1.0/drives/${drive.drive_id}/root:/${fullPath}:/content`,
  { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fileBytes },
);
```

### c) Enregistrer la ligne dans `deliverables`

Appeler **systématiquement** la RPC `register_deliverable` après l'upload :

```ts
const { data, error } = await supabase.rpc("register_deliverable", {
  p_client_id: client.id,
  p_type: "content-article",       // = SKILL_BY_NAME["content-article"].type
  p_skill_name: "content-article",
  p_filename: "my-article.html",
  p_title: "Mon super article",
  p_period: "2026-04",
  p_status: "delivered",
  p_storage_path: storagePath,      // OR p_onedrive_path: onedrivePath
  p_content_type: "text/html",
  p_file_size: fileBytes.byteLength,
  p_generated_by: "content-article-skill",
  p_generation_meta: { prompt_version: 2, tokens_in: 1234 },
});
```

La RPC est **idempotente** : un second appel avec le même `(client_id, storage_path)`
ou `(client_id, onedrive_path)` **met à jour** la ligne existante au lieu d'en
créer une nouvelle (upsert via index uniques partiels).

---

## 4. Procédure — ajouter un nouveau skill

1. Ajouter une ligne dans `SKILL_ROUTING` dans `_shared/deliverables-routing.ts`
   en choisissant le provider (`"supabase"` ou `"onedrive"`), le `folder`, et
   le `type` (typiquement identique au `skill`).
2. Mettre à jour le tableau de ce document (section 1).
3. Si le skill produit des fichiers sur OneDrive, s'assurer que `client_drives.root_folder`
   pointe vers un dossier qui contient déjà le sous-répertoire `livrables/`.
4. Déployer `supabase/functions/index-deliverables` pour que le réindexeur
   connaisse le nouveau dossier.
5. Ajouter l'icône et le label dans `src/pages/Deliverables.tsx` → `typeConfig`
   pour un joli rendu dans l'UI.

---

## 5. Réindexation

Le réindexeur `index-deliverables` balaye **les deux** back-ends et ré-enregistre
chaque fichier trouvé via `register_deliverable`. Grâce à l'upsert idempotent,
il peut être rejoué sans risque.

**Manuellement, depuis l'UI :**

1. Aller sur `/deliverables`
2. Mode **admin** → cliquer sur le bouton **Réindexer** à côté de *Refresh Data*
3. Une notification affiche `{ indexed, skipped, errors }`

**Manuellement, en CLI :**

```bash
supabase functions invoke index-deliverables
```

**Périodiquement :** recommandé une fois par nuit via `pg_cron` ou un cron
externe appelant la fonction. Pas activé par défaut — l'upload direct
via RPC dans les skills reste la voie primaire ; le réindexeur sert uniquement
à rattraper les fichiers déposés hors pipeline.

---

## 6. Anti-pattern

- ❌ Écrire dans `deliverables` sans upload physique du fichier.
- ❌ Uploader un fichier dans un chemin libre qui ne suit pas la convention
  `{client_slug}/{folder}/{yyyy}/{yyyy-mm}/{filename}` → le réindexeur ignorera
  le fichier (il ne matchera aucun skill).
- ❌ Utiliser Notion comme destination. `notion_url` est conservé en base
  uniquement pour l'historique — ne **pas** écrire de nouvelles lignes avec
  cette colonne.
- ❌ Inventer un nouveau `folder` hors de la table SKILL_ROUTING — la ligne
  sera invisible côté UI et ignorée par le réindexeur.
