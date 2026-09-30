import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["name","logo_url","sector","permission_to_display","is_placeholder","sort"];

export const { GET, POST } = makeCollection({
  table: "clients",
  key: "clients",
  map: (b) => pickFields(b, FIELDS),
});
