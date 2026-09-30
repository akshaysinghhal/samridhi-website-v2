import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["name","role","bio","photo_url","instagram","sort","status","is_placeholder"];

export const { PUT, DELETE } = makeItem({
  table: "team_members",
  map: (b) => pickFields(b, FIELDS),
});
