import { z } from "zod";
import { cylinderTypes, movementKinds } from "@/db/enum";
import { isCash, needsCustomer } from "@/lib/movement-rules";
import { isIsoDate } from "@/utils/dates";

export const MAX_QUANTITY = 5000;

export const movementFormSchema = z
  .object({
    kind: z.enum(movementKinds, "اختر نوع الحركة"),
    cylinderType: z.enum(cylinderTypes, "اختر الصنف"),
    quantity: z
      .number("أدخل العدد")
      .int("العدد بدون كسور")
      .min(1, "العدد واحد على الأقل")
      .max(MAX_QUANTITY, `العدد أكبر من ${MAX_QUANTITY}`),
    // Typed as text so an empty field means "no price"; filled from the price list.
    unitPrice: z
      .string()
      .trim()
      .regex(/^$|^\d{1,12}(\.\d{1,2})?$/, "السعر أرقام فقط، مثل 100 أو 12.5"),
    customerUuid: z.string(),
    businessDate: z.string().refine(isIsoDate, "اختر التاريخ"),
    note: z.string().trim().max(300, "الملاحظة طويلة"),
  })
  .superRefine((values, ctx) => {
    if (needsCustomer(values.kind) && !values.customerUuid) {
      ctx.addIssue({ code: "custom", path: ["customerUuid"], message: "اختر الزبون" });
    }
    // Money is only its amount, typed in the price field.
    if (isCash(values.kind) && !(Number(values.unitPrice) > 0)) {
      ctx.addIssue({ code: "custom", path: ["unitPrice"], message: "أدخل المبلغ" });
    }
  });

export type MovementFormValues = z.infer<typeof movementFormSchema>;
