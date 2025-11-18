# agents.md — MVP Plan for “Better & Cheaper” Content + SEO Platform

> Goal: build an MVP that combines **PostBridge’s calendar UX** (drag-and-drop scheduling) with **Outrank-like SEO content automation** (keyword → outline → draft → optimize → schedule) and a **credit-based pricing model** inspired by **SEO Stuff**.
> Constraints: **Cross-platform social posting is a TODO (later)**; **skip Twitter/X**; **CMS/API integrations are TODO (later)**. The MVP ships as a **full-stack app** (Next.js + TypeScript + Node.js backend) with production-ready auth, persistence, queues, and billing.

---

## 0) Product Scope (MVP)

* **Included now**

  * Calendar UI with **drag-and-drop** scheduling for platform-internal items (articles, social snippets) — **no external posting yet**.
  * Outrank-style SEO flow:

    1. Keyword discovery/import
    2. Topic clustering & selection
    3. AI brief & outline
    4. AI article draft (+ SEO scoring & on-page checklist)
    5. Internal “Backlink Network” (ethical, relevance-first linking)
    6. Schedule content (internal calendar)
    7. Export drafts (copy/HTML/Markdown)
  * **Credit system** (wallet, packages, usage metering); pay-per-action.
  * Teams/projects, basic roles, and an admin panel.
* **Explicit TODO (post-MVP)**

  * Cross-platform **social posting** (Meta/IG/FB, LinkedIn, TikTok, YouTube, Pinterest, Threads, Bluesky) — **Twitter/X excluded**.
  * **CMS integrations** (WordPress, Shopify Blogs, Ghost, Webflow CMS) + **Email/Automation APIs**.
  * Web analytics integrations; backlink outreach connectors.

---

## 1) Tech Stack

* **Frontend**: Next.js (App Router), TypeScript, React Query/TanStack Query, Zustand or Redux Toolkit (light state), TailwindCSS + Headless UI, DnD kit for drag-and-drop.
* **Backend**: Node.js (TypeScript) with Next.js API routes or a separate Express/Fastify service.

  * **Workers & Queues**: BullMQ / Upstash Q / Cloud Tasks for long-running jobs (AI, clustering, scoring, link graph updates).
* **DB/Cache/Search**

  * PostgreSQL (primary data), Prisma ORM (optional) or SQL migrations (manual ok).
  * Redis (job queues, rate-limits, ephemeral caches).
  * Optional: Lite vector store (pgvector) for semantic search of topics/drafts.
* **Auth & Billing**

  * Auth.js (NextAuth) with OAuth/email; JWT session.
  * Payments: Stripe (credit packages) **OR** self-contained credits import in admin for manual top-ups during MVP.
* **AI Providers**

  * Pluggable provider interface (OpenAI / Anthropic / Gemini).
  * Server-side calls only; usage metered to credits.
* **File/Object Storage**

  * S3-compatible (R2, S3, or Supabase Storage) for exports & assets.
* **Observability**

  * Logging (pino), metrics (Prometheus/OpenTelemetry), error tracking (Sentry).

---

## 2) System Architecture (High Level)

* **Web App** (Next.js) → **API Layer** (authZ, business logic) → **DB (Postgres)**.
* **Job Workers** consume queue events for:

  * keyword clustering, SERP enrichment, outline/draft generation, SEO scoring, link graph recompute, scheduled content “go-live” (internal status flip + exports), usage billing.
* **Service Modules** (separable):

  * `keyword-svc`, `ai-writer-svc`, `seo-score-svc`, `backlink-graph-svc`, `schedule-svc`, `credits-svc`, `export-svc`.

---

## 3) Data Model (no SQL, fields only)

**Users & Orgs**

* `user`: id, email, name, role, created_at, last_login
* `org`: id, name, owner_user_id, created_at
* `org_user`: org_id, user_id, role(Owner/Admin/Editor/Viewer), invited_at, accepted_at

**Projects**

* `project`: id, org_id, name, niche/industry, locale, created_at
* `project_setting`: project_id, site_name, target_domain, brand_guidelines(json), tone/style, target_audience

**Credits & Billing**

* `credit_wallet`: org_id, balance, lifetime_spent
* `credit_package`: id, name, credits_amount, price_usd, is_active
* `credit_txn`: id, org_id, delta, reason(enum: purchase|refund|usage), ref_id (usage job), created_at
* `pricing_matrix`: id, action(enum: keyword_fetch|cluster|outline|draft|seo_score|link_update|export), credits_per_unit, min_charge

**Content Intelligence**

