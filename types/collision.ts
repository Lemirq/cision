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
  collisions: CollisionRecord[];
  severity_score: number;
  total_count: number;
  fatal_count: number;
  cyclist_count: number;
  pedestrian_count: number;
  address: string;
  intersection: string;
}
