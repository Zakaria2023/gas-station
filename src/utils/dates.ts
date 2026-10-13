/**
 * A business day is a "YYYY-MM-DD" string in the shop's own time zone. It is
 * never turned into a Date for arithmetic except at UTC midnight, so no
 * server or phone time zone can move a movement onto the wrong day.
 */

const DEFAULT_TIME_ZONE = "Asia/Damascus";

/** The shop's time zone; set APP_TIME_ZONE to change it. */
export const appTimeZone = (): string => process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE;

export const isIsoDate = (value: string | null | undefined): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

/** Today in the shop, as "YYYY-MM-DD". */
export const todayIso = (now = new Date()): string =>
  // en-CA formats as YYYY-MM-DD.
  new Intl.DateTimeFormat("en-CA", { timeZone: appTimeZone() }).format(now);

const toUtc = (iso: string) => new Date(`${iso}T00:00:00Z`);

export const addDays = (iso: string, days: number): string => {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Western digits, Levantine month names: "الثلاثاء، 13 تشرين الأول". */
const LOCALE = "ar-SY-u-nu-latn";

const LONG_DAY = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const SHORT_DAY = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const WEEKDAY = new Intl.DateTimeFormat(LOCALE, { weekday: "long", timeZone: "UTC" });

const FULL_DAY = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export const formatLongDay = (iso: string): string => LONG_DAY.format(toUtc(iso));
export const formatShortDay = (iso: string): string => SHORT_DAY.format(toUtc(iso));
export const formatWeekday = (iso: string): string => WEEKDAY.format(toUtc(iso));
export const formatFullDay = (iso: string): string => FULL_DAY.format(toUtc(iso));

/** A calendar month as "YYYY-MM". */
export const isIsoMonth = (value: string | null | undefined): value is string =>
  typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

export const monthOf = (iso: string): string => iso.slice(0, 7);

export const monthStart = (month: string): string => `${month}-01`;

export const addMonths = (month: string, months: number): string => {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 7);
};

export const monthEnd = (month: string): string => addDays(monthStart(addMonths(month, 1)), -1);

const MONTH = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" });

/** "تشرين الأول 2026". */
export const formatMonth = (month: string): string => MONTH.format(toUtc(monthStart(month)));

/** "اليوم", "مبارح", or the weekday — how people name a recent day. */
export const relativeDayName = (iso: string, today: string): string => {
  if (iso === today) {
    return "اليوم";
  }
  if (iso === addDays(today, -1)) {
    return "مبارح";
  }
  return formatWeekday(iso);
};

/** The time an entry was made, in the shop's time zone: "1:28 م". */
export const formatTime = (value: Date, timeZone: string): string =>
  new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone }).format(value);
