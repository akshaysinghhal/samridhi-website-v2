import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["title","country","city","show_date","summary","cover_image","gallery","video_url","sort","status","is_placeholder"];

export const { GET, POST } = makeCollection({
  table: "international_shows",
  key: "shows",
  map: (b) => pickFields(b, FIELDS),
});
