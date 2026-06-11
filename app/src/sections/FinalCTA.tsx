import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Store, Lock } from "lucide-react";

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section id="final-cta" className="bg-whatsapp-dark py-16 sm:py-24 lg:py-28">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <Store className="h-12 w-12 text-whatsapp-green mx-auto" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-4 sm:mt-6 text-balance"
        >
          Your store is one link away.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-whatsapp-light mt-3 sm:mt-4 opacity-90 text-pretty"
        >
          Join Nigerian social sellers and first-time online vendors who
          stopped chasing payments and started building a real business.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            onClick={() => navigate("/sign-up")}
            className="w-full sm:w-auto bg-whatsapp-green hover:bg-whatsapp-green/90 text-white text-base sm:text-lg font-semibold px-8 py-3.5 rounded-xl shadow-lg mt-6 sm:mt-8 inline-flex items-center justify-center gap-2 h-auto transition-all hover:scale-[1.02]"
          >
            Create your store now
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center gap-2 text-xs sm:text-sm text-whatsapp-light opacity-70 mt-4 px-2"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Plans from ₦3,000/month. Ready in 3 minutes.</span>
        </motion.div>
      </div>
    </section>
  );
}
