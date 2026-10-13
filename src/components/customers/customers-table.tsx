import { ChevronLeft, Phone } from "lucide-react";
import Link from "next/link";
import { CustomerAvatar } from "@/components/customers/customer-avatar";
import { TABLE, TABLE_HEAD_ROW, TABLE_WRAP, TD, TD_NUMBER, TH, TR } from "@/components/ui/data-table";
import { TYPE_TEXT } from "@/components/ui/type-badge";
import { cylinderTypes } from "@/db/enum";
import { CYLINDER_STATE_LABELS, CYLINDER_TYPE_LABELS } from "@/db/label";
import type { CustomerWithBalance } from "@/services/customers";
import { formatCount, formatMoney } from "@/utils/text";

type CustomersTableProps = {
  customers: CustomerWithBalance[];
};

/** The desktop's customer list: one row each, the debt summary sheet's columns across. */
export const CustomersTable = ({ customers }: CustomersTableProps) => (
  <div className={`hidden lg:block ${TABLE_WRAP}`}>
    <table className={TABLE}>
      <thead className={TABLE_HEAD_ROW}>
        <tr>
          <th className={TH}>الزبون</th>
          <th className={TH}>الهاتف</th>
          {cylinderTypes.flatMap((type) =>
            (["full", "empty"] as const).map((state) => (
              <th key={`${type}-${state}`} className={`${TH} ${TYPE_TEXT[type]}`}>
                {CYLINDER_TYPE_LABELS[type]} {CYLINDER_STATE_LABELS[state]}
              </th>
            )),
          )}
          <th className={TH}>المبلغ المستحق</th>
          <th className={TH} />
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.uuid} className={TR}>
            <td className={TD}>
              <Link href={`/customers/${customer.uuid}`} className="flex items-center gap-3 font-bold text-ink hover:text-primary">
                <CustomerAvatar name={customer.name} />
                {customer.name}
              </Link>
            </td>
            <td className={TD}>
              {customer.phone ? (
                <a href={`tel:${customer.phone.replace(/\s/g, "")}`} dir="ltr" className="inline-flex items-center gap-1.5 text-muted hover:text-primary">
                  <Phone size={14} />
                  {customer.phone}
                </a>
              ) : (
                <span className="text-faint">—</span>
              )}
            </td>
            {cylinderTypes.flatMap((type) =>
              (["full", "empty"] as const).map((state) => {
                const value = customer.balance[type][state];
                return (
                  <td key={`${type}-${state}`} className={`${TD_NUMBER} text-base font-extrabold ${value ? "text-ink" : "text-faint"}`}>
                    {value ? formatCount(value) : "·"}
                  </td>
                );
              }),
            )}
            <td className={`${TD_NUMBER} font-extrabold ${customer.balance.money ? "text-debts" : "text-faint"}`}>
              {customer.balance.money ? formatMoney(customer.balance.money) : "—"}
            </td>
            <td className={`${TD} w-10`}>
              <Link href={`/customers/${customer.uuid}`} aria-label={`فتح ${customer.name}`} className="text-faint hover:text-primary">
                <ChevronLeft size={18} />
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
