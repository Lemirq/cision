"use client";

import { Map } from "lucide-react";

export function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-4">
      <div className="mb-4 p-2 bg-blue-600 rounded-lg">
        <Map className="h-6 w-6 text-white" />
      </div>
    </aside>
  );
}
