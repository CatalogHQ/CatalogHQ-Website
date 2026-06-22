import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section id="final-cta" className="bg-whatsapp-dark py-16 sm:py-24 lg:py-28">
      <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-3 sm:space-y-4"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-balance">
            Your products deserve a real storefront.
          </h2>
          <p className="text-base sm:text-lg text-whatsapp-light opacity-90 text-pretty">
            Stop losing sales to slow replies and fake transfer screenshots.
          </p>
          <p className="text-sm sm:text-base text-whatsapp-light opacity-70">
            Plans from ₦3,000/month. Up and running in 60 seconds.
          </p>
        </motion.div>

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
            Start for free →
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
