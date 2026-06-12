import { Link } from "react-router";
import { ArrowLeft, User } from "lucide-react";
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
    <div className="auth-minimal-bg relative flex min-h-screen flex-col">
      <Link
        to="/"
        className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white sm:left-8 sm:top-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-2 border-white/75">
              <User className="h-9 w-9 text-white" strokeWidth={1.5} />
            </div>
            <h1 className="text-base font-medium uppercase tracking-[0.22em] text-white sm:text-lg">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}

          <p className="mt-8 text-center text-sm text-white/70">
            {footerText}{" "}
            <Link
              to={footerLinkTo}
              className="font-medium text-white underline-offset-4 transition-colors hover:text-white/90 hover:underline"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>

      <SupportFab audience="customer" />
    </div>
  );
}
