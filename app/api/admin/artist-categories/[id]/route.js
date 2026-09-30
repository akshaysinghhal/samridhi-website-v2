import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["slug","name","sort"];

export const { PUT, DELETE } = makeItem({
  table: "artist_categories",
  map: (b) => pickFields(b, FIELDS),
});
