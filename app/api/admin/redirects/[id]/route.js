import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["from_path","to_path","code"];

export const { PUT, DELETE } = makeItem({
  table: "redirects",
  map: (b) => pickFields(b, FIELDS),
});
