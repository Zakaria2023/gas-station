type CylinderIconProps = {
  /** A full cylinder is drawn solid, an empty one as an outline. */
  filled: boolean;
  size?: number;
  className?: string;
};

/**
 * A gas cylinder: valve and guard on top, a tall domed body, a foot ring —
 * the one picture that says "full" or "empty" without words.
 */
export const CylinderIcon = ({ filled, size = 20, className = "" }: CylinderIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    {/* valve */}
    <path d="M11 1.8h2v2.4h-2z" fill="currentColor" stroke="none" />
    {/* the guard ring round the valve */}
    <path d="M8.6 6.6V4.9c0-.5.4-.8.8-.8h5.2c.4 0 .8.3.8.8v1.7" />
    {/* body with a domed shoulder */}
    <path
      d="M6.5 11c0-2.6 2.4-4.4 5.5-4.4s5.5 1.8 5.5 4.4v8.2c0 .8-.6 1.3-1.3 1.3H7.8c-.7 0-1.3-.5-1.3-1.3z"
      fill={filled ? "currentColor" : "none"}
    />
    {/* foot ring */}
    <path d="M8.2 20.6v1.6h7.6v-1.6" />
  </svg>
);
