from __future__ import annotations

import sys
import time
import json
import argparse
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.tree import Tree

from .engine.pipeline import DeAnonymizationPipeline

console = Console()


def get_default_fixtures_dir() -> Path:
    base_dir = Path(__file__).resolve().parent.parent
    return base_dir / "data" / "sample_fixtures"


def cmd_investigate(args):
    fixtures_dir = Path(args.fixtures) if args.fixtures else get_default_fixtures_dir()
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    result = pipeline.investigate(args.address)
    if not result.get("found"):
        console.print(f"[bold red]Error:[/] {result.get('message')}")
        sys.exit(1)

    origin = result["origin_property"]
    sisters = result["sister_properties"]
    principals = [p["full_name"] for p in result["controlling_principals"]]
    lenders = result["primary_lenders"]

    # Header Panel
    console.print(
        Panel(
            f"[bold yellow]TARGET PROPERTY:[/] {origin['address']} (PIN: {origin['parcel_id']})\n"
            f"[bold cyan]PAPER LLC:[/] {origin['owner_of_record']}\n"
            f"[bold green]UNMASKED BENEFICIAL OWNERS:[/] [bold white]{', '.join(principals) if principals else 'Unknown'}[/]\n"
            f"[bold magenta]TOTAL KNOWN PORTFOLIO:[/] {result['total_portfolio_properties']} Properties | {result['total_portfolio_units']} Units\n"
            f"[bold red]TOTAL OPEN CODE VIOLATIONS:[/] {result['total_open_violations']}\n"
            f"[bold blue]MASTER MORTGAGE ENCUMBRANCE:[/] ${result['total_mortgage_debt']:,.2f} ({', '.join(lenders)})",
            title="[bold red]SLUMLORD DE-ANONYMIZATION REPORT[/]",
            border_style="red",
        )
    )

    # Sister Properties Table
    table = Table(title=f"Sister Properties Owned by {', '.join(principals)}", show_header=True, header_style="bold green")
    table.add_column("Property Address", style="bold white")
    table.add_column("Parcel PIN", style="dim")
    table.add_column("Units", justify="right")
    table.add_column("Assessed Value", justify="right")
    table.add_column("Paper Shell LLC", style="cyan")

    table.add_row(
        f"{origin['address']} (Target)",
        origin["parcel_id"],
        str(origin["unit_count"]),
        f"${origin['assessed_value']:,.0f}",
        origin["owner_of_record"],
    )
    for s in sisters:
        table.add_row(
            s["address"],
            s["parcel_id"],
            str(s["unit_count"]),
            f"${s['assessed_value']:,.0f}",
            s["owner_of_record"],
        )
    console.print(table)

    # Unmasking Evidence Trees
    console.print("\n[bold yellow]Multi-Hop Evidence Chains (Crossover Traversal):[/]")
    for p in result.get("explanation_paths", []):
        tree = Tree(f"[bold green]{p['target_address']}[/] (Distance: {p['path_length']} hops)")
        for step in p["steps"]:
            tree.add(f"[dim]{step}[/]")
        console.print(tree)

    # Token Accounting Panel
    accounting = pipeline.get_total_token_accounting()
    console.print(
        Panel(
            f"Prompt Tokens: {accounting['total_prompt_tokens']:,} | "
            f"Completion Tokens: {accounting['total_completion_tokens']:,} | "
            f"[bold green]Total Tokens: {accounting['total_tokens']:,}[/] | "
            f"[bold yellow]Inference Cost: ${accounting['total_estimated_cost_usd']:.4f}[/]",
            title="[bold blue]Token Expenditure Accounting[/]",
            border_style="blue",
        )
    )


def cmd_dossier(args):
    fixtures_dir = Path(args.fixtures) if args.fixtures else get_default_fixtures_dir()
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    dossier_text = pipeline.generate_dossier(args.address)

    if args.output:
        out_path = Path(args.output)
        out_path.write_text(dossier_text, encoding="utf-8")
        console.print(f"[bold green]Tactical Tenant Union Dossier written to:[/] {out_path.resolve()}")
    else:
        console.print(dossier_text)


