import { BookOpen, ChevronLeft, ClipboardCheck, KeyRound, List, LogOut, Tags, UserCog, type LucideIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { PageHeader } from "@/components/ui/page-header";
import { USER_ROLE_LABELS } from "@/db/label";
import { requireUser } from "@/services";

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

const ADMIN_ITEMS: Item[] = [
  { href: "/users", label: "المستخدمين", hint: "مين بيدخل عالبرنامج، وكلمات السر", icon: UserCog },
];

const ACCOUNT_ITEMS: Item[] = [
  { href: "/account/password", label: "تغيير كلمة السر", hint: "كلمة سر جديدة لحسابك", icon: KeyRound },
];

const ItemList = ({ items }: { items: Item[] }) => (
  <ul className="divide-y divide-hairline-soft rounded-card bg-surface shadow-card">
    {items.map(({ href, label, hint, icon: Icon }) => (
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
);

const MorePage = async () => {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="المزيد" />
      <div className="flex flex-col gap-4 px-4 pb-8 lg:max-w-2xl">
        <ItemList items={user.role === "admin" ? [...ITEMS, ...ADMIN_ITEMS] : ITEMS} />

        <section className="flex flex-col gap-1">
          <p className="px-1 text-sm font-extrabold text-muted">
            {user.name} · {USER_ROLE_LABELS[user.role]}
          </p>
          <ItemList items={ACCOUNT_ITEMS} />
        </section>

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-card bg-surface font-bold text-danger shadow-card active:bg-danger-tint"
          >
            <LogOut size={20} />
            تسجيل الخروج
          </button>
        </form>
      </div>
    </>
  );
};

export default MorePage;
