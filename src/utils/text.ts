/** Trimmed, with runs of spaces collapsed: "  أحمد   خليل " → "أحمد خليل". */
export const cleanName = (value: string): string => value.trim().replace(/\s+/g, " ");

/**
 * The letters people type interchangeably in Arabic names, folded together so
 * a search for "احمد" finds "أحمد". The same folding runs in SQL (see
 * services/customers.ts), so the two must stay in step.
 */
export const ARABIC_FOLD_FROM = "أإآىةؤئ";
export const ARABIC_FOLD_TO = "ااايهوي";

export const foldArabic = (value: string): string => {
  let folded = value;
  for (let i = 0; i < ARABIC_FOLD_FROM.length; i += 1) {
    folded = folded.split(ARABIC_FOLD_FROM[i]).join(ARABIC_FOLD_TO[i]);
  }
  return folded;
};

const COUNT_FORMAT = new Intl.NumberFormat("en-US");

/** Western digits with thousands separators, as the sheet showed them. */
export const formatCount = (value: number): string => COUNT_FORMAT.format(value);

const MONEY_FORMAT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** The currency written after an amount; Syrian pounds. */
export const CURRENCY = "ل.س";

/** "22,000 ل.س" — Western digits like the counts, piastres only when there are some. */
export const formatMoney = (value: number): string =>
  `${value < 0 ? "−" : ""}${MONEY_FORMAT.format(Math.abs(value))} ${CURRENCY}`;

/** A price as typed into a field: "100" or "12.5", never "1,000". */
export const priceInputValue = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

/** "+5" / "−3" / "0", with a real minus sign. */
export const formatSigned = (value: number): string => {
  if (value > 0) {
    return `+${formatCount(value)}`;
  }
  if (value < 0) {
    return `−${formatCount(-value)}`;
  }
  return "0";
};
