import SupportFab from "@/components/support/SupportFab";

type VendorSupportFabProps = {
  storeName?: string;
};

export default function VendorSupportFab({ storeName }: VendorSupportFabProps) {
  return <SupportFab audience="vendor" storeName={storeName} />;
}
