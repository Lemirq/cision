// DEMO MODE: Hard-coded response, no external API calls
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get("input");

  if (!input || input.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required parameter: input" },
      { status: 400 }
    );
  }

  const predictions = [
    {
      placeId: "demo_place_king_bay",
      description: "King St W & Bay St, Toronto, ON, Canada",
      mainText: "King St W & Bay St",
      secondaryText: "Toronto, ON, Canada",
      types: ["geocode"],
    },
    {
      placeId: "demo_place_queen_spadina",
      description: "Queen St W & Spadina Ave, Toronto, ON, Canada",
      mainText: "Queen St W & Spadina Ave",
      secondaryText: "Toronto, ON, Canada",
      types: ["geocode"],
    },
    {
      placeId: "demo_place_bloor_yonge",
      description: "Bloor St & Yonge St, Toronto, ON, Canada",
      mainText: "Bloor St & Yonge St",
      secondaryText: "Toronto, ON, Canada",
      types: ["geocode"],
    },
    {
      placeId: "demo_place_dundas_university",
      description: "Dundas St W & University Ave, Toronto, ON, Canada",
      mainText: "Dundas St W & University Ave",
      secondaryText: "Toronto, ON, Canada",
      types: ["geocode"],
    },
  ];

  return NextResponse.json(
    { predictions },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
