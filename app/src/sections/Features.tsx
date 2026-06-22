import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Moon,
  Package,
  Megaphone,
  Star,
  Timer,
  Link2,
  LayoutDashboard,
  Truck,
  Tag,
  ClipboardList,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { getLandingFeatures } from "@/data/plans";

const ICON_MAP: Record<string, LucideIcon> = {
  "flutterwave-checkout": ShoppingCart,
  "sell-offline": Moon,
  "inventory-tracking": Package,
  "customer-export": Megaphone,
  "verified-reviews": Star,
  "flash-sales": Timer,
  "referral-links": Link2,
  "analytics-dashboard": LayoutDashboard,
  "product-variants": Package,
  "delivery-fees": Truck,
  "discount-codes": Tag,
  "order-status-page": ClipboardList,
  "storefront-link": Link2,
  "nin-verified-vendors": ShieldCheck,
  "abandoned-cart": RotateCcw,
};

export default function Features() {
  const features = getLandingFeatures();

  return (
    <section id="features" className="bg-gray-50 section-padding">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="section-heading text-gray-900 max-w-2xl mx-auto">
            Every question you answer in DMs every day? Your store answers it
            automatically.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {features.map((feature, index) => {
            const Icon = ICON_MAP[feature.id] ?? Package;

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <Card className="border-gray-200 rounded-xl hover:shadow-md hover:border-whatsapp-green/50 transition-all h-full bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-2 flex-wrap justify-end">
                      <Icon className="h-6 w-6 text-whatsapp-green flex-shrink-0" />
                      <div className="flex flex-wrap gap-1 justify-end">
                        {feature.comingSoon && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0 border-amber-300 text-amber-700 bg-amber-50"
                          >
                            Coming soon
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mt-4">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
