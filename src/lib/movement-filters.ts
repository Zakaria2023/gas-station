import { CylinderType, cylinderTypes, MovementKind, movementKinds } from "@/db/enum";
import { isIsoDate } from "@/utils/dates";

/**
 * What the all-movements page is narrowed to. Everything lives in the URL, so a
 * filtered view survives a refresh and the export downloads exactly what is
 * on screen.
 */
export type MovementFilters = {
  from?: string;
  to?: string;
  cylinderType?: CylinderType;
  kind?: MovementKind;
  customerUuid?: string;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined =>
  value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const parseMovementFilters = (params: RawParams): MovementFilters => {
  let from = first(params.from);
  let to = first(params.to);
  from = isIsoDate(from) ? from : undefined;
  to = isIsoDate(to) ? to : undefined;
  // A range typed backwards is still the range that was meant.
  if (from && to && from > to) {
    [from, to] = [to, from];
  }
  const customer = first(params.customer);
  return {
    from,
    to,
    cylinderType: oneOf(first(params.type), cylinderTypes),
    kind: oneOf(first(params.kind), movementKinds),
    customerUuid: customer && UUID.test(customer) ? customer : undefined,
  };
};

/** The filters back as a query string, for links that keep them. */
export const filtersQuery = (filters: MovementFilters, extra: Record<string, string> = {}): string => {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.cylinderType) params.set("type", filters.cylinderType);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.customerUuid) params.set("customer", filters.customerUuid);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const hasFilters = (filters: MovementFilters): boolean =>
  Boolean(filters.from || filters.to || filters.cylinderType || filters.kind || filters.customerUuid);
