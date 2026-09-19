#!/usr/bin/env bash
# Firecrawl monitors for social-housing-info
# Run: FIRECRAWL_API_KEY=fc-... bash monitors/setup.sh
set -euo pipefail

echo "=== Setting up Firecrawl monitors ==="

# 1. NYC Rent Freeze — RGB decisions, legal challenges, coverage
firecrawl monitor create \
  --name "NYC Rent Freeze" \
  --schedule "every 6 hours" \
  --goal "Alert when the NYC Rent Guidelines Board announces decisions, rent freeze coverage changes, legal challenges are filed, or substantive policy updates occur. Ignore unrelated city news." \
  --scrape-urls \
    "https://rentguidelinesboard.cityofnewyork.us/",\
    "https://www.nyc.gov/mayors-office",\
    "https://gothamist.com/tags/rent-freeze",\
    "https://www.thecity.nyc/housing/",\
    "https://citylimits.org/category/housing/",\
    "https://hcr.ny.gov/rent-stabilization" \
  --email PLACEHOLDER@example.com

# 2. NYC Block by Block — development plan, construction, funding
firecrawl monitor create \
  --name "NYC Block by Block" \
  --schedule "every 12 hours" \
  --goal "Alert when new details emerge about Mamdani's Block by Block housing plan, including municipal development corporation updates, Construction Justice Act progress, NYCHA redevelopment, funding allocations, zoning changes, or new affordable housing project announcements. Ignore general mayoral press." \
  --scrape-urls \
    "https://www.nyc.gov/mayors-office",\
    "https://newyorkyimby.com/category/affordable-housing/",\
    "https://www.cityrealty.com/nyc/market-insight/features/future-nyc",\
    "https://www.6sqft.com/tag/affordable-housing/",\
    "https://therealdeal.com/new-york/",\
    "https://www.crainsnewyork.com/politics-policy" \
  --email PLACEHOLDER@example.com

# 3. Everywhere Else — CLTs, social housing, public developers nationwide
firecrawl monitor create \
  --name "Everywhere Else - CLTs and Social Housing" \
  --schedule "daily at 9:00" \
  --timezone "America/New_York" \
  --goal "Alert when new community land trusts launch, existing CLTs announce projects, states pass CLT or social housing legislation, public development corporations are created or expanded, or significant affordable housing policy is enacted outside New York. Focus on Hawaii, Washington, California, Minnesota, Massachusetts, Vermont, Maryland, and Rhode Island. Ignore general real estate market news." \
  --scrape-urls \
    "https://nextcity.org/features/",\
    "https://housing.seattle.gov/",\
    "https://www.knkx.org/business",\
    "https://www.hawaiinewsnow.com/news/housing/",\
    "https://bigislandnow.com/category/hawaii-county/",\
    "https://mauinow.com/",\
    "https://groundedsolutions.org/",\
    "https://shelterforce.org/",\
    "https://www.cltboston.org/",\
    "https://oaklandclt.org/",\
    "https://www.homesteadclt.org/" \
  --email PLACEHOLDER@example.com

# 4. Research & policy — academic papers, major reports
firecrawl monitor create \
  --name "Housing Policy Research" \
  --schedule "daily at 8:00" \
  --timezone "America/New_York" \
  --goal "Alert when new academic papers, policy reports, or major housing research is published. Focus on rent stabilization, community land trusts, public housing, and affordable housing development. Ignore unrelated university news." \
  --scrape-urls \
    "https://www.cura.umn.edu/research",\
    "https://furmancenter.org/research",\
    "https://www.nlihc.org/resource",\
    "https://www.cssny.org/news",\
    "https://tandn.org/",\
    "https://www.urban.org/research-area/housing" \
  --email PLACEHOLDER@example.com

echo ""
echo "=== Done! Run 'firecrawl monitor list' to verify ==="
echo "Replace PLACEHOLDER@example.com with your real email."
echo "To pause: firecrawl monitor update <id> --state paused"
