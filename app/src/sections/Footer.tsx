import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { MapPin } from "lucide-react";

const footerLinks = [
  { label: "About", href: "#" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Twitter", href: "#" },
];

export default function Footer() {
  const handleNavClick = (href: string) => {
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4 }}
      className="bg-whatsapp-bg py-12 px-5 sm:px-6"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center md:text-left">
          {/* Left: Logo + Tagline */}
          <div>
            <p className="text-xl font-bold text-white">ShopEase</p>
            <p className="text-sm text-gray-400 mt-2">
              Built for Nigerian vendors.
            </p>
          </div>

          {/* Center: Links */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 justify-items-center sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 md:justify-center">
            {footerLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right: Location */}
          <div className="flex items-center justify-center gap-1 md:justify-end">
            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
            <span className="text-sm text-gray-400">Made in Nigeria</span>
          </div>
        </div>

        <Separator className="my-8 bg-white/10" />

        <p className="text-xs text-gray-500 text-center">
          &copy; 2025 ShopEase Nigeria. All rights reserved.
        </p>
      </div>
    </motion.footer>
  );
}
