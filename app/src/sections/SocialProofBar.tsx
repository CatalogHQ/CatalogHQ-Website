import { motion } from "framer-motion";

export default function SocialProofBar() {
  return (
    <section id="social-proof" className="border-y border-gray-200/80 bg-gray-50 py-3.5">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8"
      >
        {/* <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 shadow-sm border border-gray-100">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-gray-900">4.9</span>
          </div>
          <p className="text-sm text-gray-600 max-w-xl text-pretty">
            Trusted by sellers across Lagos, Abuja, Port Harcourt, Kano and
            Nigeria
          </p>
        </div> */}
      </motion.div>
    </section>
  );
}
