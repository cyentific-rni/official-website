# Cyentific website

A static Astro marketing website for Cyentific. Editable source lives in `src/`; `dist/` is generated. No database, analytics service or client-side UI framework is required.

## Run locally

Use Node.js 24 LTS (`.nvmrc`) and npm:

```bash
npm ci
npm run dev
```

Open the address printed by Astro, normally http://localhost:4173. Install the recommended Astro VS Code extension for template support. `node_modules/`, `.astro/` and `dist/` stay local and are not tracked by Git.

## Build for local review

```bash
npm run build:preview
npm run preview
```

Review builds use an explicit placeholder origin (`https://preview.invalid`) unless `SITE_URL` is supplied. Every page has `noindex`, and `robots.txt` disallows crawling. The placeholder is only for local review and must not be used for a public deployment.

## Build for production

Copy `.env.example` to `.env.local`, then set the intended public origin and base path:

```dotenv
SITE_URL=https://cyentific.eu
SITE_BASE=/
```

The agreed public origin is `https://cyentific.eu/`. Setting this build value does not bind the domain or change DNS. For a project subdirectory, set `SITE_BASE=/repository-name/`; keep `SITE_URL` as the origin without a path. Configuration reads `.env`, `.env.local`, and mode-specific environment files; process variables take precedence. `npm run build -- --mode staging` selects `.env.staging` consistently for routing, metadata, enquiry configuration and build validation. Set `SITE_BUILD_MODE=staging` when testing or previewing that build; `NODE_ENV` does not select environment files. Do not commit environment files containing local configuration or credentials.

```bash
npm run build
npm run preview
```

A production build fails when `SITE_URL` is absent, is not HTTPS, or contains a path, credentials, query or fragment. Canonical URLs, social metadata, sitemap and discovery files use the chosen origin and base path. Local development does not need a public domain.

## Edit content and components

| Change | Location |
| --- | --- |
| Homepage copy, services, workflow and FAQ | `src/content/home.json` |
| OMNIRES messaging, architecture and FAQ | `src/content/product.json` |
| NSOAR modules, integrations and FAQ | `src/content/nsoar.json` |
| Consultancy descriptions and deliverables | `src/content/services.json` |
| Company copy and public contributions | `src/content/company.json` |
| Contact details, presentation wording, enquiry response target and navigation | `src/content/site.json` |
| Privacy sections and legal copy | `src/content/privacy.json`, `src/content/legal.json` |
| Page composition and page-specific text | `src/pages/` |
| Shared components | `src/components/` |
| Metadata and structured data | `src/layouts/Base.astro`, `src/lib/discovery.ts` |
| Enquiry configuration and privacy behaviour | `src/lib/contact.ts`, `src/components/ContactPrivacy.astro` |
| Design and responsive layouts | `src/styles/global.css` |
| Navigation, workflow tabs and enquiry behaviour | `src/scripts/site.ts` |
| Logo and favicon | `public/assets/` |

Keep JSON valid. Most content fields are plain text; legal section bodies contain trusted, repository-authored HTML. Do not put untrusted submissions into those fields. Generated files in `dist/` are overwritten on the next build.

Public pages lead with customer needs, useful capabilities and a clear way to engage. Confirm product claims against the agreed capabilities before changing them. Avoid publishing validation matrices, backend component inventories, development checklists or defensive caveats as sales copy. Keep material product availability information concise and describe supported features accurately.

Reference screenshots in `resources/` show the NSOAR v1 prototype. They stay outside `public/` and are excluded from website builds and source exports. Use them to understand the product, then use approved v2 visuals for public presentation. The commercial v2 release is being prepared. “N” stands for neuro-symbolic; the CACAO ontology and its integration are development work, so describe them as product direction rather than released features.

The current presentation offer is an online meeting with its agenda and date agreed together. The enquiry response target is two business days; it is not an operational support commitment. Do not add a fixed session duration, complimentary-session promise, fixed pilot timeline or numerical price without agreement. No individual profiles are published. Agree any future team biographies and project attribution before publication. Examples use fictional infrastructure and are labelled illustrative. Explain the responsible entity and the specialists' actual role when describing work involving another organisation. Publish measured outcomes only when supporting evidence and permission are available.

## Validate changes

```bash
npm run check
npm run build:preview
npx playwright install chromium
npm run test:browser
```

