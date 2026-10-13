import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

const NotFoundPage = () => (
  <div className="px-4 pt-16">
    <section className="rounded-card bg-surface shadow-card">
      <EmptyState
        icon={<SearchX size={26} />}
        title="ما لقينا هالصفحة"
        description="يمكن انحذفت أو الرابط غلط."
        action={
          <Link href="/" className="text-sm font-bold text-primary">
            رجوع لليوم
          </Link>
        }
      />
    </section>
  </div>
);

export default NotFoundPage;
