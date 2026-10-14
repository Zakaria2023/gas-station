"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { changeOwnPassword, requireSignedIn, sessionToken } from "@/services";
import { ActionResult, fail } from "@/utils";
import { PasswordFormValues, passwordFormSchema } from "@/validators/user";

export const changePasswordAction = async (
  _prevState: ActionResult,
  values: PasswordFormValues,
): Promise<ActionResult> => {
  // Not requireUser: someone made to change their password has to get here.
  const user = await requireSignedIn();
  const parsed = passwordFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات" };
  }
  try {
    // Every other browser signed in as this user is signed out; this one stays.
    await changeOwnPassword(user.id, parsed.data.current, parsed.data.next, (await sessionToken()) ?? "");
  } catch (error) {
    return fail(error, "تعذّر تغيير كلمة السر");
  }
  revalidatePath("/", "layout");
  redirect("/?password=changed");
};
