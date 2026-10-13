"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  error: Error;
  reset: () => void;
};

const ErrorPage = ({ reset }: Props) => (
  <div className="px-4 pt-16">
    <section className="rounded-card bg-surface shadow-card">
      <EmptyState
        icon={<TriangleAlert size={26} />}
        title="صار خطأ"
        description="تأكد من الإنترنت وجرّب مرة ثانية."
        action={
          <Button variant="secondary" onClick={reset}>
            جرّب مرة ثانية
          </Button>
        }
      />
    </section>
  </div>
);

export default ErrorPage;
