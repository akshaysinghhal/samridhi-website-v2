import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["slug","name","sort"];

export const { GET, POST } = makeCollection({
  table: "artist_categories",
  key: "categories",
  map: (b) => pickFields(b, FIELDS),
});