* `keyword`: id, project_id, term, source(enum: seed|import|suggest|serp), sv (search_volume), kd, serp_snapshot(json), locale, tags[], created_at
* `topic_cluster`: id, project_id, label, centroid_terms[], keyword_ids[], strategy(enum: awareness|moFu|boFu)
* `content_brief`: id, project_id, cluster_id, target_keyword_id, headings[], entities[], faq[], internal_links[], external_refs[], recommended_word_count
* `content_draft`: id, project_id, brief_id, version, md_body, html_body, word_count, status(enum: draft|ready|scheduled|exported), seo_score, onpage_checklist(json), created_at, updated_at, scheduled_for

**Backlink Network (internal, relevance-first)**

* `link_profile`: id, project_id, domain, topical_categories[], dr_estimate, trust_flags
* `internal_link_suggestion`: id, from_draft_id, to_draft_id, anchor_text, relevance_score, accepted(bool)
* `partner_optin`: id, org_id, domains_allowed[], rules(json), active(bool)  *(for future partner linking)*

**Scheduling & Calendar**

* `calendar_item`: id, project_id, type(enum: article|social_snippet|task), ref_id (content_draft or note), start_at, end_at, status, assigned_to
* `job`: id, type, payload(json), status(enum: queued|running|done|failed), cost_credits, started_at, finished_at

**Exports**

* `export_bundle`: id, project_id, draft_id, format(enum: md|html|docx), url, checksum, created_at

**Audit & Admin**

* `activity_log`: id, actor_user_id, org_id, action, target, meta, created_at
* `admin_flag`: id, type, subject_id, notes, created_at

---

## 4) Credit System (SEO Stuff-style)

* **Wallet & Packages**

  * Users (org scope) **buy credit packages** to top up wallet.
  * Admin-configured packages (e.g., 300 credits = $15, 1200 credits = $49, etc.).
* **Pricing Matrix**

  * Define **credits per action**:

    * Keyword fetch (per 50 terms)
    * Clustering (per 100 keywords)
    * Brief generation (per brief)
    * Outline (per outline)
    * Draft (per 1K words generated)
    * SEO score (per run)
    * Link graph update (per 10 links recomputed)
    * Export (per bundle)
* **Usage Metering**

  * Each job writes a `credit_txn` (negative delta) **atomically** with job completion.
  * If wallet < required credits, job is **blocked** with friendly upsell.
* **Free Tier / Trial**

  * Seed new org with small free credits; cap daily usage.

---

## 5) Calendar UX (PostBridge-style)

* **Views**: Month/Week/List.
* **Drag & Drop**: Move `calendar_item` to reschedule; resize to change duration.
* **Create**: Click on empty slot → “New Article Draft” wizard (choose keyword/cluster or blank).
* **Batch actions**: Multi-select → bulk move/delete/status change.
* **No external posting in MVP**: calendar triggers **internal status changes** and **exports** only.
* **Accessibility**: Keyboard nav, ARIA roles, visible focus, undo snackbars.

---

## 6) SEO Pipeline (Outrank-style, but opinionated)

**A. Keyword Intake**

* Inputs: seed keywords, competitor domains (optional), CSV import.
* Fetch suggest/related terms (provider; abstracted interface).
* Store rows with SV/KD if available; snapshot top SERP titles/URLs (optional).

**B. Topic Clustering**

* Use mini-embeddings + HDBSCAN/K-Means; label clusters via centroid terms.
* Compute intent (navigational/info/transactional) and funnel stage.
* Charge credits per N keywords processed.

**C. Content Brief**

* Generate brief per cluster/target keyword: headings (H2/H3), entities to cover, FAQs, word count, internal link candidates (existing drafts), external sources (non-spammy).
* Editable in UI before drafting.

**D. AI Outline & Draft**

* Outline generation → user approves → Draft job enqueued.
* Draft generation with style/tone constraints and **on-page SEO rules**:

  * title/meta, H1/H2 structure, entity coverage, internal link placeholders, FAQ schema (as JSON suggestion in brief).
* Post-process to compute **SEO score** and fill **on-page checklist** (readability, headings depth, link density, alt text hints, etc.).

**E. Review & Schedule**

* Editor with side-by-side: draft, checklist, SEO score, brief.
* Users fix/accept; schedule via calendar.
* “Schedule” = sets `status=scheduled` + `scheduled_for`.

**F. Export**

* At schedule time (or manual), produce export bundle: Markdown/HTML/Docx.
* Store in S3; provide download.
* (CMS/API posting = **TODO**)

---

## 7) Backlink Network (MVP, safe & relevance-first)

* **Internal Interlinking (now)**

  * Suggest **internal links between drafts** based on topical similarity and funnel adjacency.
  * Author approves; system inserts anchor suggestions into draft with toggle.

