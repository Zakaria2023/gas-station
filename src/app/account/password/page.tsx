import { Metadata } from "next";
import { PasswordForm } from "@/components/auth/password-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/services";

export const metadata: Metadata = { title: "تغيير كلمة السر" };

const PasswordPage = async () => {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="تغيير كلمة السر" subtitle={user.name} backHref="/more" />
      <PasswordForm />
    </>
  );
};

export default PasswordPage;