def cmd_clusters(args):
    fixtures_dir = Path(args.fixtures) if args.fixtures else get_default_fixtures_dir()
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    clusters = pipeline.get_all_clusters()
    table = Table(title="Unmasked Landlord Syndicates Across City", show_header=True, header_style="bold magenta")
    table.add_column("Syndicate Alias", style="bold white")
    table.add_column("Beneficial Owners", style="green")
    table.add_column("Properties", justify="right")
    table.add_column("Total Units", justify="right")
    table.add_column("Open Violations", justify="right", style="red")
    table.add_column("Total Valuation", justify="right")
    table.add_column("Blanket Loan Debt", justify="right", style="blue")

    for c in clusters:
        table.add_row(
            c.cluster_alias,
            ", ".join(c.ultimate_beneficial_owners) or "N/A",
            str(len(c.property_parcel_ids)),
            str(c.total_units),
            str(c.open_violations_count),
            f"${c.total_assessed_value:,.0f}",
            f"${c.total_mortgage_debt:,.0f}",
        )
    console.print(table)


def cmd_live_search(args):
    console.print(f"[bold cyan]Connecting to Live City of Minneapolis Open Data FeatureServer...[/]")
    pipeline = DeAnonymizationPipeline()
    live_result = pipeline.load_from_live_query(query=args.query, limit=args.limit)

    props = live_result["properties"]
    if not props:
        console.print(f"[bold yellow]No properties found matching query '{args.query}' in live database.[/]")
        return

    console.print(
        Panel(
            f"Query: [bold white]{args.query}[/]\n"
            f"Properties Found: [bold green]{len(props)}[/]\n"
            f"Total Residential Units: [bold magenta]{sum(p.unit_count for p in props):,}[/]",
            title="[bold green]Live Municipal Open Data Results[/]",
            border_style="green",
        )
    )

    table = Table(title=f"Live Unmasked Rental Properties ({args.query})", show_header=True, header_style="bold cyan")
    table.add_column("Property Address", style="bold white")
    table.add_column("APN / Parcel", style="dim")
    table.add_column("Units", justify="right")
    table.add_column("Owner of Record", style="yellow")
    table.add_column("License Status / Tier", style="magenta")
    table.add_column("Applicant / Manager Contact", style="cyan")

    for p in props:
        table.add_row(
            p.address,
            p.parcel_id,
            str(p.unit_count),
            p.owner_of_record,
            p.rental_license_status,
            p.rental_license_contact_name or "N/A",
        )
    console.print(table)

    # Clusters from live data
    clusters = pipeline.get_all_clusters()
    if len(clusters) > 1:
        console.print("\n[bold yellow]Identified Multi-Building Portfolios / Syndicates:[/]")
        for c in clusters:
            console.print(f"- [bold white]{c.cluster_alias}[/]: {len(c.property_addresses)} buildings ({c.total_units} units)")

    # Token Accounting
    accounting = pipeline.get_total_token_accounting()
    console.print(
        Panel(
            f"Prompt Tokens: {accounting['total_prompt_tokens']:,} | "
            f"Completion Tokens: {accounting['total_completion_tokens']:,} | "
            f"[bold green]Total Tokens: {accounting['total_tokens']:,}[/] | "
            f"[bold yellow]Inference Cost: ${accounting['total_estimated_cost_usd']:.4f}[/]",
            title="[bold blue]Live Pipeline Token Accounting[/]",
            border_style="blue",
        )
    )


