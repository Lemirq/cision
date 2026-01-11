export interface CollisionRecord {
  id: string;
  date: string;
  time: string;
  latitude: number;
  longitude: number;
  street1: string;
  street2: string;
  injury_type: "Fatal" | "Major" | "Minor" | "None";
  involved_class: "Cyclist" | "Pedestrian" | "Driver" | "Passenger";
  visibility: string;
  road_condition: string;
  traffic_control: string;
}

export interface ClusteredHotspot {
  id: string;
  centroid: { lat: number; lng: number };
  collisions: CollisionPoint[]; // Changed from CollisionRecord[] to CollisionPoint[] to match actual data structure
  severity_score: number;
  total_count: number;
  fatal_count: number;
  cyclist_count: number;
  pedestrian_count: number;
  address: string;
  intersection: string;
}

export interface CollisionPoint {
  id: string;
  objectId: string;
  eventId: string;
  lat: number;
  lng: number;
  date: string;
  month: string;
  dayOfWeek: string;
  year: string;
  hour: string;
  division: string;
  fatalities: number;
  injuryCollisions: boolean;
  ftrCollisions: boolean;
  pdCollisions: boolean;
  neighbourhood: string;
  hood: string;
  automobile: boolean;
  motorcycle: boolean;
  passenger: boolean;
  bicycle: boolean;
  pedestrian: boolean;
  weight: number;
}

export interface PlaceInfo {
  address: string;
  streetNumber: string;
  streetName: string;
  neighborhood: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  placeId: string;
  location: { lat: number; lng: number };
  types: string[];
  formattedAddress: string;
}
