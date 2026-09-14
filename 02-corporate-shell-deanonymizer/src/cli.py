from __future__ import annotations

import sys
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


def cmd_export_graph(args):
    fixtures_dir = Path(args.fixtures) if args.fixtures else get_default_fixtures_dir()
    pipeline = DeAnonymizationPipeline()
    pipeline.load_from_fixtures(fixtures_dir)

    cyto = pipeline.graph.to_cytoscape_json()
    out_path = Path(args.output) if args.output else Path("ownership_graph.json")
    out_path.write_text(json.dumps(cyto, indent=2), encoding="utf-8")
    console.print(f"[bold green]Exported ownership graph ({len(cyto['nodes'])} nodes, {len(cyto['edges'])} edges) to:[/] {out_path.resolve()}")


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

    # export-graph
    p_exp = subparsers.add_parser("export-graph", help="Export ownership graph to Cytoscape JSON")
    p_exp.add_argument("--output", "-o", default="ownership_graph.json", help="Output file path")
    p_exp.add_argument("--fixtures", "-f", help="Path to fixtures folder")
    p_exp.set_defaults(func=cmd_export_graph)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