def cmd_ocr_ingest(args):
    file_path = Path(args.file)
    if not file_path.exists():
        console.print(f"[bold red]File not found:[/] {file_path}")
        sys.exit(1)

    console.print(f"[bold cyan]Running document OCR & LLM extraction ({args.provider or 'auto'} / {args.model or 'default'})...[/]")
    pipeline = DeAnonymizationPipeline(
        provider=args.provider,
        model=args.model,
        base_url=args.base_url,
    )
    result = pipeline.ingest_document(file_path=file_path, doc_type=args.doc_type)

    console.print(
        Panel(
            f"File: [bold white]{file_path.name}[/]\n"
            f"Document Type: [bold cyan]{args.doc_type}[/]\n"
            f"Extracted Result:\n{json.dumps(result.model_dump() if hasattr(result, 'model_dump') else result, indent=2)}",
            title="[bold green]Document Extraction Complete[/]",
            border_style="green",
        )
    )


def cmd_live_sos(args):
    console.print(f"[bold cyan]Searching Secretary of State Corporate Registration Database...[/]")
    pipeline = DeAnonymizationPipeline()
    records = pipeline.search_sos(args.name)

    table = Table(title=f"Secretary of State Business Filings ({args.name})", show_header=True, header_style="bold green")
    table.add_column("Filing Number", style="dim")
    table.add_column("Legal Entity Name", style="bold white")
    table.add_column("Entity Type", style="cyan")
    table.add_column("Status", style="green")

    for r in records:
        table.add_row(
            r.get("filing_number", "N/A"),
            r.get("legal_name", "N/A"),
            r.get("entity_type", "N/A"),
            r.get("status", "N/A"),
        )
    console.print(table)


def cmd_sync_all(args):
    from .engine.local_store import LocalRentalStore
    store = LocalRentalStore()
    console.print(f"[bold cyan]Connecting to City of Minneapolis Open Data to sync all active rental licenses...[/]")
    t0 = time.time()
    count = store.sync_all_from_api(live_client=None)
    duration = time.time() - t0
    console.print(
        Panel(
            f"[bold green]Successfully synced {count:,} active rental licenses![/]\n"
            f"Stored in local SQLite database: [dim]{store.db_path}[/]\n"
            f"Time elapsed: [bold yellow]{duration:.2f} seconds[/]",
            title="[bold green]Citywide Registry Sync Complete[/]",
            border_style="green",
        )
    )


def cmd_top_syndicates(args):
    from .engine.local_store import LocalRentalStore
    store = LocalRentalStore()
    if store.count() == 0:
        console.print("[yellow]Local database empty. Syncing first...[/]")
        store.sync_all_from_api(live_client=None)

    syndicates = store.get_top_syndicates_by_email(limit=args.limit)
    table = Table(
        title=f"Top {args.limit} Largest Multi-Building Landlord Syndicates in Minneapolis",
        show_header=True,
        header_style="bold magenta",
    )
    table.add_column("Management / Applicant Email", style="bold cyan")
    table.add_column("Key Contact", style="white")
    table.add_column("Buildings", justify="right", style="yellow")
    table.add_column("Shell LLCs", justify="right", style="dim")
    table.add_column("Total Units", justify="right", style="bold green")
    table.add_column("Tier 3 (Worst)", justify="right", style="bold red")

    for s in syndicates:
        table.add_row(
            s["applicant_email"],
            s["applicant_name"] or "N/A",
            str(s["property_count"]),
            str(s["shell_count"]),
            f"{s['total_units']:,}",
            str(s["tier3_count"]),
        )
    console.print(table)


def cmd_export_r2(args):
    from .engine.local_store import LocalRentalStore
    from .engine.cloudflare_sync import export_r2_snapshot
    store = LocalRentalStore()
    if store.count() == 0:
        console.print("[yellow]Local database empty. Syncing first...[/]")
        store.sync_all_from_api(live_client=None)

    out_path = Path(args.output) if args.output else Path("data/minneapolis_rental_licenses_snapshot.json.gz")
    export_r2_snapshot(store, out_path)
    size_mb = out_path.stat().st_size / (1024 * 1024)
    console.print(
        Panel(
            f"[bold green]Compressed R2 Snapshot Created:[/] {out_path.resolve()}\n"
            f"Total Records: [bold yellow]{store.count():,}[/]\n"
            f"Compressed Gzip Size: [bold cyan]{size_mb:.2f} MB[/] (Free within Cloudflare R2 10GB quota)\n"
            f"S3/R2 Path: [dim]r2://mpls-rental-registry/snapshots/{out_path.name}[/]",
            title="[bold green]Cloudflare R2 Snapshot Ready[/]",
            border_style="green",
        )
    )


