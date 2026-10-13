import { z } from "zod";
import { cylinderTypes } from "@/db/enum";
import { isIsoDate } from "@/utils/dates";

const amount = z.string().trim().regex(/^\d{0,6}$/, "أرقام فقط");

const pair = z.object({ full: amount, empty: amount });

/**
 * The morning count for both types at once, as the sheet had one row per
 * type. A type left completely blank is not counted; a half-filled one is an
 * error, since a count is the full and the empty together.
 */
export const countFormSchema = z
  .object({
    countedOn: z.string().refine(isIsoDate, "اختر التاريخ"),
    household: pair,
    industrial: pair,
    note: z.string().trim().max(300, "الملاحظة طويلة"),
  })
  .superRefine((values, ctx) => {
    let any = false;
    for (const type of cylinderTypes) {
      const { full, empty } = values[type];
      if (full === "" && empty === "") {
        continue;
      }
      any = true;
      for (const state of ["full", "empty"] as const) {
        if (values[type][state] === "") {
          ctx.addIssue({ code: "custom", path: [type, state], message: "أدخل العدد" });
        }
      }
    }
    if (!any) {
      ctx.addIssue({ code: "custom", path: ["household", "full"], message: "أدخل جرد صنف واحد على الأقل" });
    }
  });

export type CountFormValues = z.infer<typeof countFormSchema>;
