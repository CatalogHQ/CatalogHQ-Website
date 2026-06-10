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
      "WhatsApp Business catalog cannot take payment, cannot sell when you are offline, and has no inventory system. It is a product display tool, nothing more. Your store on ShopEase has checkout, order tracking, reviews, and analytics all built in.",
  },
  {
    question: "Do my customers need to download an app?",
    answer:
      "No. Your customers tap your store link in any browser on any device. No downloads, no sign-up required from them. It works like any website.",
  },
  {
    question: "How does payment work for my customers?",
    answer:
      "Paystack handles all payments securely. Customers can pay by card, bank transfer, or USSD. Payment is confirmed instantly before the order is accepted. You never need to chase a transfer again.",
  },
  {
    question: "What if I am not good with technology?",
    answer:
      "If you can post on WhatsApp, you can use ShopEase. Adding a product takes less than 2 minutes. Setup takes under 3 minutes. No technical knowledge is needed at any point.",
  },
  {
    question: "Can I try it before paying?",
    answer:
      "Yes. Starter is completely free with no time limit — no credit card needed. When you are ready to grow, upgrade to Pro from your dashboard.",
  },
  {
    question: "What is the difference between Starter and Pro?",
    answer:
      "Starter includes your storefront, checkout, order management, buyer tracking, variants, and basic inventory for up to 5 products. Pro adds up to 30 products, advanced inventory with auto-hide sold-out, low-stock alerts, verified reviews, sales analytics, and WhatsApp order confirmations.",
  },
  {
    question: "What if WhatsApp restricts or bans my account?",
    answer:
      "Your store exists on ShopEase, not on WhatsApp. If Meta restricts your account, your catalog, your customer records, your orders, and your payment history are all still safe and accessible. You own your business data completely.",
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
          Questions sellers always ask.
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
