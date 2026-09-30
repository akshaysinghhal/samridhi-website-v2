import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["image_url","type","publication","city","published_on","headline","event_id","sort","status","is_placeholder"];

export const { GET, POST } = makeCollection({
  table: "press_clippings",
  key: "clippings",
  map: (b) => pickFields(b, FIELDS),
});
