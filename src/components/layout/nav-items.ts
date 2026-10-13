import { BookOpen, CalendarDays, ClipboardCheck, House, List, Tags, Users, type LucideIcon } from "lucide-react";

/** The app's sections: the phone's tab bar shows the first few, the desktop sidebar all of them. */

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "اليوم", icon: House },
  { href: "/customers", label: "الزبائن", icon: Users },
  { href: "/history", label: "سجل الأيام", icon: CalendarDays },
  { href: "/movements", label: "كل الحركات", icon: List },
];

export const TOOLS_NAV: NavItem[] = [
  { href: "/prices", label: "الأسعار", icon: Tags },
  { href: "/counts/new", label: "جرد أول اليوم", icon: ClipboardCheck },
  { href: "/rules", label: "قواعد الحركات", icon: BookOpen },
];

export const isActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  // The new-movement form is its own screen, not part of the movements log.
  if (href === "/movements") {
    return pathname === "/movements";
  }
  return pathname.startsWith(href.replace(/\/new$/, ""));
};
