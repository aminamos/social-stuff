# Social Housing Info

Evidence-based public resource on rent stabilization definitions, the NYC rent freeze, block-by-block housing development, community land trusts, and municipal housing precedents across the USA.

Live site: [https://social-housing-info.a-8c6.workers.dev/](https://social-housing-info.a-8c6.workers.dev/)

## Overview & Pages

- **Definitions (`/definitions`)**: Rent control vs. rent stabilization vs. vacancy control — precise legal definitions and why the distinctions matter.
- **NYC Rent Freeze (`/mamdani-plan`)**: Detailed breakdown of the NYC rent freeze proposals, coverage, exceptions, and historical precedents (e.g. de Blasio RGB freezes).
- **NYC Block by Block (`/block-by-block`)**: The $28B capital housing plan — 200,000 affordable homes, municipal developer model, and the Construction Justice Act.
- **Everywhere Else (`/everywhere-else`)**: Community land trusts, public developers, and social housing models across the US (Seattle, Hawaii, Montgomery County, etc.).
- **NYC History (`/new-york`)**: Rent Guidelines Board history, 2019 HSTPA reforms, and long-term stabilization data.
- **Resources (`/resources`)**: Academic literature, policy studies, and open data sources.

## Tech Stack

- **Astro 7** (SSR mode via `@astrojs/cloudflare`)
- **Vite 8**
- **Cloudflare Workers** deployment target (`wrangler`)

## Development & Deployment

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare Workers
npm run deploy
```
