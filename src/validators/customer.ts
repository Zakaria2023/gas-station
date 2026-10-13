import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "اكتب اسم الزبون").max(120, "الاسم طويل"),
  phone: z
    .string()
    .trim()
    .regex(/^$|^[0-9+\s-]{6,20}$/, "رقم الهاتف غير صحيح"),
  notes: z.string().trim().max(500, "الملاحظة طويلة"),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
