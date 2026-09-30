import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["label","href","parent_id","sort","visible","location"];

export const { PUT, DELETE } = makeItem({
  table: "nav_items",
  map: (b) => pickFields(b, FIELDS),
});
