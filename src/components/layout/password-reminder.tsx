"use client";

import { ChevronLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** A nudge, never a block: the password was set by someone else. Hidden on the page that changes it. */
export const PasswordReminder = () => {
  const pathname = usePathname();
  if (pathname.startsWith("/account/password")) {
    return null;
  }
  return (
    <div className="px-4 pt-3 lg:px-0">
      <Link
        href="/account/password"
        className="flex min-h-12 items-center gap-3 rounded-card bg-warning-tint px-4 py-2.5 text-sm text-warning"
      >
        <ShieldAlert size={19} className="shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="font-bold">كلمة السر مؤقتة.</span> اضغط هنا لتختار كلمة سر خاصة فيك.
        </span>
        <ChevronLeft size={18} className="shrink-0" />
      </Link>
    </div>
  );
};