def cmd_generate_d1_seed(args):
    from .engine.local_store import LocalRentalStore
    from .engine.cloudflare_sync import generate_d1_seed_sql
    store = LocalRentalStore()
    if store.count() == 0:
        console.print("[yellow]Local database empty. Syncing first...[/]")
        store.sync_all_from_api(live_client=None)

    out_path = Path(args.output) if args.output else Path("data/d1_seed.sql")
    generate_d1_seed_sql(store, out_path)
    size_mb = out_path.stat().st_size / (1024 * 1024)
    console.print(
        Panel(
            f"[bold green]Cloudflare D1 SQL Seed Script Generated:[/] {out_path.resolve()}\n"
            f"Total Statements: [bold yellow]{store.count():,} rows[/]\n"
            f"SQL File Size: [bold cyan]{size_mb:.2f} MB[/]\n"
            f"Deploy Command: [bold white]npx wrangler d1 execute mpls-housing-db --file={out_path.name} --remote[/]",
            title="[bold green]Cloudflare D1 Seed Script Ready[/]",
            border_style="green",
        )
    )


def cmd_export_graph(args):
    fixtures_dir = Path(args.fixtures) if args.fixtures else get_default_fixtures_dir()
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    cyto = pipeline.graph.to_cytoscape_json()
    out_path = Path(args.output) if args.output else Path("ownership_graph.json")
    out_path.write_text(json.dumps(cyto, indent=2), encoding="utf-8")
    console.print(f"[bold green]Exported ownership graph ({len(cyto['nodes'])} nodes, {len(cyto['edges'])} edges) to:[/] {out_path.resolve()}")


def cmd_metro_cities(args):
    from .engine.local_store import LocalRentalStore
    from .extractors.metro_client import HENNEPIN_MUNICIPALITIES, RAMSEY_MUNICIPALITIES
    store = LocalRentalStore()
    summary = store.get_metro_summary()

    console.print(
        Panel(
            f"[bold yellow]TWIN CITIES METRO COVERAGE REPORT[/]\n"
            f"[bold cyan]Total Hennepin Municipalities:[/] {len(HENNEPIN_MUNICIPALITIES)} cities/townships (448,087 parcels)\n"
            f"[bold magenta]Total Ramsey Municipalities:[/] {len(RAMSEY_MUNICIPALITIES)} cities/townships (167,853 parcels)\n"
            f"[bold green]Active Rental Licenses in Local DB:[/] {summary['total_licenses']:,} properties ({summary['total_units']:,} units)\n"
            f"[bold white]Multi-Family Parcels in Local DB:[/] {summary['total_parcels']:,} parcels",
            title="[bold blue]Hennepin & Ramsey County Jurisdictions[/]",
            border_style="blue",
        )
    )

    # Table of Rental Licenses by City
    table_lic = Table(title="Municipal Rental Licensing / Certificate of Occupancy Coverage", show_header=True, header_style="bold green")
    table_lic.add_column("City / Municipality", style="bold white")
    table_lic.add_column("County", style="cyan")
    table_lic.add_column("Rental Licenses / Certificates", justify="right", style="yellow")
    table_lic.add_column("Total Units", justify="right", style="bold green")

    for row in summary["rental_licenses_by_city"]:
        table_lic.add_row(
            row["city"],
            row["county"],
            f"{row['license_count']:,}",
            f"{row['total_units']:,}" if row["total_units"] else "N/A"
        )
    console.print(table_lic)

    # Table of Parcels by City
    if summary["parcels_by_city"]:
        table_p = Table(title="County Property Parcels by City (Sample/Multi-Family Ingestion)", show_header=True, header_style="bold magenta")
        table_p.add_column("City / Municipality", style="bold white")
        table_p.add_column("County", style="cyan")
        table_p.add_column("Parcels", justify="right", style="yellow")
        table_p.add_column("Total Market Value", justify="right", style="bold green")

        for row in summary["parcels_by_city"][:20]:
            table_p.add_row(
                row["city"],
                row["county"],
                f"{row['parcel_count']:,}",
                f"${row['total_market_val']:,.0f}" if row["total_market_val"] else "$0"
            )
        console.print(table_p)