* **External Partner Opt-In (scaffold for later)**

  * Org can **opt-in** to a relevance-curated partner directory (no automated link farms).
  * Rules: topical category match, max links per article, brand safety, manual approval required.
  * MVP: UI + policy + manual vetting; actual cross-site posting is **deferred**.
  * Rationale: reduce spam risk; maintain ethical SEO.

* **Credit Economics**

  * Recompute link graph costs credits; accepted link suggestions are free.
  * Future: “credit bounties” for partners willing to reference high-quality pieces.

---

## 8) Roles, Permissions, Multitenancy

* **Org Owner/Admin**: manage billing, credit packages, members, project settings.
* **Editor**: create briefs, drafts, schedule.
* **Viewer**: read-only.
* All data scoped by **org_id** and **project_id**.

---

## 9) API & Services (contract-first; minimal examples, no code)

**Auth**

* `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/session`

**Credits**

* `GET /api/credits/wallet` → { balance }
* `POST /api/credits/purchase` → creates Stripe session (or admin manual add in MVP)
* `GET /api/credits/txns?limit=…`

**Keywords & Clusters**

* `POST /api/keywords/import` (seed terms/CSV)
* `POST /api/keywords/fetch-related` (charges credits)
* `POST /api/keywords/cluster` (enqueue job, credits based)
* `GET /api/clusters/:id`

**Briefs & Drafts**

* `POST /api/briefs` (from cluster/keyword)
* `POST /api/briefs/:id/outline` (job)
* `POST /api/briefs/:id/draft` (job)
* `GET /api/drafts/:id`
* `POST /api/drafts/:id/seo-score` (job)
* `POST /api/drafts/:id/export` (md/html/docx)

**Backlinks (internal)**

* `POST /api/links/suggest` (for project or draft)
* `POST /api/links/:id/accept`
* `POST /api/partners/optin` (scaffold)

**Calendar**

* `GET /api/calendar?project_id=…&range=…`
* `POST /api/calendar` (create item)
* `PATCH /api/calendar/:id` (drag-drop reschedule)

**Jobs**

* `GET /api/jobs/:id` (status, cost)
* Webhook (internal) from worker to finalize costs and outputs

**Admin**

* `GET /api/admin/packages` (list, manage)
* `POST /api/admin/credits/grant` (manual top-up during MVP)

---

## 10) Workers & Job Lifecycle

* **Queue Types**: `keyword:fetch`, `keyword:cluster`, `brief:outline`, `draft:write`, `seo:score`, `link:recompute`, `export:bundle`, `calendar:publish`
* **Lifecycle**:

  1. API enqueues job with estimated credit cost → provisional hold (optional)
  2. Worker executes; streams logs
  3. On success: finalize output, **charge credits**, write `credit_txn`
  4. On failure: release hold (if used), return error with retry rules
* **Rate Limits**: per org/day and burst caps to prevent runaway spend.

---

## 11) AI Provider Abstraction

* **Interface**: `generateOutline(brief)`, `generateDraft(brief, outline, wordCount)`, `scoreSEO(html|md)`
* **Safety**: fact-check heuristics (entity presence vs sources), minimize hallucinations (grounding with SERP snapshot headings), disclaimers in UI.
* **Token Controls**: cap max words per action; chunk long generations; resume on retry.

---

## 12) On-Page SEO Checker (lightweight)

* Metrics: title/meta presence, heading hierarchy, readability (Flesch-ish), entity coverage vs brief, internal link count, image alt candidate prompts.
* Output: numeric `seo_score` (0–100) + checklist items.

---

## 13) Exports

* Formats: Markdown, clean HTML (semantic), Docx (optional).
* **Naming**: `${slug}-${version}.${ext}`; store in S3; record `export_bundle`.
* **Download** from draft page and from calendar item detail.

---

## 14) Security, Privacy, Compliance

* **Least privilege** for API keys; secrets in env vault; no keys in client.
* **Row Level Security** (if using Supabase) or strict org_id filters in all queries.
* **Data retention**: allow org to delete drafts/exports.
* **Backlink policies**: prohibit spam; manual approval for any external linking.

---

## 15) Observability & Ops

* **Structured logs** per job with correlation IDs.
* **Sentry** for FE/BE errors.
* **Audit log** of user actions.
* **Daily backups** of Postgres; object storage lifecycle rules for exports.
* **Feature flags** for gradually enabling new flows.

---

## 16) Admin Console (MVP)

* Manage credit packages, manually grant credits, view org usage leaderboard, inspect failed jobs, toggle feature flags per org, review partner opt-in queue (future).

---

## 17) Roadmap / TODO (Post-MVP)

* **Cross-Platform Posting**

  * Platforms: IG/FB/LinkedIn/TikTok/YouTube/Pinterest/Threads/Bluesky
  * **Skip Twitter/X**
  * Per-platform content adapters, media handling, rate-limit aware queues, post preview validators.

