import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Why not just use WhatsApp Business catalog?",
    answer:
      "Whether you use WhatsApp catalog, Instagram DMs, or Facebook posts, social selling still cannot take payment, cannot sell when you are offline, and has no inventory system. It is a display tool, nothing more. Your store on CatalogHQ has checkout, order tracking, reviews, and analytics all built in.",
  },
  {
    question: "Do my customers need to download an app?",
    answer:
      "No. Your customers tap your store link in any browser on any device. No downloads, no sign-up required from them. It works like any website.",
  },
  {
    question: "How does payment work for my customers?",
    answer:
      "Flutterwave handles all payments securely. Customers pay by bank transfer to a dedicated account. Payment is confirmed automatically before the order is accepted. You never need to chase a transfer again.",
  },
  {
    question: "What if I am not good with technology?",
    answer:
      "If you can post on social media, you can use CatalogHQ. Adding a product takes less than 2 minutes. Setup takes under 1 minute. No technical knowledge is needed at any point.",
  },
  {
    question: "I've never sold online. Can I still use CatalogHQ?",
    answer:
      "Yes. You do not need a website or any prior online store. Add your products, get your link, and share it on WhatsApp, Instagram, Facebook, or X. Your store can be live in under 1 minute.",
  },
  {
    question: "Can I start on a lower plan and upgrade later?",
    answer:
      "Yes. Start on Starter at ₦3,000/month and upgrade to Pro or Growth from Billing in your dashboard whenever your catalog or sales volume needs more room.",
  },
  {
    question: "What is the difference between Starter, Pro, and Growth?",
    answer:
      "Starter (₦3,000/month) includes your storefront, checkout, order management, buyer tracking, variants, and basic inventory for up to 15 products. Pro (₦5,000/month) adds up to 30 products, advanced inventory with auto-hide sold-out, low-stock alerts, verified reviews, sales analytics, and WhatsApp order confirmations. Growth (₦8,000/month) includes everything in Pro with up to 50 products.",
  },
  {
    question: "What if a social platform restricts my account?",
    answer:
      "Your store exists on CatalogHQ, not on any single platform. If Instagram, Facebook, or WhatsApp restricts your account, your catalog, customer records, orders, and payment history are all still safe and accessible. You own your business data completely.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="bg-gray-50 section-padding">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="section-heading text-gray-900 text-center mb-8 sm:mb-10"
        >
          Questions vendors always ask.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white border border-gray-200 rounded-xl px-4 sm:px-6 data-[state=open]:shadow-sm"
              >
                <AccordionTrigger className="text-sm sm:text-base font-semibold text-gray-900 py-3 sm:py-4 hover:no-underline text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-sm leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