def cmd_metro_search(args):
    from .extractors.metro_client import MetroCountyClient
    from .engine.local_store import LocalRentalStore

    query = args.query.strip()
    console.print(f"[cyan]Searching Twin Cities Metro registries for:[/] [bold white]'{query}'[/]...")

    if args.live:
        client = MetroCountyClient()
        res = client.search_metro_syndicate(query, limit_per_jurisdiction=args.limit)

        summary = res["summary"]
        console.print(
            Panel(
                f"[bold yellow]CROSS-COUNTY DE-ANONYMIZATION MATCHES:[/] {summary['total_records']} total records\n"
                f"[bold cyan]Municipalities Identified:[/] {', '.join(summary['jurisdictions']) if summary['jurisdictions'] else 'None'}\n"
                f"[bold green]Total Residential Units:[/] {summary['total_units']:,}\n"
                f"[bold white]Estimated Market Valuation:[/] ${summary['total_market_value']:,.0f}\n"
                f"[bold magenta]Associated Shell Entities:[/] {', '.join(summary['owner_names'][:5])}...",
                title=f"[bold green]Live Metro Footprint: {query}[/]",
                border_style="green",
            )
        )

        table = Table(title=f"Live Properties Associated with '{query}'", show_header=True, header_style="bold yellow")
        table.add_column("Jurisdiction", style="cyan")
        table.add_column("Property Address / ID", style="bold white")
        table.add_column("Paper Shell / Owner", style="magenta")
        table.add_column("Units / Value", justify="right", style="green")

        for lic in res["minneapolis_licenses"][:10]:
            table.add_row("Minneapolis", lic.get("address", ""), lic.get("ownerName", ""), f"{lic.get('licensedUnits', 1)} units")
        for stp in res["stpaul_licenses"][:10]:
            table.add_row("Saint Paul", stp.get("ADDRESS", ""), stp.get("PROPNAME", ""), f"{stp.get('UNITS', 1)} units ({stp.get('GRADE', 'Grade A')})")
        for bp in res["brooklyn_park_rentals"][:5]:
            table.add_row("Brooklyn Park", bp.get("FullAddress", ""), bp.get("LicenseTypeDescription", ""), "Rental License")
        for rc in res["ramsey_parcels"][:10]:
            table.add_row(rc.get("SiteCityName", "Ramsey"), rc.get("SiteAddress", ""), rc.get("OwnerName", ""), f"${float(rc.get('EMVTotal') or 0):,.0f}")
        for hc in res["hennepin_parcels"][:10]:
            table.add_row(str(hc.get("MUNIC_NM", "Hennepin")).strip(), f"{hc.get('HOUSE_NO', '')} {hc.get('STREET_NM', '')}", hc.get("OWNER_NM", ""), f"${float(hc.get('MKT_VAL_TOT') or 0):,.0f}")

        console.print(table)
    else:
        # Search local fast SQLite store
        store = LocalRentalStore()
        lic_results = store.search(query, limit=args.limit)
        parcel_results = store.search_parcels(query, limit=args.limit)

        table = Table(title=f"Local Database Results for '{query}'", show_header=True, header_style="bold green")
        table.add_column("City", style="cyan")
        table.add_column("Address / APN", style="bold white")
        table.add_column("Owner / Entity", style="magenta")
        table.add_column("Contact / Taxpayer", style="dim")
        table.add_column("Units / Value", justify="right", style="green")

        for r in lic_results:
            table.add_row(
                r.get("city", "Minneapolis"),
                f"{r.get('address', '')}\n[dim]{r.get('apn', '')}[/]",
                r.get("owner_name", "") or "Unknown",
                r.get("applicant_name", "") or r.get("applicant_email", "") or "",
                f"{r.get('units', 1)} units ({r.get('tier', '')})"
            )

        for p in parcel_results:
            table.add_row(
                p.get("city", ""),
                f"{p.get('address', '')}\n[dim]PID: {p.get('pid', '')}[/]",
                p.get("owner_name", "") or "Unknown",
                p.get("taxpayer_name", "") or "",
                f"${p.get('market_value', 0):,.0f}"
            )

        console.print(table)
        console.print(f"[bold green]Found {len(lic_results)} rental licenses and {len(parcel_results)} parcels matching '{query}'.[/]")


