import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["slug","title","client","location","event_date","category","services","description","cover_image","gallery","video_url","featured","sort","status","is_placeholder","seo"];

export const { PUT, DELETE } = makeItem({
  table: "events",
  map: (b) => pickFields(b, FIELDS),
});
