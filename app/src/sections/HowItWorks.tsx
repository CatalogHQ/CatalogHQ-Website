import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Share2, BadgeCheck } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Sign up and add your products",
    description:
      "Upload photos, set prices, and write descriptions. Your store is ready in minutes.",
  },
  {
    number: "2",
    icon: Share2,
    title: "Share your link everywhere",
    description:
      "Paste your store link in your WhatsApp bio, Status, or broadcasts. Anyone with a browser can visit.",
  },
  {
    number: "3",
    icon: BadgeCheck,
    title: "Customers order and pay automatically",
    description:
      "Paystack handles checkout. You get notified. You just fulfil the order.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white section-padding">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <h2 className="section-heading text-gray-900">
            Up and running in under 3 minutes
          </h2>
          <p className="section-subheading">
            Three simple steps to transform your WhatsApp business
          </p>
        </motion.div>

        <div className="relative mt-10 sm:mt-16">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-gray-200" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.4, delay: index * 0.15 }}
              >
                <Card className="border-gray-200 rounded-xl hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-10 h-10 rounded-full bg-whatsapp-green text-white flex items-center justify-center font-bold text-lg mx-auto">
                      {step.number}
                    </div>
                    <step.icon className="h-6 w-6 text-gray-700 mx-auto mt-6" />
                    <h3 className="text-lg font-semibold text-gray-900 mt-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
