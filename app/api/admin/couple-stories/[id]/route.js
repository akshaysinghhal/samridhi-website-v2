import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["title","label","couple_names","thumbnail_url","video_source","video_ref","event_id","consent_granted","featured_on_home","sort","status","publish_at","is_placeholder"];

export const { PUT, DELETE } = makeItem({
  table: "couple_stories",
  map: (b) => pickFields(b, FIELDS),
});
