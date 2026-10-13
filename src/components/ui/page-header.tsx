import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** Where the back arrow goes; no arrow on a top-level tab. */
  backHref?: string;
  actions?: ReactNode;
};

/** The bar at the top of every screen; it stays put while the page scrolls under it. */
export const PageHeader = ({ title, subtitle, backHref, actions }: PageHeaderProps) => (
  <header className="pt-safe sticky top-0 z-20 bg-page/85 backdrop-blur-md">
    <div className="flex min-h-16 items-center gap-2 px-4 py-2">
      {backHref && (
        <Link
          href={backHref}
          aria-label="رجوع"
          className="-ms-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-hover active:bg-hover"
        >
          {/* In a right-to-left page, "back" points right. */}
          <ChevronRight size={24} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] leading-tight font-extrabold text-ink">{title}</h1>
        {subtitle && <div className="mt-0.5 truncate text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  </header>
);
