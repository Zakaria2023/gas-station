import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { EditUserForm, UserAccess } from "@/components/users/user-forms";
import { getUser, requireAdmin } from "@/services";

export const metadata: Metadata = { title: "مستخدم" };

type Props = {
  params: Promise<{ uuid: string }>;
};

const UserPage = async ({ params }: Props) => {
  const me = await requireAdmin();
  const { uuid } = await params;
  const user = await getUser(uuid);
  if (!user) {
    notFound();
  }
  const isSelf = user.id === me.id;

  return (
    <>
      <PageHeader title={user.name} subtitle={<span dir="ltr">{user.username}</span>} backHref="/users" />
      <div className="flex flex-col gap-4 px-4 pt-1 pb-40 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-5">
        <EditUserForm
          uuid={user.uuid}
          username={user.username}
          isSelf={isSelf}
          values={{ name: user.name, role: user.role, active: user.active }}
        />
        {/* Your own password and sessions are under المزيد. */}
        {!isSelf && <UserAccess uuid={user.uuid} />}
      </div>
    </>
  );
};

export default UserPage;
