import { ShieldAlert } from "lucide-react";
import { Metadata } from "next";
import { PasswordForm } from "@/components/auth/password-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireSignedIn } from "@/services";

export const metadata: Metadata = { title: "تغيير كلمة السر" };

const PasswordPage = async () => {
  const user = await requireSignedIn();
  return (
    <>
      {/* Made to change it: no way back until it is done. */}
      <PageHeader title="تغيير كلمة السر" subtitle={user.name} backHref={user.mustChangePassword ? undefined : "/more"} />
      {user.mustChangePassword && (
        <div className="px-4 pb-3 lg:max-w-2xl">
          <p className="flex items-start gap-3 rounded-card bg-warning-tint p-4 text-sm text-warning">
            <ShieldAlert size={20} className="mt-0.5 shrink-0" />
            <span>
              <span className="block font-bold">اختر كلمة سر خاصة فيك</span>
              كلمة السر الحالية حطّها حدا غيرك. غيّرها قبل ما تكمل.
            </span>
          </p>
        </div>
      )}
      <PasswordForm />
    </>
  );
};

export default PasswordPage;
