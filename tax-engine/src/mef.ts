/**
 * MeF (Modernized e-File) return XML generation, keyed off engine `lines`.
 *
 * Produces a `Return` document with the standard ReturnHeader + ReturnData
 * structure and one child per IRS form. Element names follow the published
 * MeF schemas (irs.gov e-file providers → XML schemas); the LINE_MAP tables
 * are the single place to reconcile names against a specific year's XSD
 * bundle before ATS submission.
 *
 * This is structure v1: correct hierarchy and core monetary elements.
 * ATS-grade conformance additionally requires ReturnHeader refinements
 * (EFIN/transmitter fields), per-form checkbox elements, and ZIP/address
 * blocks that carry no math — those are meta inputs, not computed values.
 */

import type { TaxInput, TaxResult } from "./types.js";

export interface ReturnMeta {
  primarySsn?: string;
  primaryFirstName?: string;
  primaryLastName?: string;
  spouseSsn?: string;
  spouseFirstName?: string;
  spouseLastName?: string;
  address?: { line1: string; line2?: string; city: string; state: string; zip: string };
  /** OriginatorGrp — required for transmission; EFIN/ETIN come from IRS e-Services. */
  efin?: string;
  etin?: string;
  /** ERO / transmitter legal name + phone. */
  transmitterName?: string;
  phone?: string;
  /** Originator type: ERO, OnlineFiler (direct API self-file), etc. */
  originatorType?: "ERO" | "OnlineFiler" | "LargeTaxpayer" | "FinancialAgent" | "SoftwareDeveloper" | "ReportingAgent" | "Other";
  softwareId?: string;
  softwareVersion?: string;
  submissionId?: string;
  /** Practitioner PIN / self-select PIN signature inputs. */
  primarySignaturePin?: string;
  spouseSignaturePin?: string;
  /** Override tax year (default 2025). */
  taxYear?: number;
}

const FILING_STATUS_CD: Record<string, number> = { single: 1, mfj: 2, mfs: 3, hoh: 4, qss: 5 };

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const el = (name: string, value: number | string | undefined): string =>
  value === undefined ? "" : `    <${name}>${typeof value === "number" ? Math.round(value) : esc(value)}</${name}>\n`;

/** line-key -> MeF element name, per form. */
const MAP: Record<string, Record<string, string>> = {
  IRS1040: {
    "1040.1a": "WagesSalariesAndTipsAmt",
    "1040.2b": "TaxableInterestAmt",
    "1040.3b": "OrdinaryDividendsAmt",
    "1040.3a": "QualifiedDividendsAmt",
    "1040.4b": "TaxableIRAAmt",
    "1040.5b": "TaxablePensionsAmt",
    "1040.6b": "TaxableSocSecAmt",
    "1040.7": "CapitalGainLossAmt",
    "1040.8": "OtherIncomeAmt",
    "1040.9": "TotalIncomeAmt",
    "1040.10": "TotalAdjustmentsAmt",
    "1040.11": "AdjustedGrossIncomeAmt",
    "1040.12": "TotalItemizedOrStandardDedAmt",
    "1040.13a": "QualifiedBusinessIncomeDedAmt",
    "1040.13b": "TotalDeductionsAmt",
    "1040.15": "TaxableIncomeAmt",
    "1040.16": "IncomeTaxAmt",
    "1040.19": "ChildTaxCreditAmt",
    "1040.20": "OtherCreditsAmt",
    "1040.22": "TaxLessCreditsAmt",
    "1040.23": "OtherTaxesAmt",
    "1040.24": "TotalTaxAmt",
    "1040.25d": "WithholdingTaxAmt",
    "1040.26": "EstimatedTaxPaymentsAmt",
    "1040.27": "EarnedIncomeCreditAmt",
    "1040.28": "AdditionalChildTaxCreditAmt",
    "1040.29": "RefundableAmerOpportunityCreditAmt",
    "1040.33": "TotalPaymentsAmt",
    "1040.34": "RefundAmt",
    "1040.37": "AmtYouOweAmt",
    "1040.38": "EstimatedTaxPenaltyAmt",
  },
  IRS1040Schedule1: {
    "sch1.10": "AdditionalIncomeAmt",
    "sch1.19": "IRADeductionAmt",
    "sch1.20": "StudentLoanInterestDedAmt",
    "sch1.26": "TotalAdjustmentsAmt",
  },
  IRS1040Schedule1A: {
    "sched1A.13": "TipsDeductionAmt",
    "sched1A.21": "OvertimeDeductionAmt",
    "sched1A.30": "CarLoanInterestDedAmt",
    "sched1A.37": "SeniorDeductionAmt",
    "sched1A.38": "TotalDeductionsAmt",
  },
  IRS1040Schedule2: {
    "sch2.3": "AlternativeMinimumTaxAmt",
    "sch2.4": "SelfEmploymentTaxAmt",
    "sch2.9": "AdditionalMedicareTaxAmt",
    "sch2.12": "NetInvestmentIncomeTaxAmt",
    "sch2.21": "TotalOtherTaxesAmt",
  },
  IRS1040Schedule3: {
    "sch3.3": "EducationCreditsAmt",
    "sch3.5": "ResidentialEnergyCreditsAmt",
    "sch3.8": "NonrefundableCreditsAmt",
  },
  IRS1040ScheduleA: {
    "schA.17": "TotalItemizedDeductionsAmt",
  },
  IRS1040ScheduleB: {
    "schB.4": "TotalTaxableInterestAmt",
    "schB.6": "TotalOrdinaryDividendsAmt",
  },
  IRS6251: {
    "f6251.4": "AlternativeMinTaxableIncomeAmt",
    "f6251.5": "AlternativeMinTaxExemptionAmt",
    "f6251.7": "TentativeMinimumTaxAmt",
    "sch2.3": "AlternativeMinimumTaxAmt",
  },
  IRS8863: {
    "sch3.3": "EducationCreditsAmt",
    "f8863.8": "RefundableAmerOpportunityCreditAmt",
  },
  IRS8615: {
    "f8615.5": "NetUnearnedIncomeAmt",
  },
  IRS2210: {
    "f2210.19": "EstimatedTaxPenaltyAmt",
  },
  IRSScheduleR: {
    "schR.22": "CreditForElderlyOrDisabledAmt",
  },
  IRS2555: {
    "f2555.42": "ForeignEarnedIncomeExclusionAmt",
    "sch1.8d": "ForeignEarnedIncomeExclusionAmt",
  },
  IRS8839: {
    "f8839.16": "AdoptionCreditAmt",
    "f8839.ref": "RefundableAdoptionCreditAmt",
  },
  IRS8962: {
    "f8962.5": "FederalPovertyLevelPct",
    "f8962.8a": "AnnualContributionAmt",
    "f8962.24": "AnnualPremiumTaxCreditAllowedAmt",
    "f8962.26": "NetPremiumTaxCreditAmt",
    "f8962.29": "ExcessAdvancePaymentOfPtcAmt",
  },
  IRS4952: {
    "f4952.5": "DeductibleInvestmentInterestAmt",
  },
};

