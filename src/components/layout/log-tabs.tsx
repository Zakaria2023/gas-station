import Link from "next/link";

type LogTabsProps = {
  active: "days" | "movements";
};

const TABS = [
  { key: "days", href: "/history", label: "الأيام" },
  { key: "movements", href: "/movements", label: "كل الحركات" },
] as const;

/** The two views of the record: day by day, or movement by movement. */
export const LogTabs = ({ active }: LogTabsProps) => (
  <nav aria-label="السجل" className="grid grid-cols-2 gap-1 rounded-control bg-hairline-soft p-1 lg:max-w-sm">
    {TABS.map((tab) => (
      <Link
        key={tab.key}
        href={tab.href}
        aria-current={tab.key === active ? "page" : undefined}
        className={`flex min-h-10 items-center justify-center rounded-[11px] text-sm font-bold transition ${
          tab.key === active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
        }`}
      >
        {tab.label}
      </Link>
    ))}
  </nav>
);
