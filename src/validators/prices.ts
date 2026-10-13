import { z } from "zod";
import { movementKinds } from "@/db/enum";
import { isIsoDate } from "@/utils/dates";

// Text, so an empty field means "no price" rather than a price of 0.
const price = z
  .string()
  .trim()
  .regex(/^$|^\d{1,12}(\.\d{1,2})?$/, "أرقام فقط، مثل 100 أو 12.5");

const pricesOfType = z.object(
  Object.fromEntries(movementKinds.map((kind) => [kind, price])) as Record<
    (typeof movementKinds)[number],
    typeof price
  >,
);

export const pricesFormSchema = z.object({
  effectiveFrom: z.string().refine(isIsoDate, "اختر التاريخ"),
  household: pricesOfType,
  industrial: pricesOfType,
});

export type PricesFormValues = z.infer<typeof pricesFormSchema>;
