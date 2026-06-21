import HeroFeedImage from "@/components/marketing/HeroFeedImage";

/** Hero slide dimensions — phone frame matches this exactly */
export const HERO_SLIDE_WIDTH = 600;
export const HERO_SLIDE_HEIGHT = 1100;

const FEED_SLIDES = [
  {
    src: "/images/hero-feed-slide-1.webp",
    alt: "Male Gucci Shirt, ₦30,000 on Amaka's Fashion Store",
  },
  {
    src: "/images/hero-feed-slide-2.webp",
    alt: "Female Satin Gown, ₦30,000 on Amaka's Fashion Store",
  },
  {
    src: "/images/hero-feed-slide-3.webp",
    alt: "Male Jeans, ₦25,000 on Amaka's Fashion Store",
  },
] as const;

export default function HeroFeedShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0f0f0f]">
      <div
        className="hero-feed-scroll-track flex h-[300%] flex-col"
        aria-hidden
      >
        {FEED_SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className="relative h-1/3 w-full shrink-0 overflow-hidden"
          >
            <HeroFeedImage
              src={slide.src}
              alt={slide.alt}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
