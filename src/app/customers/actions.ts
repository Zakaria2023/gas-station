"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCustomer, deleteCustomer, updateCustomer } from "@/services";
import { ActionResult, cleanName, fail } from "@/utils";
import { CustomerFormValues, customerFormSchema } from "@/validators/customer";

export type QuickCustomerResult = ActionResult & {
  customer?: { uuid: string; name: string };
};

const toFields = (values: CustomerFormValues) => ({
  name: cleanName(values.name),
  phone: values.phone.trim() || null,
  notes: values.notes.trim() || null,
});

export const createCustomerAction = async (
  _prevState: ActionResult,
  values: CustomerFormValues,
): Promise<ActionResult> => {
  const parsed = customerFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات" };
  }
  let uuid: string;
  try {
    uuid = await createCustomer(toFields(parsed.data));
  } catch (error) {
    return fail(error, "تعذّر إضافة الزبون");
  }
  revalidatePath("/customers");
  redirect(`/customers/${uuid}`);
};

/** Add a customer by name from inside the movement form, without leaving it. */
export const quickCreateCustomerAction = async (name: string): Promise<QuickCustomerResult> => {
  const parsed = customerFormSchema.safeParse({ name, phone: "", notes: "" });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من الاسم" };
  }
  try {
    const fields = toFields(parsed.data);
    const uuid = await createCustomer(fields);
    revalidatePath("/customers");
    return { success: true, customer: { uuid, name: fields.name } };
  } catch (error) {
    return fail(error, "تعذّر إضافة الزبون");
  }
};

export const updateCustomerAction = async (
  uuid: string,
  _prevState: ActionResult,
  values: CustomerFormValues,
): Promise<ActionResult> => {
  const parsed = customerFormSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "تحقق من البيانات" };
  }
  try {
    await updateCustomer(uuid, toFields(parsed.data));
  } catch (error) {
    return fail(error, "تعذّر حفظ الزبون");
  }
  revalidatePath("/", "layout");
  redirect(`/customers/${uuid}`);
};

export const deleteCustomerAction = async (uuid: string): Promise<ActionResult> => {
  try {
    await deleteCustomer(uuid);
  } catch (error) {
    return fail(error, "تعذّر حذف الزبون");
  }
  revalidatePath("/customers");
  redirect("/customers");
};
