import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["title","country","city","show_date","summary","cover_image","gallery","video_url","sort","status","is_placeholder"];

export const { PUT, DELETE } = makeItem({
  table: "international_shows",
  map: (b) => pickFields(b, FIELDS),
});
