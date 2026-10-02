import { makeItem, pickFields } from "../../_lib/crud";

const FIELDS = ["image_url","type","publication","city","published_on","headline","event_id","sort","status","is_placeholder","pinned_to_home"];

export const { PUT, DELETE } = makeItem({
  table: "press_clippings",
  map: (b) => pickFields(b, FIELDS),
});
