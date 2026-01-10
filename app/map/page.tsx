import { CityMap } from "@/components/map/city-map";
import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { PersonaSidebar } from "@/components/sidebar/persona-sidebar";
import { IntersectionSidebar } from "@/components/sidebar/intersection-sidebar";
import { DEMO_HOTSPOTS } from "@/data/demo-intersections";

export default function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <LeftSidebar />
      <PersonaSidebar />
      <div className="pl-96 h-full">
        <CityMap hotspots={DEMO_HOTSPOTS} />
      </div>
      <IntersectionSidebar />
    </main>
  );
}