def cmd_sync_metro(args):
    from .extractors.metro_client import MetroCountyClient
    from .engine.local_store import LocalRentalStore

    store = LocalRentalStore()
    client = MetroCountyClient()

    console.print("[bold cyan]1. Syncing City of Saint Paul Residential Certificates of Occupancy...[/]")
    stp_synced = store.sync_stpaul_cofo(batch_size=2000)
    console.print(f"[bold green]Synced {stp_synced:,} Saint Paul rental licenses![/]")

    console.print("\n[bold cyan]2. Syncing City of Brooklyn Park Rental Licenses...[/]")
    bp_synced = store.sync_brooklyn_park_rentals(batch_size=2000)
    console.print(f"[bold green]Synced {bp_synced:,} Brooklyn Park rental licenses![/]")

    console.print("\n[bold cyan]3. Ingesting Ramsey County Multi-Family Parcels (4+ units)...[/]")
    ramsey_apts = client.fetch_ramsey_parcels(where="LivingUnit >= 4 OR UseType1 LIKE '%APARTMENT%'", limit=3000)
    r_count = store.insert_county_parcels(ramsey_apts, "Ramsey")
    console.print(f"[bold green]Ingested {r_count:,} Ramsey County apartment parcels![/]")

    console.print("\n[bold cyan]4. Ingesting Hennepin County Suburban Multi-Family Parcels...[/]")
    hennepin_apts = client.fetch_hennepin_parcels(where="MUNIC_NM NOT LIKE 'MINNEAPOLIS%' AND (PR_TYP_NM1 = 'APARTMENT' OR PR_TYP_NM1 = 'LOW INCOME RENTAL')", limit=3000)
    h_count = store.insert_county_parcels(hennepin_apts, "Hennepin")
    console.print(f"[bold green]Ingested {h_count:,} Hennepin County suburban apartment parcels![/]")

    summary = store.get_metro_summary()
    console.print(
        Panel(
            f"[bold green]Total Rental Licenses in Store:[/] {summary['total_licenses']:,} ({summary['total_units']:,} units)\n"
            f"[bold green]Total Multi-Family Parcels in Store:[/] {summary['total_parcels']:,} parcels across Hennepin and Ramsey",
            title="[bold yellow]Metro Sync Complete[/]",
            border_style="green",
        )
    )


