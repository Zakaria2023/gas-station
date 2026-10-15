"use client";

import { CalendarDays, ChevronLeft, Menu, PackagePlus, Plus, ShoppingBag, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { ACCOUNT_NAV, ADMIN_NAV, isActive, MAIN_NAV, NavItem, TOOLS_NAV } from "./nav-items";

// Right to left: the first tab sits under the right thumb. The tools live
// behind "المزيد" on a phone; the desktop sidebar lists them directly.
const LEADING = MAIN_NAV.slice(0, 2);
// One "السجل" tab covers both views of the record; the page's own tabs switch between them.
const TRAILING: NavItem[] = [
  { href: "/history", label: "السجل", icon: CalendarDays },
  { href: "/more", label: "المزيد", icon: Menu },
];

// What the + button offers: the day's two jobs first, then any single movement.
const NEW_ACTIONS: { href: string; label: string; hint: string; icon: LucideIcon; chip: string }[] = [
  { href: "/sell", label: "بيع", hint: "شو انباع اليوم", icon: ShoppingBag, chip: "bg-sales-tint text-sales" },
  { href: "/add", label: "إضافة", hint: "مليان وصل للمحل", icon: PackagePlus, chip: "bg-stock-tint text-stock" },
  {
    href: "/movements/new",
    label: "حركة جديدة",
    hint: "دين، دين مصاري، فاضي لزبون، أو بيع واحد",
    icon: Plus,
    chip: "bg-primary-tint text-primary",
  },
];

// Screens that are a task with their own save bar: the tabs step aside.
const isFocusScreen = (pathname: string) =>
  pathname.startsWith("/movements/new") ||
  pathname.startsWith("/sell") ||
  pathname.startsWith("/add") ||
  pathname.startsWith("/counts") ||
  pathname.startsWith("/prices") ||
  pathname.startsWith("/account") ||
  pathname.startsWith("/users/") ||
  pathname.endsWith("/new") ||
  pathname.endsWith("/edit");

/** The phone's tab bar; from `lg` up the sidebar takes its place. */
export const BottomNav = () => {
  const pathname = usePathname();
  const [choosing, setChoosing] = useState(false);
  if (isFocusScreen(pathname)) {
    return null;
  }

  const renderTab = ({ href, label, icon: Icon }: NavItem) => {
    const active =
      isActive(pathname, href) ||
      (href === "/history" && isActive(pathname, "/movements")) ||
      (href === "/more" &&
        [...TOOLS_NAV, ...ADMIN_NAV, ...ACCOUNT_NAV].some((tool) => isActive(pathname, tool.href)));
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
      <div aria-hidden="true" className="h-28 lg:hidden" />
      <nav
        aria-label="التنقل"
        className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/92 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid h-16 max-w-xl grid-cols-5">
          {LEADING.map(renderTab)}
          <div className="flex items-start justify-center">
            <button
              type="button"
              onClick={() => setChoosing(true)}
              aria-label="جديد"
              className="-mt-5 flex h-15 w-15 items-center justify-center rounded-full bg-primary text-white shadow-float ring-4 ring-page transition active:scale-95"
            >
              <Plus size={30} strokeWidth={2.6} />
            </button>
          </div>
          {TRAILING.map(renderTab)}
        </div>
      </nav>
      <BottomSheet open={choosing} onClose={() => setChoosing(false)} title="جديد">
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {NEW_ACTIONS.map(({ href, label, hint, icon: Icon, chip }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setChoosing(false)}
                className="flex min-h-16 items-center gap-3 rounded-control bg-hairline-soft px-3 active:bg-hairline"
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}>
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-base font-extrabold text-ink">{label}</span>
                  <span className="block truncate text-sm text-muted">{hint}</span>
                </span>
                <ChevronLeft size={20} className="shrink-0 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
};
