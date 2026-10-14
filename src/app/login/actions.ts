"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticate, endSession, startSession, UserSummary } from "@/services";
import { ActionResult, fail } from "@/utils";
import { LoginFormValues, loginFormSchema } from "@/validators/user";

export const signInAction = async (_prevState: ActionResult, values: LoginFormValues): Promise<ActionResult> => {
  const parsed = loginFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات" };
  }
  let user: UserSummary;
  try {
    user = await authenticate(parsed.data.username, parsed.data.password);
    await startSession(user.id);
  } catch (error) {
    return fail(error, "تعذّر تسجيل الدخول");
  }
  // The layout swaps the bare sign-in screen for the app's menus.
  revalidatePath("/", "layout");
  redirect(user.mustChangePassword ? "/account/password" : "/");
};

export const signOutAction = async (): Promise<void> => {
  await endSession();
  revalidatePath("/", "layout");
  redirect("/login");
};
