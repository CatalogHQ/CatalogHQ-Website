import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import CatalogHqLogo from "@/components/brand/CatalogHqLogo";
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
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-whatsapp-dark to-whatsapp-bg lg:flex lg:flex-col">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-whatsapp-green/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-whatsapp-green/10 blur-3xl" />

          <div className="relative flex min-h-screen flex-col p-10">
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>

            <div className="flex flex-1 flex-col justify-center py-10">
              <div className="max-w-sm">
                <CatalogHqLogo
                  variant="wordmark"
                  onDark
                  className="h-10 w-[180px] sm:h-11 sm:w-[198px]"
                />
                <p className="mt-6 text-base leading-relaxed text-white/75">
                  Turn social media sales into a real store. Share one link on
                  WhatsApp, Instagram, Facebook, or X, or start selling online
                  for the first time.
                </p>
              </div>
            </div>

            <p className="text-sm text-white/50">
              Built for Nigerian vendors online.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <CatalogHqLogo variant="wordmark" className="h-9 w-[172px] sm:h-10 sm:w-[188px]" />
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
