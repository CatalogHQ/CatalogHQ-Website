import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import HeroStorefrontPreview from "@/components/marketing/HeroStorefrontPreview";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-white pt-6 pb-14 sm:pt-10 sm:pb-20 lg:flex lg:min-h-[calc(100dvh-4rem)] lg:flex-col lg:justify-center lg:py-12 xl:py-16"
    >
      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
            className="order-1 flex justify-center bg-transparent lg:order-2"
          >
            <HeroStorefrontPreview compactCaption />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0, 0, 0.2, 1] }}
            className="order-2 flex flex-col items-center text-center sm:mt-0 lg:order-1 lg:items-start lg:text-left"
          >
            <h1 className="max-w-[16ch] text-[1.5rem] font-extrabold leading-[1.15] tracking-tight text-balance text-gray-900 sm:max-w-lg sm:text-4xl lg:max-w-none lg:text-6xl xl:text-7xl">
              Sell with one{" "}
              <span className="text-whatsapp-green">shareable store link</span>
            </h1>

            <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-gray-500 sm:mt-4 sm:max-w-sm sm:text-lg">
              WhatsApp, Instagram, Facebook, or your first shop online.
            </p>

            <div className="mt-5 flex w-full max-w-sm flex-col gap-2 sm:mt-6 lg:max-w-xs">
              <Button
                onClick={() => navigate("/sign-up")}
                className="h-12 w-full rounded-xl bg-whatsapp-green text-base font-semibold text-white shadow-lg hover:bg-whatsapp-green/90 sm:h-auto sm:py-3.5"
              >
                Create my store
              </Button>
              <p className="text-center text-xs text-gray-500 lg:text-left">
                From ₦3,000/month
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
