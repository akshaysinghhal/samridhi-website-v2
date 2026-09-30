import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["name","logo_url","sector","permission_to_display","is_placeholder","sort"];

export const { PUT, DELETE } = makeItem({
  table: "clients",
  map: (b) => pickFields(b, FIELDS),
});