const FORM_DOC_NAME: Record<string, string> = {
  IRS1040: "IRS1040",
  IRS1040Schedule1: "IRS1040Schedule1",
  IRS1040Schedule1A: "IRS1040Schedule1A",
  IRS1040Schedule2: "IRS1040Schedule2",
  IRS1040Schedule3: "IRS1040Schedule3",
  IRS1040ScheduleA: "IRS1040ScheduleA",
  IRS1040ScheduleB: "IRS1040ScheduleB",
  IRS6251: "IRS6251",
  IRS8863: "IRS8863",
  IRS8615: "IRS8615",
  IRS2210: "IRS2210",
  IRSScheduleR: "IRSScheduleR",
  IRS2555: "IRS2555",
  IRS8839: "IRS8839",
  IRS8962: "IRS8962",
  IRS4952: "IRS4952",
};

/** Ordered so the 1040 is first and schedules follow in attachment order. */
const FORM_ORDER = [
  "IRS1040", "IRS1040Schedule1", "IRS1040Schedule1A", "IRS1040Schedule2",
  "IRS1040Schedule3", "IRS1040ScheduleA", "IRS1040ScheduleB", "IRSScheduleR",
  "IRS6251", "IRS8863", "IRS8615", "IRS2210", "IRS2555", "IRS8839", "IRS8962", "IRS4952",
];

