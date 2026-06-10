import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import HeroStorefrontPreview from "@/components/marketing/HeroStorefrontPreview";
import { ShieldCheck } from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-white pt-6 pb-14 sm:pt-10 sm:pb-20 lg:flex lg:min-h-[calc(100dvh-4rem)] lg:flex-col lg:justify-center lg:py-12 xl:py-16"
    >
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-whatsapp-green/10 blur-3xl lg:h-96 lg:w-96" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-whatsapp-dark/5 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* 1. Store preview — first on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white px-3 pt-4 pb-2 sm:max-w-md lg:max-w-none lg:border-0 lg:bg-transparent lg:p-0">
              <HeroStorefrontPreview compactCaption />
              <p className="mt-2 text-center text-xs leading-relaxed text-gray-500 lg:hidden">
                Customers can browse and buy from your store link
              </p>
            </div>
          </motion.div>

          {/* 2. Headline + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: [0, 0, 0.2, 1] }}
            className="order-2 -mt-1 flex flex-col items-center text-center sm:mt-0 lg:order-1 lg:items-start lg:text-left"
          >
            {/* <Badge
              variant="outline"
              className="mb-3 border-whatsapp-green text-whatsapp-green rounded-full px-3 py-1 text-xs font-medium sm:mb-4"
            >
              Built for Nigerian vendors
            </Badge> */}

            <h1 className="max-w-[28ch] text-[1.325rem] font-extrabold leading-[1.2] tracking-tight text-balance text-gray-900 sm:max-w-none sm:text-4xl sm:leading-[1.15] lg:text-6xl xl:text-7xl">
              Turn your <span className="text-whatsapp-green">WhatsApp</span> business into a real online store
         
            </h1>
       

            <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-pretty text-gray-500 sm:mt-4 sm:text-lg lg:max-w-lg">
              Instantly get a store link, seamless checkout, offline sales, and more.
         
         
            </p>

            <div className="mt-5 flex w-full max-w-sm flex-col gap-2.5 sm:mt-6 sm:gap-3 lg:max-w-xs">
              <Button
                onClick={() => navigate("/sign-up")}
                className="h-12 w-full rounded-xl bg-whatsapp-green text-base font-semibold text-white shadow-lg hover:bg-whatsapp-green/90 sm:h-auto sm:py-3.5"
              >
                Create my free store
              </Button>
              {/* <Button
                onClick={() => handleScroll("#how-it-works")}
                variant="outline"
                className="h-12 w-full rounded-xl border-gray-300 text-base font-semibold text-gray-700 hover:bg-gray-50 sm:h-auto sm:py-3.5"
              >
                See how it works
              </Button> */}
            </div>

            <p className="mt-4 flex max-w-xs items-start justify-center gap-2 text-left text-xs leading-relaxed text-gray-500 sm:max-w-sm sm:text-sm lg:justify-start">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <span>Free forever plan available.</span>
            </p>

            <p className="mt-5 hidden text-xs text-gray-500 lg:block">
              Customers can browse and buy from your store link
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
