"use client";

import { LogOut, PackagePlus, Plus, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/login/actions";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { USER_ROLE_LABELS } from "@/db/label";
import { ACCOUNT_NAV, ADMIN_NAV, isActive, MAIN_NAV, NavItem, TOOLS_NAV } from "./nav-items";
import type { ShellUser } from "./shell";

const NavLink = ({ item, pathname }: { item: NavItem; pathname: string }) => {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-[15px] font-bold transition-colors ${
        active ? "bg-primary-tint text-primary" : "text-muted hover:bg-hover hover:text-ink"
      }`}
    >
      <Icon size={20} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </Link>
  );
};

/** The desktop's side menu, on the right in a right-to-left page; phones use the tab bar. */
export const Sidebar = ({ user }: { user: ShellUser }) => {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 inset-s-0 z-30 hidden w-64 flex-col border-e border-hairline bg-surface lg:flex">
      <Link href="/" className="flex items-center gap-3 px-5 py-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-primary text-white shadow-float">
          <CylinderIcon filled={false} size={24} />
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-extrabold text-ink">محطة الغاز</span>
          <span className="block text-xs text-muted">الجرد والديون والحساب</span>
        </span>
      </Link>

      <div className="grid grid-cols-2 gap-2 px-4 pb-2">
        <Link
          href="/sell"
          className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary font-bold text-white shadow-sm transition hover:bg-primary-hover"
        >
          <ShoppingBag size={19} strokeWidth={2.4} />
          بيع
        </Link>
        <Link
          href="/add"
          className="flex min-h-12 items-center justify-center gap-2 rounded-control bg-primary-tint font-bold text-primary transition hover:bg-primary/15"
        >
          <PackagePlus size={19} strokeWidth={2.4} />
          إضافة
        </Link>
        <Link
          href="/movements/new"
          className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-control border border-hairline text-sm font-bold text-ink transition hover:bg-hover"
        >
          <Plus size={18} strokeWidth={2.4} />
          حركة جديدة
        </Link>
      </div>

      <nav aria-label="الأقسام" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <p className="mt-5 mb-1 px-3 text-xs font-bold text-faint">أدوات</p>
        {TOOLS_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        {user.isAdmin &&
          ADMIN_NAV.map((item) => <NavLink key={item.href} item={item} pathname={pathname} />)}
      </nav>

      <div className="border-t border-hairline px-3 py-3">
        <div className="flex items-center gap-3 px-3 pb-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hairline-soft text-muted">
            <UserRound size={18} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-bold text-ink">{user.name}</span>
            <span className="block text-xs text-muted">{USER_ROLE_LABELS[user.isAdmin ? "admin" : "staff"]}</span>
          </span>
        </div>
        {ACCOUNT_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-[15px] font-bold text-muted transition-colors hover:bg-danger-tint hover:text-danger"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </aside>
  );
};
