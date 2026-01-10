import { CityMap } from "@/components/map/city-map";
import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { PersonaSidebar } from "@/components/sidebar/persona-sidebar";
import { IntersectionSidebar } from "@/components/sidebar/intersection-sidebar";
import { SearchBar } from "@/components/search/search-bar";
import { DEMO_HOTSPOTS } from "@/data/demo-intersections";

export default function App() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-zinc-950">
      <LeftSidebar />
      <PersonaSidebar />
      <div className="pl-[20rem] h-full relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <SearchBar hotspots={DEMO_HOTSPOTS} />
        </div>
        <CityMap hotspots={DEMO_HOTSPOTS} />
      </div>
      <IntersectionSidebar />
    </main>
  );
}
