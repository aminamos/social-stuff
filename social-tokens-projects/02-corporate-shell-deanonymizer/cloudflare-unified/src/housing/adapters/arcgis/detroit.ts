import { CityAdapter } from "../../canonical";

/**
 * Detroit, MI - Rental Statuses (ArcGIS).
 * https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/RentalStatuses/FeatureServer/0
 *
 * Field list and a paged query verified live against the layer: the only
 * columns are record_id, date_status, parcel_id, lon, lat, ObjectId,
 * street_num, street_dir, street_name, address_id. Thin record with honest
 * gaps: no owner identity, no unit count, no status or severity field (status
 * falls back to Active), and no single address column, so the address is
 * composed from the street parts. Endpoint carries the /query suffix per the
 * platform client, as in minneapolis.ts.
 */
export const detroit: CityAdapter = {
  feed: {
    id: "mi-detroit-rental-registrations",
    label: "Detroit Rental Registrations (Wayne County)",
  },
  defaults: {
    jurisdictionId: "detroit-mi",
    city: "Detroit",
    county: "Wayne",
    state: "MI",
  },
  source: {
    platform: "arcgis",
    endpoint:
      "https://services2.arcgis.com/qvkbeam7Wirps6zC/arcgis/rest/services/RentalStatuses/FeatureServer/0/query",
    dataset: "RentalStatuses",
    pageSize: 1000,
    where: "1=1",
    orderBy: "ObjectId",
  },
  fieldMap: {
    apn: "parcel_id",
  },
  severityMap: {},
  linker: "email_or_owner_address",
  computeAddress: (row) => {
    const parts = [row.street_num, row.street_dir, row.street_name]
      .map((p) => String(p ?? "").trim())
      .filter((p) => p.length > 0);
    return parts.join(" ");
  },
  note: "Thin record: parcel id plus a composed street address only. No owner identity, unit counts, or status published, so there is nothing to link on yet; county tax roll would add taxpayer names.",
};
