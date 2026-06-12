import { Link } from "react-router";
import { ArrowLeft, Store } from "lucide-react";
import SupportFab from "@/components/support/SupportFab";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-whatsapp-dark to-whatsapp-bg p-10 lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-whatsapp-green/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-whatsapp-green/10 blur-3xl" />

          <Link
            to="/"
            className="relative inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="relative">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-whatsapp-green/20">
              <Store className="h-6 w-6 text-whatsapp-green" />
            </div>
            <p className="text-2xl font-bold text-white">CatalogHQ</p>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-white/75">
              Turn social media sales into a real store. Share one link on
              WhatsApp, Instagram, Facebook, or X, or start selling online for
              the first time.
            </p>
          </div>

          <p className="relative text-sm text-white/50">
            Built for Nigerian sellers online.
          </p>
        </div>

        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <p className="text-xl font-bold text-whatsapp-dark">CatalogHQ</p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
                ) : null}
              </div>

              {children}

              <p className="mt-6 text-center text-sm text-gray-500">
                {footerText}{" "}
                <Link
                  to={footerLinkTo}
                  className="font-semibold text-whatsapp-dark transition-colors hover:text-whatsapp-green"
                >
                  {footerLinkText}
                </Link>
              </p>

              <Link
                to="/"
                className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
      <SupportFab audience="customer" />
    </div>
  );
}
