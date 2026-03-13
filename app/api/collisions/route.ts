// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";

const demoGeoJSON = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.40381, 43.66666] as [number, number] },
      properties: { id: "GO-20258000138", objectId: "723221", eventId: "GO-20258000138", date: "1/1/2025 5:00:00 AM", month: "January", dayOfWeek: "Wednesday", year: "2025", hour: "0", division: "D14", fatalities: 0, injuryCollisions: false, ftrCollisions: true, pdCollisions: false, neighbourhood: "Annex (95)", hood: "095", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1, lat: 43.66666, lng: -79.40381 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.38385, 43.65535] as [number, number] },
      properties: { id: "GO-20258001001", objectId: "723500", eventId: "GO-20258001001", date: "2/10/2025 5:00:00 AM", month: "February", dayOfWeek: "Monday", year: "2025", hour: "8", division: "D51", fatalities: 1, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Bay-Cloverhill (164)", hood: "164", automobile: true, motorcycle: false, passenger: true, bicycle: false, pedestrian: true, weight: 3, lat: 43.65535, lng: -79.38385 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.38014, 43.64318] as [number, number] },
      properties: { id: "GO-20258002001", objectId: "724000", eventId: "GO-20258002001", date: "3/5/2025 5:00:00 AM", month: "March", dayOfWeek: "Wednesday", year: "2025", hour: "17", division: "D14", fatalities: 0, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Harbourfront-CityPlace (169)", hood: "169", automobile: true, motorcycle: false, passenger: false, bicycle: true, pedestrian: false, weight: 2, lat: 43.64318, lng: -79.38014 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.38656, 43.67183] as [number, number] },
      properties: { id: "GO-20258003001", objectId: "724500", eventId: "GO-20258003001", date: "1/20/2025 5:00:00 AM", month: "January", dayOfWeek: "Monday", year: "2025", hour: "12", division: "D53", fatalities: 0, injuryCollisions: false, ftrCollisions: false, pdCollisions: true, neighbourhood: "Yorkville-Midtown (100)", hood: "100", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1, lat: 43.67183, lng: -79.38656 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.36084, 43.65457] as [number, number] },
      properties: { id: "GO-20258004001", objectId: "725000", eventId: "GO-20258004001", date: "4/15/2025 5:00:00 AM", month: "April", dayOfWeek: "Tuesday", year: "2025", hour: "18", division: "D51", fatalities: 0, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Regent Park (72)", hood: "072", automobile: true, motorcycle: false, passenger: false, bicycle: true, pedestrian: true, weight: 2, lat: 43.65457, lng: -79.36084 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.39461, 43.66109] as [number, number] },
      properties: { id: "GO-20258005001", objectId: "725500", eventId: "GO-20258005001", date: "5/1/2025 5:00:00 AM", month: "May", dayOfWeek: "Thursday", year: "2025", hour: "9", division: "D52", fatalities: 0, injuryCollisions: false, ftrCollisions: true, pdCollisions: false, neighbourhood: "Kensington-Chinatown (78)", hood: "078", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1, lat: 43.66109, lng: -79.39461 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.39566, 43.64870] as [number, number] },
      properties: { id: "GO-20258006001", objectId: "726000", eventId: "GO-20258006001", date: "3/22/2025 5:00:00 AM", month: "March", dayOfWeek: "Saturday", year: "2025", hour: "22", division: "D14", fatalities: 1, injuryCollisions: true, ftrCollisions: false, pdCollisions: false, neighbourhood: "Niagara (82)", hood: "082", automobile: true, motorcycle: false, passenger: true, bicycle: false, pedestrian: true, weight: 3, lat: 43.64870, lng: -79.39566 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [-79.41464, 43.67720] as [number, number] },
      properties: { id: "GO-20258007001", objectId: "726500", eventId: "GO-20258007001", date: "2/28/2025 5:00:00 AM", month: "February", dayOfWeek: "Friday", year: "2025", hour: "15", division: "D13", fatalities: 0, injuryCollisions: false, ftrCollisions: false, pdCollisions: true, neighbourhood: "Wychwood (94)", hood: "094", automobile: true, motorcycle: false, passenger: false, bicycle: false, pedestrian: false, weight: 1, lat: 43.67720, lng: -79.41464 },
    },
  ],
};

export async function GET(_request: NextRequest) {
  return NextResponse.json(demoGeoJSON, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "application/json",
      Vary: "Accept-Encoding",
    },
  });
}
