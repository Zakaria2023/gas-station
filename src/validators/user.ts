import { z } from "zod";
import { userRoles } from "@/db/enum";

export const MIN_PASSWORD = 6;

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,40}$/, "اسم المستخدم: 3 أحرف إنجليزية أو أرقام على الأقل، بدون مسافات");

const newPassword = z
  .string()
  .min(MIN_PASSWORD, `كلمة السر ${MIN_PASSWORD} أحرف على الأقل`)
  .max(200, "كلمة السر طويلة");

const name = z.string().trim().min(2, "اكتب الاسم").max(120, "الاسم طويل");

export const loginFormSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "اكتب اسم المستخدم").max(40, "اسم المستخدم طويل"),
  password: z.string().min(1, "اكتب كلمة السر").max(200, "كلمة السر طويلة"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const passwordFormSchema = z
  .object({
    current: z.string().min(1, "اكتب كلمة السر الحالية"),
    next: newPassword,
    confirm: z.string(),
  })
  .refine((values) => values.next === values.confirm, { path: ["confirm"], message: "الكلمتين مش متطابقتين" })
  .refine((values) => values.next !== values.current, { path: ["next"], message: "اختر كلمة سر غير الحالية" });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export const newUserFormSchema = z.object({
  name,
  username,
  password: newPassword,
  role: z.enum(userRoles, "اختر الدور"),
});

export type NewUserFormValues = z.infer<typeof newUserFormSchema>;

export const editUserFormSchema = z.object({
  name,
  role: z.enum(userRoles, "اختر الدور"),
  active: z.boolean(),
});

export type EditUserFormValues = z.infer<typeof editUserFormSchema>;

export const resetPasswordFormSchema = z.object({ password: newPassword });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