def cmd_wage_theft(args):
    from .engine.local_store import LocalRentalStore
    store = LocalRentalStore()
    if store.wage_theft_count() == 0:
        store.seed_default_wage_theft_records()

    query = args.query.strip()
    records = store.search_wage_theft(query, limit=args.limit)

    if not records:
        console.print(f"[yellow]No wage theft or labor enforcement records found matching:[/] '{query}'")
        return

    table = Table(
        title=f"Wage Theft & Labor Enforcement Records for '{query}'",
        show_header=True,
        header_style="bold red"
    )
    table.add_column("Case ID / Agency", style="cyan")
    table.add_column("Respondent / Employer", style="bold white")
    table.add_column("City", style="dim")
    table.add_column("Violation Type", style="yellow")
    table.add_column("Back Wages Recovered", justify="right", style="bold green")
    table.add_column("Civil Penalties", justify="right", style="bold red")
    table.add_column("Workers", justify="right", style="magenta")
    table.add_column("Status", style="bold cyan")

    for r in records:
        table.add_row(
            f"{r['case_id']}\n[dim]{r['source_agency']}[/]",
            f"{r['respondent_legal_name']}" + (f"\n[dim]DBA: {r['trade_name']}[/]" if r.get("trade_name") else ""),
            r.get("city", "Minneapolis"),
            r.get("violation_type", "FLSA_OVERTIME"),
            f"${float(r.get('back_wages_recovered') or 0):,.2f}",
            f"${float(r.get('civil_penalties_assessed') or 0):,.2f}",
            str(r.get("workers_affected", 0)),
            r.get("status", "CONFIRMED")
        )

    console.print(table)


def cmd_wage_theft_top(args):
    from .engine.local_store import LocalRentalStore
    store = LocalRentalStore()
    if store.wage_theft_count() == 0:
        store.seed_default_wage_theft_records()

    top = store.get_top_wage_theft_offenders(limit=args.limit)

    table = Table(
        title="Top Wage Theft & Labor Violations (Twin Cities Residential & Property Services)",
        show_header=True,
        header_style="bold red"
    )
    table.add_column("Employer / Corporate Entity", style="bold white")
    table.add_column("Trade Name / DBA", style="cyan")
    table.add_column("City", style="dim")
    table.add_column("Total Recovered (Wages + Fines)", justify="right", style="bold green")
    table.add_column("Workers Exploited", justify="right", style="bold yellow")
    table.add_column("Repeat Violator?", justify="center", style="bold red")

    for t in top:
        repeat_badge = "[bold red]YES[/]" if t.get("is_repeat_violator") else "[dim]No[/]"
        table.add_row(
            t["respondent_legal_name"],
            t.get("trade_name") or "N/A",
            t.get("city", "Twin Cities"),
            f"${t['total_recovered']:,.2f}",
            f"{t['total_workers_affected']:,}",
            repeat_badge
        )

    console.print(table)