export function toMefXml(input: TaxInput, result: TaxResult, meta: ReturnMeta = {}): string {
  const yr = meta.taxYear ?? 2025;
  const forms: string[] = [];

  for (const form of FORM_ORDER) {
    const map = MAP[form];
    let body = "";
    if (form === "IRS1040") {
      body += el("IndividualReturnFilingStatusCd", FILING_STATUS_CD[input.filingStatus]);
    }
    let has = form === "IRS1040";
    for (const [key, element] of Object.entries(map)) {
      const v = result.lines[key];
      if (v === undefined || v === 0) continue;
      body += el(element, v);
      has = true;
    }
    if (!has) continue;
    forms.push(
      `  <${form} documentId="${FORM_DOC_NAME[form]}_${forms.length}" documentName="${form}">\n${body}  </${form}>\n`,
    );
  }

  const i4 = "        ";
  const i6 = "      ";
  const i5 = "    ";

  // Filer: primary/spouse identity + USAddress (schema-required for ATS).
  let filer = "";
  if (meta.primarySsn || meta.address) {
    filer = `${i5}<Filer>\n`;
    if (meta.primarySsn) {
      filer += `${i6}<PrimarySSN>${esc(meta.primarySsn)}</PrimarySSN>\n`;
      if (meta.primaryFirstName) {
        filer += `${i6}<PrimaryNameControlTxt>${esc((meta.primaryLastName ?? meta.primaryFirstName).slice(0, 4).toUpperCase())}</PrimaryNameControlTxt>\n`;
        filer += `${i6}<Name>\n${i4}<PersonFirstNm>${esc(meta.primaryFirstName)}</PersonFirstNm>\n`;
        if (meta.primaryLastName) filer += `${i4}<PersonLastNm>${esc(meta.primaryLastName)}</PersonLastNm>\n`;
        filer += `${i6}</Name>\n`;
      }
    }
    if (meta.spouseSsn) {
      filer += `${i6}<SpouseSSN>${esc(meta.spouseSsn)}</SpouseSSN>\n`;
      if (meta.spouseFirstName) {
        filer += `${i6}<SpouseName>\n${i4}<PersonFirstNm>${esc(meta.spouseFirstName)}</PersonFirstNm>\n`;
        if (meta.spouseLastName) filer += `${i4}<PersonLastNm>${esc(meta.spouseLastName)}</PersonLastNm>\n`;
        filer += `${i6}</SpouseName>\n`;
      }
    }
    if (meta.address) {
      const a = meta.address;
      filer += `${i6}<USAddress>\n` +
        `${i4}<AddressLine1Txt>${esc(a.line1)}</AddressLine1Txt>\n` +
        (a.line2 ? `${i4}<AddressLine2Txt>${esc(a.line2)}</AddressLine2Txt>\n` : "") +
        `${i4}<CityNm>${esc(a.city)}</CityNm>\n` +
        `${i4}<StateAbbreviationCd>${esc(a.state)}</StateAbbreviationCd>\n` +
        `${i4}<ZIPCd>${esc(a.zip)}</ZIPCd>\n` +
        `${i6}</USAddress>\n`;
    }
    filer += `${i5}</Filer>\n`;
  }

  // OriginatorGrp: EFIN + ETIN + originator type (required for transmission).
  let originator = "";
  if (meta.efin || meta.etin || meta.transmitterName) {
    originator = `${i5}<OriginatorGrp>\n` +
      (meta.efin ? `${i6}<EFIN>${esc(meta.efin)}</EFIN>\n` : "") +
      (meta.etin ? `${i6}<ETIN>${esc(meta.etin)}</ETIN>\n` : "") +
      `${i6}<OriginatorTypeCd>${meta.originatorType ?? "OnlineFiler"}</OriginatorTypeCd>\n` +
      (meta.transmitterName
        ? `${i6}<TransmitterName>\n${i4}<BusinessNameLine1Txt>${esc(meta.transmitterName)}</BusinessNameLine1Txt>\n${i6}</TransmitterName>\n`
        : "") +
      (meta.phone ? `${i6}<PhoneNum>${esc(meta.phone)}</PhoneNum>\n` : "") +
      `${i5}</OriginatorGrp>\n`;
  }

  const pins =
    (meta.primarySignaturePin || meta.spouseSignaturePin)
      ? `${i5}<SignatureOptionCd>PIN</SignatureOptionCd>\n` +
        (meta.primarySignaturePin ? `${i5}<PrimarySignaturePIN>${esc(meta.primarySignaturePin)}</PrimarySignaturePIN>\n` : "") +
        (meta.spouseSignaturePin ? `${i5}<SpouseSignaturePIN>${esc(meta.spouseSignaturePin)}</SpouseSignaturePIN>\n` : "")
      : "";

  const header =
    `  <ReturnHeader binaryAttachmentCnt="0">\n` +
    `${i5}<ReturnTs>${new Date().toISOString()}</ReturnTs>\n` +
    `${i5}<TaxYr>${yr}</TaxYr>\n` +
    `${i5}<TaxPeriodBeginDt>${yr}-01-01</TaxPeriodBeginDt>\n` +
    `${i5}<TaxPeriodEndDt>${yr}-12-31</TaxPeriodEndDt>\n` +
    `${i5}<SoftwareId>${esc(meta.softwareId ?? "TAXENGINE-LOCAL")}</SoftwareId>\n` +
    `${i5}<SoftwareVersionNum>${esc(meta.softwareVersion ?? "0.1.0")}</SoftwareVersionNum>\n` +
    (meta.submissionId ? `${i5}<SubmissionId>${esc(meta.submissionId)}</SubmissionId>\n` : "") +
    originator + filer + pins +
    `${i5}<FilingStatusCd>${FILING_STATUS_CD[input.filingStatus]}</FilingStatusCd>\n` +
    `  </ReturnHeader>\n`;

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Return xmlns="http://www.irs.gov/efile" returnVersion="${yr}v1.0">\n` +
    header +
    `  <ReturnData documentCnt="${forms.length}">\n` +
    forms.join("") +
    `  </ReturnData>\n` +
    `</Return>\n`
  );
}
