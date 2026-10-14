import { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { NewUserForm } from "@/components/users/user-forms";
import { requireAdmin } from "@/services";

export const metadata: Metadata = { title: "مستخدم جديد" };

const NewUserPage = async () => {
  await requireAdmin();
  return (
    <>
      <PageHeader title="مستخدم جديد" backHref="/users" />
      <NewUserForm />
    </>
  );
};

export default NewUserPage;
