type CustomerAvatarProps = {
  name: string;
  size?: "md" | "lg";
};

// A steady colour per name, so the same customer always looks the same.
const COLORS = [
  "bg-household-tint text-household",
  "bg-industrial-tint text-industrial",
  "bg-returns-tint text-returns",
  "bg-stock-tint text-stock",
  "bg-debts-tint text-debts",
];

const colorFor = (name: string) => {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
};

/** The first letter of the name in a coloured circle. */
export const CustomerAvatar = ({ name, size = "md" }: CustomerAvatarProps) => (
  <span
    aria-hidden="true"
    className={`flex shrink-0 items-center justify-center rounded-full font-extrabold ${colorFor(name)} ${
      size === "lg" ? "h-16 w-16 text-2xl" : "h-11 w-11 text-lg"
    }`}
  >
    {name.trim().charAt(0)}
  </span>
);
