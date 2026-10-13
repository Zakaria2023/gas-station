"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CylinderType, MovementKind } from "@/db/enum";
import { applyToStock, MOVEMENT_EFFECTS, needsCustomer, StockDelta } from "@/lib/movement-rules";
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
  const debt = MOVEMENT_EFFECTS[kind].debt;

  // A return is capped at what the chosen customer owes of that type and state.
  const owedBucket = debt?.sign === -1 ? { cylinderType, state: debt.state } : null;
  const customer = customers.find((option) => option.uuid === customerUuid);
  const owed = owedBucket && customer ? customer.balance[owedBucket.cylinderType][owedBucket.state] : null;

  const before = stock[cylinderType];
  const after = quantity > 0 ? applyToStock(before, kind, quantity) : before;
  // The preview only knows the stock of the day the form opened on.
  const showPreview = businessDate === stockDate;

  const unitPrice = parsePrice(unitPriceText);
  const listPrice = priceFor(prices, cylinderType, kind);
  const total = amountOf(quantity || 0, unitPrice);

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      // A customer only rides along on the kinds that need one.
      dispatch({ ...values, customerUuid: withCustomer ? values.customerUuid : "" });
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
    owedBucket,
    owed,
    before,
    after,
    showPreview,
    unitPrice,
    listPrice,
    total,
  };
};
