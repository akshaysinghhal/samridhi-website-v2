import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["from_path","to_path","code"];

export const { GET, POST } = makeCollection({
  table: "redirects",
  key: "redirects", orderBy: [["created_at","desc"]],
  map: (b) => pickFields(b, FIELDS),
});
