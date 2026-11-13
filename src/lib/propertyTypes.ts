// One list for the listing form, the filters and the labels. Must match the property_type enum in the database.
// Kept free of server imports so client components can use it.
export const PROPERTY_TYPES = [
  ["self_contain", "Self-contain"], ["mini_flat", "Mini flat"], ["apartment", "Apartment / flat"], ["bungalow", "Bungalow"],
  ["terrace", "Terrace house"], ["semi_detached", "Semi-detached house"], ["house", "Detached house"], ["duplex", "Duplex"],
  ["penthouse", "Penthouse"], ["land", "Land"],
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number][0];
export const isPropertyType = (v: string): v is PropertyType => PROPERTY_TYPES.some(([k]) => k === v);
export const typeLabel = (v: string) => PROPERTY_TYPES.find(([k]) => k === v)?.[1] ?? v;
export const BEDROOM_OPTIONS = ["1", "2", "3", "4", "5"] as const; // "5" means 5 or more
