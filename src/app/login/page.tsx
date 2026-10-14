import { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { CylinderIcon } from "@/components/ui/cylinder-icon";
import { getCurrentUser } from "@/services";

export const metadata: Metadata = { title: "تسجيل الدخول" };

/** The one screen outside the app: no menus, just the shop's name and the sign-in form. */
const LoginPage = async () => {
  if (await getCurrentUser()) {
    redirect("/");
  }
  return (
    <main className="pt-safe pb-safe flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-white shadow-float">
            <CylinderIcon filled={false} size={34} />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold text-ink">محطة الغاز</h1>
            <p className="mt-1 text-sm text-muted">سجّل دخولك لتكمل</p>
          </div>
        </div>
        <section className="rounded-card bg-surface p-5 shadow-card">
          <LoginForm />
        </section>
      </div>
    </main>
  );
};

export default LoginPage;
