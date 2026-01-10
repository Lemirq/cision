"use client";

import { Map, BarChart3, Settings, HelpCircle } from "lucide-react";

export function LeftSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-4">
      <div className="mb-4 p-2 bg-blue-600 rounded-lg">
        <Map className="h-6 w-6 text-white" />
      </div>
      
      <nav className="flex flex-col gap-2 flex-1">
        <button className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <Map className="h-5 w-5" />
        </button>
        <button className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <BarChart3 className="h-5 w-5" />
        </button>
      </nav>

      <div className="flex flex-col gap-2">
        <button className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <Settings className="h-5 w-5" />
        </button>
        <button className="p-3 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </aside>
  );
}
