import { cn } from "@/lib/utils";
import HeroFeedShowcase, {
  HERO_SLIDE_HEIGHT,
  HERO_SLIDE_WIDTH,
} from "@/components/marketing/HeroFeedShowcase";

/** Frame styled like iPhone 17 Pro Max; outer aspect matches hero slides (555×964) */
const FRAME = {
  outerRadiusMm: 14,
  screenRadiusMm: 11.5,
  rimPct: 0.8,
} as const;

type HeroStorefrontPreviewProps = {
  className?: string;
  /** Hide caption (shown elsewhere in hero on mobile) */
  compactCaption?: boolean;
};

export default function HeroStorefrontPreview({
  className,
  compactCaption = false,
}: HeroStorefrontPreviewProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-full flex-col items-center",
        className,
      )}
    >
      <div
        className={cn(
          "relative mx-auto select-none",
          /* Mobile: cap height so hero fits one screen; desktop: full mm width */
          "max-h-[min(52vh,28rem)] w-auto max-w-[min(280px,calc(100vw-2.5rem))]",
          "sm:max-h-[min(58vh,32rem)] sm:max-w-[min(300px,calc(100vw-3rem))]",
          "lg:h-[min(72vh,calc(100dvh-10rem))] lg:w-auto lg:max-h-none lg:max-w-none",
        )}
        style={{
          aspectRatio: `${HERO_SLIDE_WIDTH} / ${HERO_SLIDE_HEIGHT}`,
        }}
      >
        {/* Titanium frame */}
        <div
          className="relative h-full w-full bg-gradient-to-b from-[#b8b8bd] via-[#8e8e93] to-[#5a5a5e] shadow-[0_8mm_16mm_-4mm_rgba(0,0,0,0.45),0_0_0_0.05mm_rgba(255,255,255,0.08)_inset]"
          style={{
            borderRadius: `${FRAME.outerRadiusMm}mm`,
            padding: `${FRAME.rimPct}%`,
          }}
        >
          <div
            className="relative h-full w-full overflow-hidden bg-black"
            style={{ borderRadius: `${FRAME.screenRadiusMm}mm` }}
            role="img"
            aria-label="Animated preview of customers scrolling through products on Amaka's Fashion Store"
          >
            <HeroFeedShowcase />

            <div
              className="pointer-events-none absolute left-1/2 top-[1.8%] z-20 h-[3.6%] w-[26%] min-h-[7px] -translate-x-1/2 rounded-full bg-black shadow-[0_0_0_0.04mm_rgba(255,255,255,0.06)_inset]"
              aria-hidden
            />
          </div>
        </div>

        <div
          className="absolute -left-[0.5mm] top-[17%] w-[0.7mm] rounded-l-sm bg-gradient-to-r from-[#6e6e73] to-[#8e8e93]"
          style={{ height: "8.2%" }}
          aria-hidden
        />
        <div
          className="absolute -left-[0.5mm] top-[28.5%] w-[0.7mm] rounded-l-sm bg-gradient-to-r from-[#6e6e73] to-[#8e8e93]"
          style={{ height: "5.4%" }}
          aria-hidden
        />
        <div
          className="absolute -left-[0.5mm] top-[35.5%] w-[0.7mm] rounded-l-sm bg-gradient-to-r from-[#6e6e73] to-[#8e8e93]"
          style={{ height: "5.4%" }}
          aria-hidden
        />
        <div
          className="absolute -right-[0.5mm] top-[31%] w-[0.7mm] rounded-r-sm bg-gradient-to-l from-[#6e6e73] to-[#8e8e93]"
          style={{ height: "11.5%" }}
          aria-hidden
        />
      </div>

      {!compactCaption && (
        <p className="mt-4 text-center text-xs text-gray-500">
          Customers browse and buy from your store link
        </p>
      )}
    </div>
  );
}
