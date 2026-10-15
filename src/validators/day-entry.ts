import { z } from "zod";
import { cylinderTypes } from "@/db/enum";
import { PricedKind, pricedKinds } from "@/lib/pricing";
import { isIsoDate } from "@/utils/dates";
import { MAX_QUANTITY } from "./movement";

// A count typed as text: blank means none of these.
const count = z
  .string()
  .trim()
  .regex(/^\d{0,4}$/, "أرقام فقط")
  .refine((value) => Number(value) <= MAX_QUANTITY, `العدد أكبر من ${MAX_QUANTITY}`);

const typed = (value: string) => Number(value) > 0;

/** إضافة: how many full cylinders of each type came in. */
export const addFormSchema = z
  .object({
    businessDate: z.string().refine(isIsoDate, "اختر التاريخ"),
    household: count,
    industrial: count,
    note: z.string().trim().max(300, "الملاحظة طويلة"),
  })
  .superRefine((values, ctx) => {
    if (!cylinderTypes.some((type) => typed(values[type]))) {
      ctx.addIssue({ code: "custom", path: ["household"], message: "أدخل عدد صنف واحد على الأقل" });
    }
  });

export type AddFormValues = z.infer<typeof addFormSchema>;

const sales = z.object(
  Object.fromEntries(pricedKinds.map((kind) => [kind, count])) as Record<PricedKind, typeof count>,
);

/** بيع: what was sold of each type, per sale kind, usually at the end of the day. */
export const sellFormSchema = z
  .object({
    businessDate: z.string().refine(isIsoDate, "اختر التاريخ"),
    household: sales,
    industrial: sales,
    note: z.string().trim().max(300, "الملاحظة طويلة"),
  })
  .superRefine((values, ctx) => {
    if (!cylinderTypes.some((type) => pricedKinds.some((kind) => typed(values[type][kind])))) {
      ctx.addIssue({ code: "custom", path: ["household", "exchange"], message: "أدخل عدد واحد على الأقل" });
    }
  });

export type SellFormValues = z.infer<typeof sellFormSchema>;
