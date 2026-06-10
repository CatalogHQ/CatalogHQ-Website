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
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
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
            Start free. Upgrade when you are ready to grow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mt-8 sm:mt-12">
          {PLANS.map((plan, index) => {
            const features = getPricingFeaturesForTier(plan.id);
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={`rounded-2xl h-full ${
                    isPopular
                      ? "border-2 border-whatsapp-green shadow-xl"
                      : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-gray-900">
                        {plan.name}
                      </p>
                      {isPopular && (
                        <Badge className="bg-whatsapp-green text-white text-xs px-2.5 py-0.5 rounded-full font-medium hover:bg-whatsapp-green">
                          Most Popular
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-baseline mt-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price}
                      </span>
                      {plan.price !== "Free" && (
                        <span className="text-base font-normal text-gray-500 ml-1">
                          /month
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.priceSubtext}
                    </p>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                      {plan.tagline}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className={`flex items-start gap-2 ${
                            feature.startsWith("Everything in")
                              ? "font-medium"
                              : featureIndex > 0 &&
                                  features[0]?.startsWith("Everything in")
                                ? "pl-0"
                                : ""
                          }`}
                        >
                          <Check className="h-4 w-4 text-whatsapp-green flex-shrink-0 mt-0.5" />
                          <span
                            className={`text-sm ${
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
                      className={`w-full mt-8 font-semibold py-3 h-auto rounded-lg ${
                        isPopular
                          ? "bg-whatsapp-green hover:bg-whatsapp-green/90 text-white transition-all hover:scale-[1.02]"
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center gap-4 mt-6 sm:mt-8"
        >
          
        </motion.div>
      </div>
    </section>
  );
}
