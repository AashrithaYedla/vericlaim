/** Civic complaint categories (AI + routing) */
export const CATEGORIES = [
  "garbage",
  "water_leakage",
  "drainage",
  "road_damage",
  "electricity",
  "street_light",
  "pollution",
  "other",
];

/** Maps predicted category to department name */
export const CATEGORY_TO_DEPARTMENT = {
  garbage: "Sanitation Department",
  water_leakage: "Water Department",
  drainage: "Water Department",
  road_damage: "Roads Department",
  electricity: "Electricity Department",
  street_light: "Electricity Department",
  pollution: "Pollution Control",
  other: "General Administration",
};
