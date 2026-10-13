import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";

type ShellProps = {
  children: ReactNode;
};

/**
 * One narrow column, phone-shaped on every screen: the app is used on phones,
 * and a desktop gets the same layout centred rather than a second design.
 */
export const Shell = ({ children }: ShellProps) => (
  <div className="mx-auto min-h-dvh w-full max-w-xl">
    {children}
    <BottomNav />
  </div>
);
