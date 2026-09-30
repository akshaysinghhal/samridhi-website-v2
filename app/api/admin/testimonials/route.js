import { makeCollection, pickFields } from "../_lib/crud";

const FIELDS = ["quote","author_name","company","photo_url","event_id","permission_granted","sort","status"];

export const { GET, POST } = makeCollection({
  table: "testimonials",
  key: "testimonials",
  map: (b) => pickFields(b, FIELDS),
});
