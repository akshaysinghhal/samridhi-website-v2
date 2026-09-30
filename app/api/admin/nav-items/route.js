import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["label","href","parent_id","sort","visible","location"];

export const { GET, POST } = makeCollection({
  table: "nav_items",
  key: "items", orderBy: [["location","asc"],["sort","asc"]],
  map: (b) => pickFields(b, FIELDS),
});
