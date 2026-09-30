import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["name","role","bio","photo_url","instagram","sort","status","is_placeholder"];

export const { GET, POST } = makeCollection({
  table: "team_members",
  key: "members",
  map: (b) => pickFields(b, FIELDS),
});
