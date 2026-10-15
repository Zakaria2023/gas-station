import { ChevronLeft, UserPlus } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { PageHeader } from "@/components/ui/page-header";
import { Toast } from "@/components/ui/toast";
import { USER_ROLE_LABELS } from "@/db/label";
import { listUsers, requireAdmin } from "@/services";

export const metadata: Metadata = { title: "المستخدمين" };

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SAVED: Record<string, string> = {
  added: "تمت إضافة المستخدم",
  updated: "تم حفظ المستخدم",
};

/** Everyone who can sign in; a handful of people, so one list serves phone and desktop. */
const UsersPage = async ({ searchParams }: Props) => {
  const me = await requireAdmin();
  const [params, users] = await Promise.all([searchParams, listUsers()]);
  const saved = Array.isArray(params.saved) ? params.saved[0] : params.saved;

  return (
    <>
      <PageHeader
        title="المستخدمين"
        subtitle="مين بيدخل عالبرنامج"
        backHref="/more"
        actions={
          <Link
            href="/users/new"
            className="flex min-h-11 items-center gap-1.5 rounded-control px-3 text-sm font-bold text-primary hover:bg-primary-tint active:bg-primary-tint"
          >
            <UserPlus size={18} />
            إضافة
          </Link>
        }
      />
      <div className="px-4 pb-8 lg:max-w-2xl">
        <ul className="divide-y divide-hairline-soft rounded-card bg-surface shadow-card">
          {users.map((user) => (
            <li key={user.uuid}>
              <Link href={`/users/${user.uuid}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-hover active:bg-hover">
                <CustomerAvatar name={user.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={`truncate font-bold ${user.active ? "text-ink" : "text-faint line-through"}`}>
                      {user.name}
                    </span>
                    {user.id === me.id && <span className="text-xs text-muted">(أنت)</span>}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                    <span dir="ltr">{user.username}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        user.role === "admin" ? "bg-primary-tint text-primary" : "bg-hairline-soft text-muted"
                      }`}
                    >
                      {USER_ROLE_LABELS[user.role]}
                    </span>
                    {!user.active && (
                      <span className="rounded-full bg-danger-tint px-2 py-0.5 text-xs font-bold text-danger">موقوف</span>
                    )}
                  </span>
                </span>
                <ChevronLeft size={20} className="text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {saved && SAVED[saved] && <Toast key={saved} message={SAVED[saved]} />}
    </>
  );
};

export default UsersPage;
