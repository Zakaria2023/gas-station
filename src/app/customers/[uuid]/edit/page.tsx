import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { getCustomer } from "@/services";

export const metadata: Metadata = { title: "تعديل زبون" };

type Props = {
  params: Promise<{ uuid: string }>;
};

const EditCustomerPage = async ({ params }: Props) => {
  const { uuid } = await params;
  const customer = await getCustomer(uuid);
  if (!customer) {
    notFound();
  }

  return (
    <>
      <PageHeader title="تعديل الزبون" subtitle={customer.name} backHref={`/customers/${uuid}`} />
      <CustomerForm
        mode="edit"
        uuid={uuid}
        values={{ name: customer.name, phone: customer.phone ?? "", notes: customer.notes ?? "" }}
      />
    </>
  );
};

export default EditCustomerPage;
