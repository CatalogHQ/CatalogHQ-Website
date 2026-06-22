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
    body: "Unread messages, fake transfer screenshots, and delivery updates. All on one phone.",
  },
  {
    id: "social",
    icon: Share2,
    title: "If you sell on Instagram, Facebook, or X",
    body: "Posts fade in 24 hours. DMs go cold. Your link-in-bio was never built to take payment.",
  },
  {
    id: "offline",
    icon: Store,
    title: "If you've never sold online",
    body: "Going digital sounds complicated. So you stay offline and buyers never find you.",
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
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="section-heading text-white">
            Why selling online in Nigeria is still broken
          </h2>
          <p className="mt-3 text-base text-gray-400 sm:text-lg">
            The buyers are there. The checkout is what breaks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
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

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="text-center mt-8 sm:mt-10 max-w-xl mx-auto text-white font-semibold text-lg sm:text-xl leading-snug"
        >
          Your store should close sales automatically. Right now it&apos;s
          costing you them.
        </motion.p>
      </div>
    </section>
  );
}
