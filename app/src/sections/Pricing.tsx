import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PLANS, getPricingFeaturesForTier } from "@/data/plans";

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="bg-white section-padding">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="section-heading text-gray-900">
            Simple, honest pricing.
          </h2>
          <p className="section-subheading">
            Plans from ₦3,000/month. Upgrade as your catalog grows.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {PLANS.map((plan, index) => {
            const features = getPricingFeaturesForTier(plan.id);
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className={
                  index === PLANS.length - 1 && PLANS.length % 2 === 1
                    ? "sm:col-span-2 sm:max-w-md sm:justify-self-center lg:col-span-1 lg:max-w-none"
                    : undefined
                }
              >
                <Card
                  className={`flex h-full flex-col rounded-2xl ${
                    isPopular
                      ? "border-2 border-whatsapp-green shadow-xl"
                      : "border-gray-200"
                  }`}
                >
                  <CardContent className="flex flex-1 flex-col p-5 sm:p-6 lg:p-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-bold text-gray-900">
                        {plan.name}
                      </p>
                      {isPopular && (
                        <Badge className="rounded-full bg-whatsapp-green px-2.5 py-0.5 text-xs font-medium text-white hover:bg-whatsapp-green">
                          Most Popular
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-baseline gap-x-1">
                      <span className="text-3xl font-bold text-gray-900 sm:text-4xl">
                        {plan.price}
                      </span>
                      <span className="text-sm font-normal text-gray-500 sm:text-base">
                        /month
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {plan.priceSubtext}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {plan.tagline}
                    </p>

                    <ul className="mt-5 flex-1 space-y-2 sm:mt-6 sm:space-y-2.5">
                      {features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className={`flex items-start gap-2 ${
                            feature.startsWith("Everything in")
                              ? "font-medium"
                              : ""
                          }`}
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp-green" />
                          <span
                            className={`text-sm leading-snug ${
                              feature.includes("(Coming soon)")
                                ? "text-gray-400"
                                : "text-gray-700"
                            }`}
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => navigate("/sign-up")}
                      variant={isPopular ? "default" : "outline"}
                      className={`mt-6 h-auto w-full rounded-lg py-3 font-semibold sm:mt-8 ${
                        isPopular
                          ? "bg-whatsapp-green text-white transition-all hover:scale-[1.02] hover:bg-whatsapp-green/90"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {plan.cta}
                    </Button>
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
