import { ReactNode } from "react";
import { FormError } from "@/components/ui/form-error";

type ActionBarProps = {
  error?: string;
  /** The submit button. */
  children: ReactNode;
};

/**
 * The save bar every form keeps under the thumb. On a phone it spans the
 * screen with the error above the button; on a desktop it starts where the
 * sidebar ends, with the button first and the error beside it.
 */
export const ActionBar = ({ error, children }: ActionBarProps) => (
  <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-surface/95 backdrop-blur-md lg:inset-s-64">
    <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 py-3 lg:max-w-7xl lg:flex-row lg:items-center lg:gap-4 lg:px-10">
      <div className="lg:min-w-0 lg:flex-1">
        <FormError message={error} />
      </div>
      <div className="lg:order-first lg:w-80 lg:shrink-0">{children}</div>
    </div>
  </div>
);
