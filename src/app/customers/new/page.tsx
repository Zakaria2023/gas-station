import { Metadata } from "next";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/services";

export const metadata: Metadata = { title: "زبون جديد" };

const NewCustomerPage = async () => {
  await requireUser();
  return (
    <>
      <PageHeader title="زبون جديد" backHref="/customers" />
      <CustomerForm mode="add" />
    </>
  );
};

export default NewCustomerPage;
