"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createUser,
  deleteUserSessions,
  getUser,
  requireAdmin,
  resetUserPassword,
  updateUser,
} from "@/services";
import { ActionResult, cleanName, fail } from "@/utils";
import {
  EditUserFormValues,
  editUserFormSchema,
  NewUserFormValues,
  newUserFormSchema,
  ResetPasswordFormValues,
  resetPasswordFormSchema,
} from "@/validators/user";

const firstIssue = (issues: { message: string }[]) => issues[0]?.message ?? "تحقق من البيانات";

export const createUserAction = async (_prevState: ActionResult, values: NewUserFormValues): Promise<ActionResult> => {
  await requireAdmin();
  const parsed = newUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues) };
  }
  try {
    await createUser({ ...parsed.data, name: cleanName(parsed.data.name) });
  } catch (error) {
    return fail(error, "تعذّر إضافة المستخدم");
  }
  revalidatePath("/users");
  redirect("/users?saved=added");
};

export const updateUserAction = async (
  uuid: string,
  _prevState: ActionResult,
  values: EditUserFormValues,
): Promise<ActionResult> => {
  const admin = await requireAdmin();
  const parsed = editUserFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues) };
  }
  try {
    await updateUser(uuid, { ...parsed.data, name: cleanName(parsed.data.name) }, admin.id);
  } catch (error) {
    return fail(error, "تعذّر حفظ المستخدم");
  }
  // A changed role or name shows in the menus.
  revalidatePath("/", "layout");
  redirect("/users?saved=updated");
};

export const resetPasswordAction = async (
  uuid: string,
  _prevState: ActionResult,
  values: ResetPasswordFormValues,
): Promise<ActionResult> => {
  await requireAdmin();
  const parsed = resetPasswordFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: firstIssue(parsed.error.issues) };
  }
  try {
    await resetUserPassword(uuid, parsed.data.password);
  } catch (error) {
    return fail(error, "تعذّر تغيير كلمة السر");
  }
  revalidatePath(`/users/${uuid}`);
  return { success: true };
};

/** Sign a user out of every browser, e.g. a phone that was lost. */
export const signOutUserAction = async (uuid: string): Promise<ActionResult> => {
  await requireAdmin();
  try {
    const user = await getUser(uuid);
    if (!user) {
      return { error: "هذا المستخدم غير موجود" };
    }
    await deleteUserSessions(user.id);
  } catch (error) {
    return fail(error, "تعذّر تسجيل الخروج");
  }
  return { success: true };
};
