/**
 * Structured document intake: merges extracted W-2/1099/etc. field values into
 * a TaxInput. Deterministic box->field mapping — the LLM extraction step (if
 * any) produces these typed documents upstream; the merge itself never
 * computes tax.
 */

import type { TaxInput } from "./types.js";

export interface IntakeDocument {
  /** e.g. "w2", "1099-int", "1099-div", "1099-r", "ssa-1099", "1099-g", "1099-nec", "1099-b", "1098-e", "1098-t", "w-2g", "1099-misc" */
  type: string;
  /** Raw box/field values keyed by the doc's native box numbers or names. */
  fields: Record<string, number | string | undefined>;
  /** Optional issuer name for provenance. */
  issuer?: string;
}

export interface IntakeResult {
  input: Partial<TaxInput>;
  applied: { document: string; issuer?: string; mapped: Record<string, number> }[];
  unmapped: { document: string; issuer?: string; fields: string[] }[];
}

const num = (v: number | string | undefined): number => {
  const n = typeof v === "string" ? parseFloat(v.replace(/[$,]/g, "")) : v;
  return Number.isFinite(n as number) ? (n as number) : 0;
};

const add = (acc: Record<string, number>, key: string, v: number): void => {
  acc[key] = (acc[key] ?? 0) + v;
};

/** Merge a batch of documents into a partial TaxInput. */
export function mergeDocuments(docs: IntakeDocument[]): IntakeResult {
  const acc: Record<string, number> = {};
  const capital = { shortTermNet: 0, longTermNet: 0 };
  const applied: IntakeResult["applied"] = [];
  const unmapped: IntakeResult["unmapped"] = [];
  const aocStudents: { qualifiedExpenses: number }[] = [];
  let llcExpenses = 0;

  for (const doc of docs) {
    const f = doc.fields;
    const mapped: Record<string, number> = {};
    const leftover = new Set(Object.keys(f));
    const use = (outKey: string, ...boxKeys: string[]) => {
      let v = 0;
      for (const k of boxKeys) {
        v += num(f[k]);
        leftover.delete(k);
      }
      if (v) {
        add(acc, outKey, v);
        mapped[outKey] = v;
      }
      return v;
    };

    switch (doc.type.toLowerCase().replace(/\s+/g, "")) {
      case "w2":
      case "w-2": {
        use("wages", "1", "box1", "wages");
        use("federalWithholding", "2", "box2", "federalIncomeTaxWithheld");
        use("socialSecurityWages", "3", "box3", "ssWages");
        use("medicareWages", "5", "box5", "medicareWages");
        break;
      }
      case "1099-int": {
        use("taxableInterest", "1", "box1", "interestIncome");
        use("taxExemptInterest", "8", "box8", "taxExemptInterest");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "1099-div": {
        use("ordinaryDividends", "1a", "box1a", "ordinaryDividends");
        use("qualifiedDividends", "1b", "box1b", "qualifiedDividends");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        if (num(f["2a"] ?? f["capGainDistributions"])) {
          capital.longTermNet += num(f["2a"] ?? f["capGainDistributions"]);
          leftover.delete("2a");
          leftover.delete("capGainDistributions");
          mapped["capital.longTermNet"] = capital.longTermNet;
        }
        break;
      }
      case "1099-r": {
        // Distribution code in box 7 disambiguates IRA vs pension; caller
        // passes "ira" or "pension" via the `taxableAs` hint.
        const as = String(f["taxableAs"] ?? "").toLowerCase();
        const target = as === "ira" ? "iraDistributions" : "pensions";
        const amt = num(f["2a"] ?? f["taxableAmount"] ?? f["1"] ?? f["grossDistribution"]);
        if (amt) {
          add(acc, target, amt);
          mapped[target] = amt;
        }
        for (const k of ["1", "2a", "grossDistribution", "taxableAmount", "taxableAs"]) leftover.delete(k);
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "ssa-1099":
      case "ssa1099": {
        use("socialSecurityBenefits", "5", "box5", "netBenefits", "benefitsPaid");
        use("federalWithholding", "6", "box6", "federalIncomeTaxWithheld");
        break;
      }
      case "1099-g": {
        use("unemploymentCompensation", "1", "box1", "unemploymentCompensation");
        use("taxableStateRefunds", "2", "box2", "stateTaxRefund");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "1099-nec": {
        use("businessIncome", "1", "box1", "nonemployeeCompensation");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "1099-misc": {
        use("otherIncome", "3", "box3", "otherIncome");
        use("rentalRoyaltyPartnership", "1", "box1", "rents");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "1099-b": {
        const st = num(f["shortTermGain"] ?? f["stGain"]);
        const lt = num(f["longTermGain"] ?? f["ltGain"]);
        if (st) { capital.shortTermNet += st; mapped["capital.shortTermNet"] = st; }
        if (lt) { capital.longTermNet += lt; mapped["capital.longTermNet"] = lt; }
        for (const k of ["shortTermGain", "stGain", "longTermGain", "ltGain"]) leftover.delete(k);
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "1098-e": {
        use("studentLoanInterestPaid", "1", "box1", "studentLoanInterest");
        break;
      }
      case "1098-t": {
        const amt = num(f["1"] ?? f["qualifiedExpenses"] ?? f["paymentsReceived"]);
        if (amt) aocStudents.push({ qualifiedExpenses: amt });
        for (const k of ["1", "qualifiedExpenses", "paymentsReceived"]) leftover.delete(k);
        break;
      }
      case "1098": {
        use("itemized.homeMortgageInterest", "1", "box1", "mortgageInterest");
        break;
      }
      case "w-2g":
      case "w2g": {
        use("otherIncome", "1", "box1", "grossWinnings");
        use("gamblingWinnings", "1", "box1", "grossWinnings");
        use("federalWithholding", "4", "box4", "federalIncomeTaxWithheld");
        break;
      }
      case "llc-expenses": {
        llcExpenses += num(f["amount"] ?? f["expenses"]);
        leftover.delete("amount");
        leftover.delete("expenses");
        break;
      }
      default:
        break;
    }

    applied.push({ document: doc.type, issuer: doc.issuer, mapped });
    const rest = [...leftover].filter((k) => f[k] !== undefined && num(f[k]) !== 0);
    if (rest.length) unmapped.push({ document: doc.type, issuer: doc.issuer, fields: rest });
  }

  const input: Partial<TaxInput> = {};
  for (const [k, v] of Object.entries(acc)) {
    if (k === "itemized.homeMortgageInterest") {
      input.itemized = { ...(input.itemized ?? {}), homeMortgageInterest: v };
    } else {
      (input as Record<string, unknown>)[k] = v;
    }
  }
  if (capital.shortTermNet || capital.longTermNet) {
    input.capital = {
      shortTermNet: capital.shortTermNet || undefined,
      longTermNet: capital.longTermNet || undefined,
    };
  }
  if (aocStudents.length || llcExpenses) {
    input.education = { aocStudents: aocStudents.length ? aocStudents : undefined, llcExpenses: llcExpenses || undefined };
  }
  return { input, applied, unmapped };
}
