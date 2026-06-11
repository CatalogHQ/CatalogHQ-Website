import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import SupportFab from "@/components/support/SupportFab";
import { Printer, ArrowLeft, FileDown } from "lucide-react";
import {
  PLANS,
  FEATURES,
  CATEGORY_LABELS,
  PLAN_TIER_LABELS,
  getPricingFeaturesForTier,
  type FeatureCategory,
} from "@/data/plans";

const CATEGORIES: FeatureCategory[] = [
  "core",
  "catalog",
  "sales",
  "reach",
  "operations",
  "support",
];

export default function FeatureGuide() {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-5 py-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <div className="flex items-center gap-2">
            <a href="/CatalogHQ-Features-and-Pricing.pdf" download>
              <Button variant="outline" size="sm" className="gap-2">
                <FileDown className="h-4 w-4" />
                Download PDF
              </Button>
            </a>
            <Button size="sm" className="gap-2 bg-whatsapp-green hover:bg-whatsapp-green/90" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <article className="max-w-4xl mx-auto px-5 py-10 sm:py-16 print:py-8">
        <header className="border-b border-gray-200 pb-8 mb-10">
          <p className="text-sm font-semibold text-whatsapp-green uppercase tracking-wide">
            CatalogHQ Nigeria
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            Features &amp; Pricing Guide
          </h1>
          <p className="text-lg text-gray-600 mt-3">
            Automate the messages you repeat every day. Built for Nigerian
            social sellers on WhatsApp, Instagram, Facebook, and X, plus
            first-time online vendors.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">The problem</h2>
          <p className="text-gray-600 leading-relaxed">
            Selling through DMs on social media means endless back-and-forth:
            price questions, transfer screenshots, stock checks, and missed sales
            while you sleep. CatalogHQ replaces that friction with one store
            link. Buyers see prices, pay via Paystack, and you fulfil the order.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pricing tiers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl border border-gray-200 p-5"
              >
                <p className="font-bold text-gray-900">{plan.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {plan.price}
                  <span className="text-sm font-normal text-gray-500">
                    /month
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{plan.tagline}</p>
              </div>
            ))}
          </div>
        </section>

        {PLANS.map((plan) => (
          <section key={plan.id} className="mb-10 break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {plan.name}: {plan.price}/month
            </h2>
            <ul className="space-y-2">
              {getPricingFeaturesForTier(plan.id).map((feature, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-whatsapp-green">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Full feature catalog
          </h2>
          {CATEGORIES.map((category) => {
            const items = FEATURES.filter((f) => f.category === category);
            if (!items.length) return null;
            return (
              <div key={category} className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">
                  {CATEGORY_LABELS[category]}
                </h3>
                <ul className="space-y-2">
                  {items.map((f) => (
                    <li key={f.id} className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">
                        {f.title}
                      </span>{" "}
                      {f.description}{" "}
                      <span className="text-whatsapp-dark text-xs font-medium uppercase">
                        ({PLAN_TIER_LABELS[f.tier]}
                        {f.comingSoon ? ", coming soon" : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="mb-10 rounded-xl bg-gray-50 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Roadmap</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>
              <strong>Phase 1:</strong> Storefront, Paystack checkout, orders,
              vendor notifications
            </li>
            <li>
              <strong>Phase 2:</strong> Inventory, analytics, flash sales, SMS
              reach, customer export
            </li>
            <li>
              <strong>Phase 3:</strong> Referrals, loyalty, abandoned cart,
              WhatsApp order confirmations
            </li>
          </ul>
        </section>

        <footer className="border-t border-gray-200 pt-6 text-sm text-gray-500">
          <p>One extra sale per month covers the entire Pro plan.</p>
          <p className="mt-1">© CatalogHQ Nigeria. Built for Nigerian sellers online.</p>
        </footer>
      </article>
      <SupportFab audience="customer" />
    </div>
  );
}
