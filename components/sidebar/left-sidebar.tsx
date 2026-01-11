"use client";

import {
  Menu as MenuIcon,
  Mic,
  ShieldCheck,
  MessagesSquare,
  History,
  Settings,
} from "lucide-react";
import { MenuItem, MenuContainer } from "@/components/ui/stack-menu";
import Image from "next/image";
import Link from "next/link";

interface LeftSidebarProps {
  onVoiceAgentsClick?: () => void;
  onSafetyAuditClick?: () => void;
  isVoiceAgentsOpen?: boolean;
  isSafetyAuditOpen?: boolean;
}

export function LeftSidebar({
  onVoiceAgentsClick,
  onSafetyAuditClick,
  isVoiceAgentsOpen = false,
  isSafetyAuditOpen = false,
}: LeftSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-16 border-r border-zinc-800 bg-zinc-950 flex flex-col items-center py-4 gap-4">
      <Link
        href="/"
        aria-label="Go to homepage"
        className="mb-4 p-2 rounded-none border border-zinc-800 bg-zinc-900"
      >
        <Image
          src="/Logo.svg"
          alt="Cision logo"
          width={24}
          height={24}
          className="w-6 h-6"
          priority
        />
      </Link>
      <div className="mt-2">
        <div className="relative">
          <div className="absolute inset-0 bg-linear-to-b from-zinc-900/10 to-transparent dark:from-zinc-100/10 blur-3xl -z-10 rounded-none" />
          <MenuContainer>
            <MenuItem icon={<MenuIcon size={24} strokeWidth={1.5} />} />
            <MenuItem
              icon={<Mic size={24} strokeWidth={1.5} />}
              onClick={onVoiceAgentsClick}
              isActive={isVoiceAgentsOpen}
            />
            <MenuItem
              icon={<ShieldCheck size={24} strokeWidth={1.5} />}
              onClick={onSafetyAuditClick}
              isActive={isSafetyAuditOpen}
            />
            <MenuItem icon={<MessagesSquare size={24} strokeWidth={1.5} />} />
            <MenuItem icon={<History size={24} strokeWidth={1.5} />} />
            <MenuItem icon={<Settings size={24} strokeWidth={1.5} />} />
          </MenuContainer>
        </div>
      </div>
    </aside>
  );
}
