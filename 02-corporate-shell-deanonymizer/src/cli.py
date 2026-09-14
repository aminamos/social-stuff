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

    # export-graph
    p_exp = subparsers.add_parser("export-graph", help="Export ownership graph to Cytoscape JSON")
    p_exp.add_argument("--output", "-o", default="ownership_graph.json", help="Output file path")
    p_exp.add_argument("--fixtures", "-f", help="Path to fixtures folder")
    p_exp.set_defaults(func=cmd_export_graph)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
