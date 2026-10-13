"use client";

import { CalendarDays, House, Menu, Plus, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Right to left: the first tab sits under the right thumb.
const LEADING: Tab[] = [
  { href: "/", label: "اليوم", icon: House },
  { href: "/customers", label: "الزبائن", icon: Users },
];

const TRAILING: Tab[] = [
  { href: "/history", label: "السجل", icon: CalendarDays },
  { href: "/more", label: "المزيد", icon: Menu },
];

// Screens that are a task with their own save bar: the tabs step aside.
const isFocusScreen = (pathname: string) =>
  pathname.startsWith("/movements/new") ||
  pathname.startsWith("/counts") ||
  pathname.startsWith("/prices") ||
  pathname.endsWith("/new") ||
  pathname.endsWith("/edit");

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

export const BottomNav = () => {
  const pathname = usePathname();
  if (isFocusScreen(pathname)) {
    return null;
  }

  const renderTab = ({ href, label, icon: Icon }: Tab) => {
    const active = isActive(pathname, href) || (href === "/more" && pathname.startsWith("/rules"));
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold transition-colors ${
          active ? "text-primary" : "text-faint active:text-muted"
        }`}
      >
        <span
          className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
            active ? "bg-primary-tint" : ""
          }`}
        >
          <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        </span>
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Keeps the last row of a page clear of the bar. */}
      <div aria-hidden="true" className="h-28" />
      <nav
        aria-label="التنقل"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/92 backdrop-blur-md"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {LEADING.map(renderTab)}
          <div className="flex items-start justify-center">
            <Link
              href="/movements/new"
              aria-label="حركة جديدة"
              className="-mt-5 flex h-15 w-15 items-center justify-center rounded-full bg-primary text-white shadow-float ring-4 ring-page transition active:scale-95"
            >
              <Plus size={30} strokeWidth={2.6} />
            </Link>
          </div>
          {TRAILING.map(renderTab)}
        </div>
      </nav>
    </>
  );
};
