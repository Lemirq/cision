import { CityMap } from "@/components/map/city-map";
import { PersonaSidebar } from "@/components/sidebar/persona-sidebar";
import { IntersectionSidebar } from "@/components/sidebar/intersection-sidebar";
import { DEMO_HOTSPOTS } from "@/data/demo-intersections";

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <PersonaSidebar />
      <div className="pl-[20rem] h-full">
        <CityMap hotspots={DEMO_HOTSPOTS} />
      </div>
      <IntersectionSidebar />
    </main>
  );
}
