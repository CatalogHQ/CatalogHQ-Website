import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import CatalogHqLogo from "@/components/brand/CatalogHqLogo";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToSignUp = () => {
    setOpen(false);
    navigate("/sign-up");
  };

  const goToSignIn = () => {
    setOpen(false);
    navigate("/sign-in");
  };

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className={cn(
              "flex shrink-0 items-center transition-opacity hover:opacity-80",
              open && "max-lg:invisible",
            )}
          >
            <CatalogHqLogo
              variant="wordmark"
              className="h-9 w-[172px] sm:h-10 sm:w-[188px]"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={goToSignIn}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </button>
            <Button
              onClick={goToSignUp}
              className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-all hover:scale-[1.02]"
            >
              Create my store
            </Button>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button className="text-gray-600 p-2">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[280px] p-0"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                  <CatalogHqLogo variant="wordmark" className="h-9 w-[172px]" />
                  <SheetClose className="rounded-sm p-1 text-gray-500 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                  </SheetClose>
                </div>
                <div className="flex-1 py-4">
                  {navLinks.map((link) => (
                    <button
                      key={link.href}
                      onClick={() => handleNavClick(link.href)}
                      className="block w-full text-left text-lg font-medium text-gray-700 py-3 px-6 hover:bg-gray-50 transition-colors border-b border-gray-50"
                    >
                      {link.label}
                    </button>
                  ))}
                  <button
                    onClick={goToSignIn}
                    className="block w-full text-left text-lg font-medium text-gray-700 py-3 px-6 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    Sign in
                  </button>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <Button
                    onClick={goToSignUp}
                    className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90 text-white font-semibold py-3 rounded-lg"
                  >
                    Create my store
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
