// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";
import type { ClusteredHotspot } from "@/types/collision";

const demoClusters: ClusteredHotspot[] = [
  {
    id: "cluster-0",
    centroid: { lat: 43.66666, lng: -79.40381 },
    collisions: [
      { id: "GO-20258000138", objectId: "723221", eventId: "GO-20258000138", lat: 43.66666, lng: -79.40381, date: "1/1/2025 5:00:00 AM", month: "January", dayOfWeek: "Wednesday", year: "2025", hour: "0", division: "D14", fatalities: 0, injuryCollisions: false, ftrCollisions: true, pdCollisions: false, neighbourhood: "Annex (95)", hood: "095", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1 },
    ],
    severity_score: 3.2,
    total_count: 12,
    fatal_count: 0,
    cyclist_count: 2,
    pedestrian_count: 1,
    address: "Bloor St W & Spadina Ave",
    intersection: "Bloor St W & Spadina Ave",
  },
  {
    id: "cluster-1",
    centroid: { lat: 43.65535, lng: -79.38385 },
    collisions: [
      { id: "GO-20258001001", objectId: "723500", eventId: "GO-20258001001", lat: 43.65535, lng: -79.38385, date: "2/10/2025 5:00:00 AM", month: "February", dayOfWeek: "Monday", year: "2025", hour: "8", division: "D51", fatalities: 1, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Bay-Cloverhill (164)", hood: "164", automobile: true, motorcycle: false, passenger: true, bicycle: false, pedestrian: true, weight: 3 },
    ],
    severity_score: 8.5,
    total_count: 25,
    fatal_count: 2,
    cyclist_count: 3,
    pedestrian_count: 5,
    address: "Queen St W & University Ave",
    intersection: "Queen St W & University Ave",
  },
  {
    id: "cluster-2",
    centroid: { lat: 43.64318, lng: -79.38014 },
    collisions: [
      { id: "GO-20258002001", objectId: "724000", eventId: "GO-20258002001", lat: 43.64318, lng: -79.38014, date: "3/5/2025 5:00:00 AM", month: "March", dayOfWeek: "Wednesday", year: "2025", hour: "17", division: "D14", fatalities: 0, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Harbourfront-CityPlace (169)", hood: "169", automobile: true, motorcycle: false, passenger: false, bicycle: true, pedestrian: false, weight: 2 },
    ],
    severity_score: 5.1,
    total_count: 18,
    fatal_count: 0,
    cyclist_count: 6,
    pedestrian_count: 3,
    address: "Lake Shore Blvd W & Spadina Ave",
    intersection: "Lake Shore Blvd W & Spadina Ave",
  },
  {
    id: "cluster-3",
    centroid: { lat: 43.67183, lng: -79.38656 },
    collisions: [
      { id: "GO-20258003001", objectId: "724500", eventId: "GO-20258003001", lat: 43.67183, lng: -79.38656, date: "1/20/2025 5:00:00 AM", month: "January", dayOfWeek: "Monday", year: "2025", hour: "12", division: "D53", fatalities: 0, injuryCollisions: false, ftrCollisions: false, pdCollisions: true, neighbourhood: "Yorkville-Midtown (100)", hood: "100", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1 },
    ],
    severity_score: 2.8,
    total_count: 9,
    fatal_count: 0,
    cyclist_count: 1,
    pedestrian_count: 2,
    address: "Yonge St & Bloor St",
    intersection: "Yonge St & Bloor St",
  },
  {
    id: "cluster-4",
    centroid: { lat: 43.65457, lng: -79.36084 },
    collisions: [
      { id: "GO-20258004001", objectId: "725000", eventId: "GO-20258004001", lat: 43.65457, lng: -79.36084, date: "4/15/2025 5:00:00 AM", month: "April", dayOfWeek: "Tuesday", year: "2025", hour: "18", division: "D51", fatalities: 0, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Regent Park (72)", hood: "072", automobile: true, motorcycle: false, passenger: false, bicycle: true, pedestrian: true, weight: 2 },
    ],
    severity_score: 6.3,
    total_count: 20,
    fatal_count: 1,
    cyclist_count: 4,
    pedestrian_count: 6,
    address: "Dundas St E & Parliament St",
    intersection: "Dundas St E & Parliament St",
  },
  {
    id: "cluster-5",
    centroid: { lat: 43.66109, lng: -79.39461 },
    collisions: [
      { id: "GO-20258005001", objectId: "725500", eventId: "GO-20258005001", lat: 43.66109, lng: -79.39461, date: "5/1/2025 5:00:00 AM", month: "May", dayOfWeek: "Thursday", year: "2025", hour: "9", division: "D52", fatalities: 0, injuryCollisions: false, ftrCollisions: true, pdCollisions: false, neighbourhood: "Kensington-Chinatown (78)", hood: "078", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1 },
    ],
    severity_score: 4.0,
    total_count: 14,
    fatal_count: 0,
    cyclist_count: 3,
    pedestrian_count: 2,
    address: "College St & Spadina Ave",
    intersection: "College St & Spadina Ave",
  },
  {
    id: "cluster-6",
    centroid: { lat: 43.64870, lng: -79.39566 },
    collisions: [
      { id: "GO-20258006001", objectId: "726000", eventId: "GO-20258006001", lat: 43.64870, lng: -79.39566, date: "3/22/2025 5:00:00 AM", month: "March", dayOfWeek: "Saturday", year: "2025", hour: "22", division: "D14", fatalities: 1, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Niagara (82)", hood: "082", automobile: true, motorcycle: false, passenger: true, bicycle: false, pedestrian: true, weight: 3 },
    ],
    severity_score: 7.9,
    total_count: 22,
    fatal_count: 2,
    cyclist_count: 1,
    pedestrian_count: 7,
    address: "King St W & Bathurst St",
    intersection: "King St W & Bathurst St",
  },
  {
    id: "cluster-7",
    centroid: { lat: 43.67720, lng: -79.41464 },
    collisions: [
      { id: "GO-20258007001", objectId: "726500", eventId: "GO-20258007001", lat: 43.67720, lng: -79.41464, date: "2/28/2025 5:00:00 AM", month: "February", dayOfWeek: "Friday", year: "2025", hour: "15", division: "D13", fatalities: 0, injuryCollisions: false, ftrCollisions: false, pdCollisions: true, neighbourhood: "Wychwood (94)", hood: "094", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1 },
    ],
    severity_score: 1.5,
    total_count: 7,
    fatal_count: 0,
    cyclist_count: 0,
    pedestrian_count: 1,
    address: "Bathurst St & Dupont St",
    intersection: "Bathurst St & Dupont St",
  },
];

export async function GET(_request: NextRequest) {
  return NextResponse.json(demoClusters, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "application/json",
    },
  });
}
