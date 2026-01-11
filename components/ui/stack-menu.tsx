"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface MenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
  showChevron?: boolean;
}

export function Menu({
  trigger,
  children,
  align = "left",
  showChevron = true,
}: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer inline-flex items-center"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
        {showChevron && (
          <ChevronDown className="ml-2 -mr-1 h-4 w-4 text-zinc-500" aria-hidden="true" />
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-2 w-56 rounded-md bg-zinc-900 shadow-lg ring-1 ring-zinc-800 focus:outline-none z-50`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

interface MenuItemProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export function MenuItem({
  children,
  onClick,
  disabled = false,
  icon,
  isActive = false,
}: MenuItemProps) {
  return (
    <button
      className={`relative block w-full h-16 text-center group rounded-none
        ${disabled ? "text-zinc-500 cursor-not-allowed" : "text-zinc-200"}
        ${isActive ? "bg-white/10" : ""}
      `}
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
    >
      <span className="flex items-center justify-center h-full mt-[5%]">
        {icon && (
          <span className="h-6 w-6 transition-all duration-200 group-hover:[&_svg]:stroke-[2.5]">
            {icon}
          </span>
        )}
        {children}
      </span>
    </button>
  );
}

export function MenuContainer({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const childrenArray = React.Children.toArray(children);
  const itemSpacing = 80; // px distance between items when expanded

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className="relative w-[64px]" data-expanded={isExpanded}>
      <div className="relative">
        <div
          className="relative w-16 h-16 bg-zinc-900 hover:bg-zinc-800 transition-colors cursor-pointer rounded-none border border-zinc-800 group will-change-transform z-50"
          onClick={handleToggle}
        >
          {childrenArray[0]}
        </div>

        {childrenArray.slice(1).map((child, index) => (
          <div
            key={index}
            className="absolute top-0 left-0 w-16 h-16 bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-none border border-zinc-800 will-change-transform"
            style={{
              transform: `translateY(${isExpanded ? (index + 1) * itemSpacing : 0}px)`,
              opacity: isExpanded ? 1 : 0,
              zIndex: 40 - index,
              // Ensure square shape with no circular mask
              clipPath: "inset(0%)",
              transition: `transform ${
                isExpanded ? "300ms" : "300ms"
              } cubic-bezier(0.4, 0, 0.2, 1),
                         opacity ${isExpanded ? "300ms" : "350ms"}`,
              backfaceVisibility: "hidden",
              perspective: 1000,
              WebkitFontSmoothing: "antialiased",
            } as React.CSSProperties}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}


