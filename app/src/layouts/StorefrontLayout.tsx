import { useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import SupportFab from "@/components/support/SupportFab";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import type { PublicStoreView } from "@/types/domain";

type StorefrontLayoutProps = {
  store: PublicStoreView;
  children: ReactNode;
  immersive?: boolean;
  supportOrderRef?: string;
};

export default function StorefrontLayout({
  store,
  children,
  immersive = false,
  supportOrderRef,
}: StorefrontLayoutProps) {
  useEffect(() => {
    if (!immersive) return;

    const { overflow, height } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.height = "100dvh";

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.height = height;
    };
  }, [immersive]);

  const supportFab = (
    <SupportFab
      audience="customer"
      storeName={store.businessName}
      orderRef={supportOrderRef}
    />
  );

  if (immersive) {
    return (
      <div className="fixed inset-0 z-0 h-dvh max-h-dvh w-full overflow-hidden bg-black">
        <main className="h-dvh w-full">{children}</main>
        {supportFab}
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fa]">
      <StorefrontHeader store={store} />

      <main className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
        {children}
      </main>

      <footer className="border-t bg-white py-5 sm:py-6">
        <div className="mx-auto max-w-5xl px-3 text-center text-xs text-gray-500 sm:px-6 sm:text-sm">
          <p>
            Powered by{" "}
            <Link
              to="/"
              className="font-semibold text-whatsapp-dark hover:text-whatsapp-green"
            >
              CatalogHQ
            </Link>
          </p>
        </div>
      </footer>
      {supportFab}
    </div>
  );
}
