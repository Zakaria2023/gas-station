import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

/** Who is signed in, as much as the menus need. */
export type ShellUser = {
  name: string;
  isAdmin: boolean;
};

type ShellProps = {
  user: ShellUser;
  children: ReactNode;
};

/**
 * Two layouts from one page tree. On a phone: one narrow column with a tab
 * bar at the bottom. From `lg` up: a dashboard — a side menu on the right and
 * a wide content area whose pages spread into columns.
 */
export const Shell = ({ user, children }: ShellProps) => (
  <>
    <Sidebar user={user} />
    <main className="min-h-dvh lg:ps-64">
      <div className="mx-auto w-full max-w-xl lg:max-w-7xl lg:px-6 lg:pb-10">{children}</div>
    </main>
    <BottomNav />
  </>
);