* **CMS & API Integrations**

  * WordPress (REST), Shopify Blog, Ghost, Webflow CMS
  * Auth connectors (app passwords/tokens), publish & update endpoints, slug mapping, canonical/OG/meta sync.

* **Analytics**

  * UTM templates, GSC integration (impressions/clicks by URL), basic content ROI dashboard.

* **External Backlink Outreach**

  * Prospecting (topical match), email outreach templates, partner marketplace (credit bounties), strict quality gate.

* **Team Collab**

  * Comments, suggestions mode, draft approvals, editorial workflow states.

---

## 18) Definitions of Done (MVP)

* Users can:

  * Create org/project; buy credits (or receive admin top-up).
  * Import/collect keywords; cluster; generate brief/outline/draft.
  * View SEO score & checklist; edit and rescore.
  * Receive **internal link suggestions** and accept into draft.
  * Schedule drafts on a **drag-and-drop calendar**.
  * Export content to MD/HTML; download exports.
  * See accurate **credit debits** for each action; wallet balance updates.
* Admin can configure credit packages and view usage.
* All flows covered by integration tests on staging; error tracking enabled.

---

## 19) Implementation Steps (execution checklist)

**Phase A — Foundations**

1. Bootstrap Next.js (App Router, TS), Tailwind, Auth.js; set up Postgres & Prisma (or manual migrations).
2. Create core tables (users/orgs/projects/wallet/txns).
3. Add Stripe sandbox (or admin credit top-up UI for MVP).
4. Set up Redis + BullMQ; deploy a separate worker process.

**Phase B — Keywords & Clustering**

1. Keyword import UI + CSV upload → store rows.
2. Related terms fetcher job (provider adapter) → charge credits.
3. Clustering job → store clusters; cluster detail UI.

**Phase C — Brief & AI Draft**

1. Brief generator (entities/headings/FAQs/links).
2. Outline generator (approve UI).
3. Draft generator (streaming logs in UI), editor with SEO score/checklist.
4. Export (MD/HTML), bundle storage.

**Phase D — Calendar & Scheduling**

1. Calendar UI (list/week/month) with drag-drop & resize.
2. Create calendar items from drafts; schedule status changes.
3. “Publish internally” job → mark exported & ready; (external posting = TODO).

**Phase E — Backlink (Internal)**

1. Suggest internal links based on vector/topical similarity; approval flow.
2. Store accepted links; insert anchors into draft body.
3. Basic partner opt-in UI (toggle + rules) **without cross-site automation**.

**Phase F — Credits & Admin**

1. Enforce credit checks for all jobs; atomic charge on success.
2. Wallet dashboard + package purchase (or admin grant).
3. Admin console: packages, org usage, failed jobs view.

**Phase G — Hardening**

1. AuthZ checks on all endpoints; rate limits.
2. Sentry/logging; audit logs.
3. Backups; minimal E2E tests on critical flows.

---

## 20) Acceptance Tests (high level)

* Creating org/project → OK
* Buying/receiving credits → wallet balance increases → OK
* Import 100 keywords → cluster (credits deducted) → clusters visible → OK
* Create brief → outline → draft (credits deducted) → OK
* SEO score present; checklist populated → OK
* Internal link suggestions appear; accept changes content → OK
* Drag draft onto calendar date → status becomes “scheduled” → OK
* Export MD/HTML available; downloadable; file stored → OK
* Admin can see package list, grant credits, view org usage → OK

---

## 21) Non-Goals (MVP)

* No live CMS publishing (WordPress/Shopify/etc.) — **TODO**.
* No social network posting (except internal social snippet objects) — **TODO**, **Twitter/X excluded**.
* No advanced analytics or backlink outreach automation — **future**.

---

## 22) UX Notes & Content Quality

* Keep composer/editor distraction-free with a right-side SEO panel.
* Provide 3 house styles (Neutral, Conversational, Technical); project-level default.
* Add small “Fact-check” sidebar that highlights weak claims or missing cites from the brief’s external refs.
* Clear credit costs visible **before** running an action.

---

## 23) Launch Checklist

* Env/prod configs (keys, DB, storage, CORS, rate limits).
* Staging smoke tests for all job types.
* Seed free credits for new orgs.
* Privacy & backlink policy pages.
* Basic docs (“How credits work”, “From keyword to draft”, “Calendar how-to”).

---

**That’s the blueprint.** It mirrors PostBridge’s **calendar UX**, implements Outrank’s **end-to-end SEO content engine** (minus live publishing), and uses SEO Stuff’s **credit economy** to keep pricing flexible and cheaper.
