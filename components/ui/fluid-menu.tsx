"use client";

import React, {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from "react";

interface MenuItemProps {
  icon: React.ReactNode;
  onClick?: () => void;
}

export function MenuItem({ icon, onClick }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center h-12 w-12 rounded-none bg-zinc-900 border border-zinc-800 shadow-sm text-zinc-200 hover:bg-zinc-800 transition-colors"
    >
      {icon}
    </button>
  );
}

interface MenuContainerProps {
  children: React.ReactNode;
}

type MenuContextValue = {
  expanded: boolean;
  toggle: () => void;
};

const MenuContext = createContext<MenuContextValue | null>(null);

export function useMenuContext(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) {
    throw new Error("useMenuContext must be used within MenuContainer");
  }
  return ctx;
}

export function MenuContainer({ children }: MenuContainerProps) {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => Children.toArray(children), [children]);

  if (items.length === 0) {
    return null;
  }

  const toggle = () => setExpanded((e) => !e);

  const radius = 96; // px
  const nonToggleCount = Math.max(items.length - 1, 1);
  const startAngleDeg = -60;
  const endAngleDeg = 20;

  return (
    <MenuContext.Provider value={{ expanded, toggle }}>
      <div data-expanded={expanded} className="relative h-12 w-12">
        {/* Toggle (first item) */}
        {isValidElement(items[0]) &&
          cloneElement(items[0] as React.ReactElement, {
            onClick: toggle,
          })}

        {/* The rest of items positioned on an arc opening to the right */}
        {items.slice(1).map((child, idx) => {
          if (!isValidElement(child)) return null;
          const t = nonToggleCount === 1 ? 0.5 : idx / (nonToggleCount - 1);
          const angleDeg = startAngleDeg + t * (endAngleDeg - startAngleDeg);
          const angle = (angleDeg * Math.PI) / 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return cloneElement(child as React.ReactElement, {
            key: idx,
            style: {
              transform: expanded
                ? `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
                : `translate(-50%, -50%)`,
              transition: "transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
            } as React.CSSProperties,
          });
        })}
      </div>
    </MenuContext.Provider>
  );
}

export function HamburgerToggle() {
  const { expanded } = useMenuContext();
  const base =
    "absolute left-1/2 top-1/2 h-[2px] w-5 -translate-x-1/2 bg-zinc-200 transition-transform duration-300 ease-in-out";
  const top = expanded
    ? " -translate-y-0 rotate-45"
    : " -translate-y-[6px] rotate-0";
  const mid = expanded ? " opacity-0 scale-x-0" : " opacity-100 scale-x-100";
  const bot = expanded
    ? " -translate-y-0 -rotate-45"
    : " translate-y-[6px] rotate-0";

  return (
    <div aria-hidden className="relative h-6 w-6">
      <span className={base + top} />
      <span
        className={
          base +
          " " +
          mid +
          " " +
          "transition-opacity duration-200 ease-in-out"
        }
      />
      <span className={base + bot} />
    </div>
  );
}