def main():
    parser = argparse.ArgumentParser(description="Corporate Shell Entity & Slumlord De-anonymizer CLI")
    parser.add_argument("--provider", help="LLM provider: ollama, openai, groq, deepseek, offline")
    parser.add_argument("--model", help="LLM model name (e.g. llama3.2, mistral, gpt-4o-mini)")
    parser.add_argument("--base-url", help="Custom OpenAI-compatible base URL")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # investigate
    p_inv = subparsers.add_parser("investigate", help="Investigate a building address and unmask sister properties")
    p_inv.add_argument("--address", "-a", required=True, help="Property address or parcel PIN")
    p_inv.add_argument("--fixtures", "-f", help="Path to fixtures folder")
    p_inv.set_defaults(func=cmd_investigate)

    # dossier
    p_dos = subparsers.add_parser("dossier", help="Generate a tactical tenant union organizing dossier")
    p_dos.add_argument("--address", "-a", required=True, help="Property address or parcel PIN")
    p_dos.add_argument("--output", "-o", help="File to write markdown dossier to")
    p_dos.add_argument("--fixtures", "-f", help="Path to fixtures folder")
    p_dos.set_defaults(func=cmd_dossier)

    # clusters
    p_cls = subparsers.add_parser("clusters", help="List all unmasked beneficial owner clusters")
    p_cls.add_argument("--fixtures", "-f", help="Path to fixtures folder")
    p_cls.set_defaults(func=cmd_clusters)

    # live-search
    p_live = subparsers.add_parser("live-search", help="Query live Minneapolis Open Data FeatureServer to unmask a landlord or management network")
    p_live.add_argument("--query", "-q", required=True, help="Landlord name, email domain, phone number, or street name")
    p_live.add_argument("--limit", "-l", type=int, default=25, help="Max properties to fetch")
    p_live.set_defaults(func=cmd_live_search)

    # ocr-ingest
    p_ocr = subparsers.add_parser("ocr-ingest", help="Run local OCR and LLM extraction on a PDF, image, or scan")
    p_ocr.add_argument("--file", "-f", required=True, help="Path to document file (PDF, PNG, JPG, TXT)")
    p_ocr.add_argument("--doc-type", choices=["filing", "mortgage", "deed", "general"], default="filing", help="Document type")
    p_ocr.add_argument("--provider", help="LLM provider: ollama, openai, groq, offline")
    p_ocr.add_argument("--model", help="LLM model name")
    p_ocr.add_argument("--base-url", help="OpenAI-compatible base URL")
    p_ocr.set_defaults(func=cmd_ocr_ingest)

    # live-sos
    p_sos = subparsers.add_parser("live-sos", help="Search Secretary of State corporate registration portal")
    p_sos.add_argument("--name", "-n", required=True, help="Legal business entity name")
    p_sos.set_defaults(func=cmd_live_sos)

    # sync-all-licenses
    p_sync = subparsers.add_parser("sync-all-licenses", help="Bulk-download all 23,000+ active rental licenses in Minneapolis to local SQLite")
    p_sync.set_defaults(func=cmd_sync_all)

    # top-syndicates
    p_top = subparsers.add_parser("top-syndicates", help="Rank largest multi-building corporate syndicates in Minneapolis")
    p_top.add_argument("--limit", "-l", type=int, default=20, help="Number of syndicates to display")
    p_top.set_defaults(func=cmd_top_syndicates)

    # export-r2
    p_r2 = subparsers.add_parser("export-r2", help="Export compressed JSON snapshot for Cloudflare R2")
    p_r2.add_argument("--output", "-o", help="Output .json.gz file path")
    p_r2.set_defaults(func=cmd_export_r2)

    # generate-d1-seed
    p_d1 = subparsers.add_parser("generate-d1-seed", help="Generate SQL seed script for Cloudflare D1")
    p_d1.add_argument("--output", "-o", help="Output .sql file path")
    p_d1.set_defaults(func=cmd_generate_d1_seed)

    # metro-cities
    p_mc = subparsers.add_parser("metro-cities", help="Display rental licenses and parcel counts across Hennepin and Ramsey cities")
    p_mc.set_defaults(func=cmd_metro_cities)

    # metro-search
    p_ms = subparsers.add_parser("metro-search", help="Search across all cities in Hennepin and Ramsey counties simultaneously")
    p_ms.add_argument("--query", "-q", required=True, help="Landlord name, shell entity, or address")
    p_ms.add_argument("--limit", "-l", type=int, default=25, help="Max results to display")
    p_ms.add_argument("--live", action="store_true", help="Query live ArcGIS FeatureServers instead of local SQLite store")
    p_ms.set_defaults(func=cmd_metro_search)

    # sync-metro
    p_sm = subparsers.add_parser("sync-metro", help="Sync rental licenses and multi-family parcels for St. Paul, Brooklyn Park, and county GIS")
    p_sm.set_defaults(func=cmd_sync_metro)

    # wage-theft
    p_wt = subparsers.add_parser("wage-theft", help="Search wage theft enforcement actions, settlements, and civil citations")
    p_wt.add_argument("--query", "-q", required=True, help="Employer name, property management company, or trade name")
    p_wt.add_argument("--limit", "-l", type=int, default=25, help="Max results to display")
    p_wt.set_defaults(func=cmd_wage_theft)

    # wage-theft-top
    p_wtt = subparsers.add_parser("wage-theft-top", help="Rank top wage theft offenders in Twin Cities residential & property services")
    p_wtt.add_argument("--limit", "-l", type=int, default=20, help="Number of offenders to display")
    p_wtt.set_defaults(func=cmd_wage_theft_top)

    args = parser.parse_args()
    args.func(args)




if __name__ == "__main__":
    main()