`check` runs Astro type checking and configuration/build regressions, including missing production origins and agreement between direct submissions and privacy copy. `build` and `build:preview` also validate generated links, anchors, headings, metadata, structured data, discovery files and compressed asset budgets. Run `npm run check:build` to inspect an existing `dist/` directory independently.

The shared logo uses a smaller display asset; social metadata uses `public/assets/social-card.png`. After a branding change, regenerate the sharing card with `npm run assets:share` (or `PLAYWRIGHT_CHANNEL=chrome npm run assets:share`). The rendering script uses the original logo and locally installed font.

Browser tests use a temporary preview server on port 4329. They cover the pages at desktop, tablet and mobile widths, automated accessibility rules, keyboard navigation, all workflow panels, email drafts, mocked submission success/failure, and usable fallbacks with JavaScript disabled. No enquiry is sent to a real service. To use installed Google Chrome locally, run `PLAYWRIGHT_CHANNEL=chrome npm run test:browser`. Automated scans do not establish complete accessibility conformance or measure conversion rates.

## Enquiries

The default mode prepares an email draft addressed to `contact@cyentific.eu`. Nothing is sent until the visitor sends the draft from their email app. A copyable fallback is included. Without JavaScript, a direct email link is available and form fields remain disabled; enquiry values cannot be submitted as a GET query. Confirm the preferred inbox and delivery before launch.

To enable an existing direct-submission service, configure all three values:

```dotenv
PUBLIC_CONTACT_ENDPOINT=https://your-provider.example/enquiries
CONTACT_PROVIDER_NAME=Your provider name
CONTACT_PROVIDER_PRIVACY_URL=https://your-provider.example/privacy
```

These are placeholders. The actual HTTPS endpoint must accept a JSON POST containing `email`, `interest` and `message`, allow CORS from the website origin, validate and rate-limit submissions, and arrange delivery or storage. It must return a successful status only after accepting the enquiry. This repository does not provision a delivery service. Do not put API keys in the endpoint or any public environment variable.

The privacy notice switches with the same configuration as the form and identifies the configured provider. Builds reject missing provider details or invalid HTTPS URLs. Confirm the actual provider's processing, retention and transfer arrangements before enabling it, and update the remaining privacy sections when those arrangements change. Failed or timed-out submissions preserve the visitor's input.

## Deploy

The production target is [cyentific.eu](https://cyentific.eu/) on GitHub Pages, with source in [cyentific-rni/official-website](https://github.com/cyentific-rni/official-website). The SSH remote is `git@github.com:cyentific-rni/official-website.git`.

`.github/workflows/ci.yml` validates pushes and pull requests. `.github/workflows/pages.yml` publishes **only when run manually from `main`**. It builds with `SITE_URL=https://cyentific.eu` and `SITE_BASE=/`, runs the checks and browser tests, then deploys `dist/`. No repository variables are required for the default email-draft contact flow. Optional direct-enquiry variables are read only by the deployment workflow.

Follow [the GitHub Pages launch guide](docs/deployment.md) to select GitHub Actions as the Pages source, bind the domain, run the publication workflow and check HTTPS. Committing `public/CNAME` alone does not bind a custom domain for an Actions deployment. The SaaS application requires separate application hosting.

## Discovery

The build creates page metadata, structured data, `sitemap.xml`, `robots.txt`, the `robot.txt` compatibility alias, `llms.txt`, `llms-full.txt`, `ai.txt`, and security contact files. Machine-readable summaries are generated from website content; they do not guarantee search rankings or AI citations.

RFC 9116 contact information lives at `.well-known/security.txt`, with a root alias. Renew the expiry in `src/lib/discovery.ts` before October 2027. Build validation rejects an expired or excessively distant expiry.

## Collaboration and source export

Use branches and reviewed pull requests. Agree content and product claims before merging. Keep dependencies and generated output out of Git; retain `package-lock.json` for reproducible installs.

After committing the source you want to export:

```bash
npm run export
# Optional destination:
npm run export -- /path/to/cyentific-website-source.zip
```

The exporter packages **committed HEAD**, excluding uncommitted edits, dependencies, build output, environment secrets, Git history and private review-host configuration. Optional editor, workflow and environment-example files are included when present in that commit. Missing optional directories do not break export. The default ZIP is ignored by Git.
