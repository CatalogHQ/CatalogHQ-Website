import { motion } from "framer-motion";
import { MessageCircle, CreditCard, Clock, Package } from "lucide-react";

const problems = [
  {
    icon: MessageCircle,
    message: "How much is this one?",
    reply: "Repeated 40 times every single day",
  },
  {
    icon: CreditCard,
    message: "I sent the transfer, have you seen it?",
    reply: "Manual confirmation chaos, every order",
  },
  {
    icon: Clock,
    message: "Is this still available? I need it today.",
    reply: "Sale lost, they bought from another vendor while you were offline",
  },
  {
    icon: Package,
    message: "Which sizes do you have left?",
    reply: "No catalog means no clarity for buyers",
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
          className="text-center"
        >
          <p className="text-xs font-semibold text-whatsapp-green uppercase tracking-[0.08em]">
            THE PROBLEM
          </p>
          <h2 className="section-heading text-white mt-4">
            Running a business on WhatsApp is exhausting.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-8 sm:mt-12">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-whatsapp-chat rounded-2xl p-5 sm:p-6 w-full"
            >
              <problem.icon className="h-6 w-6 text-whatsapp-green" />
              <p className="text-white text-base font-medium mt-3 leading-relaxed">
                &ldquo;{problem.message}&rdquo;
              </p>
              <p className="text-gray-400 text-sm mt-2">{problem.reply}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-whatsapp-green font-semibold text-center mt-10 text-lg"
        >
          CatalogHQ fixes every one of these.
        </motion.p>
      </div>
    </section>
  );
}
