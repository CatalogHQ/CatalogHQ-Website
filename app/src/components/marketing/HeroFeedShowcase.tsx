/** Hero slide PNG dimensions — phone frame matches this exactly */
export const HERO_SLIDE_WIDTH = 600;
export const HERO_SLIDE_HEIGHT = 1100;

const FEED_SLIDES = [
  {
    src: "/images/hero-feed-slide-1.png",
    alt: "Male Gucci Shirt, ₦30,000 on Amaka's Fashion Store",
  },
  {
    src: "/images/hero-feed-slide-2.png",
    alt: "Female Satin Gown, ₦30,000 on Amaka's Fashion Store",
  },
  {
    src: "/images/hero-feed-slide-3.png",
    alt: "Male Jeans, ₦25,000 on Amaka's Fashion Store",
  },
] as const;

export default function HeroFeedShowcase() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <div
        className="hero-feed-scroll-track flex h-[300%] flex-col"
        aria-hidden
      >
        {FEED_SLIDES.map((slide) => (
          <div
            key={slide.src}
            className="relative h-1/3 w-full shrink-0 overflow-hidden"
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="block h-full w-full object-contain object-top"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
