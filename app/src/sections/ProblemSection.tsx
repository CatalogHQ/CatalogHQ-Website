import { motion } from "framer-motion";
import { MessageCircle, Share2, Store, type LucideIcon } from "lucide-react";

type VendorUseCase = {
  id: string;
  icon: LucideIcon;
  title: string;
  body: string;
};

const VENDOR_USE_CASES: VendorUseCase[] = [
  {
    id: "whatsapp",
    icon: MessageCircle,
    title: "If you sell on WhatsApp",
    body: 'You wake up to 40 unread messages. Half are "how much?" The other half are buyers who already moved on. You\'re doing customer service, chasing transfers, and managing delivery, all on one phone, all by yourself.',
  },
  {
    id: "social",
    icon: Share2,
    title: "If you sell on Instagram, Facebook, or X",
    body: 'You post a fire photo, the comments blow up, then it dies in 24 hours. "Price?" goes unanswered. Someone DMs you at 2am, you reply at 9am, they\'ve already bought from someone else. Your link-in-bio was never built to close a sale. In-app checkout? Still not available in Nigeria.',
  },
  {
    id: "offline",
    icon: Store,
    title: "If you've never sold online",
    body: 'Everyone tells you to "go digital" but nobody explains how without a developer, a payment gateway, a business registration, and three weeks to figure it out. So you keep selling in person and miss every customer who searched for what you sell and found someone else.',
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="bg-whatsapp-bg section-padding">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="section-heading text-white">
            Why selling online in Nigeria is still broken
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {VENDOR_USE_CASES.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-whatsapp-chat rounded-2xl p-5 sm:p-6 w-full h-full"
            >
              <useCase.icon className="h-6 w-6 text-whatsapp-green" />
              <h3 className="text-white text-base font-semibold mt-3 leading-snug">
                {useCase.title}
              </h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                {useCase.body}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="mt-6 sm:mt-8 rounded-2xl border border-white/10 bg-whatsapp-dark/40 p-5 sm:p-8 max-w-4xl mx-auto"
        >
          <p className="text-xs font-semibold text-whatsapp-green uppercase tracking-[0.08em]">
            What all three have in common
          </p>
          <p className="text-white text-base sm:text-lg mt-3 leading-relaxed">
            The buyers are there. The money is there. But the moment someone is
            ready to pay, the process breaks. They&apos;re waiting for a reply,
            hunting for your account number, or wondering if you&apos;re legit.
            You lose the sale not because your product is wrong, but because the
            experience around it is exhausting.
          </p>
          <p className="text-white text-base sm:text-lg mt-4 leading-relaxed">
            Nigerian buyers in 2026 have options. A bad checkout doesn&apos;t
            just lose one sale. It loses that customer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="text-center mt-8 sm:mt-10 max-w-2xl mx-auto"
        >
          <p className="text-white font-semibold text-lg sm:text-xl leading-snug">
            Your store should close sales automatically. Right now it&apos;s
            costing you them.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
