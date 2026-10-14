"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CylinderType, MovementKind } from "@/db/enum";
import { bucketOf, owedIn } from "@/lib/balances";
import { applyToStock, isCash, isReturn, needsCustomer, StockDelta } from "@/lib/movement-rules";
import { amountOf, PriceList, priceFor } from "@/lib/pricing";
import { priceInputValue } from "@/utils/text";
import { movementFormSchema, MovementFormValues } from "@/validators/movement";
import { createMovementAction } from "./actions";
import { CustomerOption } from "./use-customer-picker";

type UseMovementFormArgs = {
  defaults: MovementFormValues;
  customers: CustomerOption[];
  /** The closing stock of `stockDate`, for the "after saving" preview. */
  stock: Record<CylinderType, StockDelta>;
  stockDate: string;
  /** The price list in force on `stockDate`. */
  prices: PriceList;
};

const parsePrice = (value: string): number | null =>
  /^\d{1,12}(\.\d{1,2})?$/.test(value.trim()) ? Number(value) : null;

export const useMovementForm = ({ defaults, customers, stock, stockDate, prices }: UseMovementFormArgs) => {
  const [state, dispatch, isPending] = useActionState(createMovementAction, {});

  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: defaults,
  });

  const kind = useWatch({ control: form.control, name: "kind" });
  const cylinderType = useWatch({ control: form.control, name: "cylinderType" });
  const quantity = useWatch({ control: form.control, name: "quantity" });
  const customerUuid = useWatch({ control: form.control, name: "customerUuid" });
  const businessDate = useWatch({ control: form.control, name: "businessDate" });
  const unitPriceText = useWatch({ control: form.control, name: "unitPrice" });

  // Picking another movement or type brings in its price from the list; the
  // person can still type a different one for this movement only.
  const choose = (next: { kind?: MovementKind; cylinderType?: CylinderType }) => {
    const nextKind = next.kind ?? kind;
    const nextType = next.cylinderType ?? cylinderType;
    if (next.kind) {
      form.setValue("kind", next.kind);
    }
    if (next.cylinderType) {
      form.setValue("cylinderType", next.cylinderType);
    }
    form.setValue("unitPrice", priceInputValue(priceFor(prices, nextType, nextKind)), { shouldValidate: true });
  };

  const withCustomer = needsCustomer(kind);
  // Money lent or paid back: no type, no count, only the amount typed in the price field.
  const cash = isCash(kind);
  const unitPrice = parsePrice(unitPriceText);

  // A return is capped at what the chosen customer owes of that type and state, or of money.
  const owedBucket = isReturn(kind) ? bucketOf(kind, cylinderType) : null;
  const customer = customers.find((option) => option.uuid === customerUuid);
  const owed = owedBucket && customer ? owedIn(customer.balance, owedBucket) : null;
  const overOwed = owed !== null && (cash ? (unitPrice ?? 0) : quantity) > owed;

  const before = stock[cylinderType];
  const after = quantity > 0 ? applyToStock(before, kind, quantity) : before;
  // The preview only knows the stock of the day the form opened on, and money moves no stock.
  const showPreview = businessDate === stockDate && !cash;

  const listPrice = priceFor(prices, cylinderType, kind);
  const total = cash ? (unitPrice ?? 0) : amountOf(quantity || 0, unitPrice);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      // A customer only rides along on the kinds that need one.
      dispatch({ ...values, customerUuid: withCustomer ? values.customerUuid : "", quantity: cash ? 1 : values.quantity });
    });
  });

  return {
    form,
    state,
    isPending,
    onSubmit,
    choose,
    kind,
    cylinderType,
    quantity,
    businessDate,
    withCustomer,
    cash,
    owedBucket,
    owed,
    overOwed,
    before,
    after,
    showPreview,
    unitPrice,
    listPrice,
    total,
  };
};
