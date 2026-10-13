import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-primary-hover",
  secondary: "border border-hairline bg-surface text-ink hover:bg-hover active:bg-hover",
  danger: "border border-danger/25 bg-surface text-danger hover:bg-danger-tint active:bg-danger-tint",
  ghost: "text-muted hover:bg-hover hover:text-ink active:bg-hover",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: "min-h-11 px-4 text-[15px]",
  lg: "min-h-14 px-5 text-base",
};

/** The same look for a <Link> that acts as a button. */
export const buttonClasses = ({
  variant = "primary",
  size = "md",
  block = false,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}): string =>
  `inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 ${
    VARIANT_CLASSES[variant]
  } ${SIZE_CLASSES[size]} ${block ? "w-full" : ""}`;

export const Button = ({
  variant = "primary",
  size = "md",
  block = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) => (
  <button type={type} className={`${buttonClasses({ variant, size, block })} ${className}`} {...props} />
);
