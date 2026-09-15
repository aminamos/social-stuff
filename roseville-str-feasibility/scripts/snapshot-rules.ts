import { writeFileSync } from "node:fs";
import {
  FEES,
  SEASONS,
  SPACING_FEET,
  NOTICE_RADIUS_FEET,
  MAX_UNRELATED_ADULTS,
  STR_MAX_NIGHTS,
  LOCAL_AGENT_COUNTIES,
  STR_ELIGIBLE_TYPES,
} from "../src/rules";

writeFileSync(
  process.argv[2] ?? "rules-snapshot.json",
  JSON.stringify(
    {
      FEES,
      SEASONS,
      SPACING_FEET,
      NOTICE_RADIUS_FEET,
      MAX_UNRELATED_ADULTS,
      STR_MAX_NIGHTS,
      LOCAL_AGENT_COUNTIES,
      STR_ELIGIBLE_TYPES,
      generatedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log("wrote", process.argv[2] ?? "rules-snapshot.json");
