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
    body: "You wake up to dozens of unread messages. Buyers wait, lose interest, and buy elsewhere. You are running customer service, payments, and delivery on one phone.",
  },
  {
    id: "social",
    icon: Share2,
    title: "If you sell on Instagram, Facebook, X, or TikTok",
    body: 'Your best posts disappear in 24 hours. "Price?" comments go cold. Link-in-bio was never built to take an order, and in-app checkout still is not available to Nigerian sellers.',
  },
  {
    id: "offline",
    icon: Store,
    title: "If you have never sold online",
    body: "People tell you to go digital, but every platform feels too complex. So you stay offline and miss customers who never knew you existed.",
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
          <p className="text-xs font-semibold text-whatsapp-green uppercase tracking-[0.08em]">
            THE PROBLEM
          </p>
          <h2 className="section-heading text-white mt-4">
            Millions of Nigerians are selling every day on platforms that were
            never built for selling.
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
            People want what you sell. Then the process gets in the way: repeated
            questions, manual transfers, slow replies, buyers who cannot find you
            when they are ready to spend. Today&apos;s buyers are cautious; a bad
            experience means they may not come back.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="text-center mt-8 sm:mt-10 max-w-2xl mx-auto space-y-3"
        >
          <p className="text-white font-semibold text-lg sm:text-xl leading-snug">
            Your store should work for you. Right now it is working against you.
          </p>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
            CatalogHQ gives you one link with your catalog, prices, stock, and
            Paystack checkout, whether you sell on WhatsApp, social media, or you
            are going online for the first time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
