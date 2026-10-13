import { BookOpen, ChevronLeft, ClipboardCheck, List, Tags, type LucideIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "المزيد" };

type Item = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const ITEMS: Item[] = [
  { href: "/movements", label: "كل الحركات", hint: "كل حركة بسعرها، لأي فترة، مع تنزيل Excel", icon: List },
  { href: "/counts/new", label: "جرد أول اليوم", hint: "سجّل اللي عندك فعلاً بالمحل", icon: ClipboardCheck },
  { href: "/prices", label: "الأسعار", hint: "سعر الجرة لكل حركة، ومن أي يوم", icon: Tags },
  { href: "/rules", label: "قواعد الحركات", hint: "شو بتعمل كل حركة بالمخزون والديون", icon: BookOpen },
];

const MorePage = () => (
  <>
    <PageHeader title="المزيد" />
    <div className="px-4 lg:max-w-2xl">
      <ul className="divide-y divide-hairline-soft rounded-card bg-surface shadow-card">
        {ITEMS.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-hover">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ink">{label}</span>
                <span className="block truncate text-sm text-muted">{hint}</span>
              </span>
              <ChevronLeft size={20} className="text-faint" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default MorePage;
