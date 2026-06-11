import { cn } from "@/lib/utils";
import HeroFeedShowcase, {
  HERO_SLIDE_HEIGHT,
  HERO_SLIDE_WIDTH,
} from "@/components/marketing/HeroFeedShowcase";

/** iPhone 8 Plus frame — screen viewport matches hero slides exactly */
const FRAME = {
  outerRadiusMm: 4.5,
  screenRadiusMm: 2,
  /** Bezels scaled to slide size (600×1100) */
  topBezel: 88,
  bottomBezel: 132,
  sideBezel: 33,
} as const;

const OUTER_WIDTH = HERO_SLIDE_WIDTH + FRAME.sideBezel * 2;
const OUTER_HEIGHT =
  HERO_SLIDE_HEIGHT + FRAME.topBezel + FRAME.bottomBezel;

const screenInset = {
  left: `${(FRAME.sideBezel / OUTER_WIDTH) * 100}%`,
  top: `${(FRAME.topBezel / OUTER_HEIGHT) * 100}%`,
  width: `${(HERO_SLIDE_WIDTH / OUTER_WIDTH) * 100}%`,
  height: `${(HERO_SLIDE_HEIGHT / OUTER_HEIGHT) * 100}%`,
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
        "mx-auto flex w-fit flex-col items-center",
        className,
      )}
    >
      <div
        className="relative mx-auto h-[min(74vh,calc(100dvh-10rem))] w-auto shrink-0 select-none"
        style={{
          aspectRatio: `${OUTER_WIDTH} / ${OUTER_HEIGHT}`,
        }}
      >
        {/* Jet Black body */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#3a3a3c] via-[#1c1c1e] to-[#0a0a0a] shadow-2xl shadow-black/30 ring-1 ring-black/20"
          style={{ borderRadius: `${FRAME.outerRadiusMm}mm` }}
        />

        {/* Top speaker grille */}
        <div
          className="pointer-events-none absolute left-1/2 z-20 h-[0.55%] w-[18%] min-h-[2px] -translate-x-1/2 rounded-full bg-[#0a0a0a] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.08)]"
          style={{ top: `${(FRAME.topBezel / 2 / OUTER_HEIGHT) * 100}%` }}
          aria-hidden
        />

        {/* Front camera */}
        <div
          className="pointer-events-none absolute z-20 size-[1.1%] min-h-[3px] min-w-[3px] rounded-full bg-[#0a0a0a] ring-[0.04mm] ring-[#48484a]"
          style={{
            left: "62%",
            top: `${(FRAME.topBezel / 2 / OUTER_HEIGHT) * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
          aria-hidden
        />

        {/* Screen */}
        <div
          className="absolute overflow-hidden bg-black"
          style={{
            ...screenInset,
            borderRadius: `${FRAME.screenRadiusMm}mm`,
          }}
          role="img"
          aria-label="Animated preview of customers scrolling through products on Amaka's Fashion Store"
        >
          <HeroFeedShowcase />
        </div>

        {/* Home button */}
        <div
          className="pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 items-center justify-center"
          style={{
            bottom: `${(FRAME.bottomBezel / 2 / OUTER_HEIGHT) * 100}%`,
            width: "11%",
            height: `${(FRAME.bottomBezel * 0.42 / OUTER_HEIGHT) * 100}%`,
            transform: "translate(-50%, 50%)",
          }}
          aria-hidden
        >
          <div className="size-full rounded-full border-[0.35mm] border-[#48484a] bg-gradient-to-b from-[#3a3a3c] to-[#1c1c1e] shadow-[inset_0_0.5px_1px_rgba(255,255,255,0.12),inset_0_-0.5px_1px_rgba(0,0,0,0.4)]" />
        </div>

        {/* Mute switch */}
        <div
          className="absolute left-0 top-[14%] w-[0.55mm] rounded-l-sm bg-gradient-to-r from-[#0a0a0a] to-[#3a3a3c]"
          style={{ height: "4%" }}
          aria-hidden
        />
        {/* Volume up */}
        <div
          className="absolute left-0 top-[20%] w-[0.55mm] rounded-l-sm bg-gradient-to-r from-[#0a0a0a] to-[#3a3a3c]"
          style={{ height: "7.5%" }}
          aria-hidden
        />
        {/* Volume down */}
        <div
          className="absolute left-0 top-[29%] w-[0.55mm] rounded-l-sm bg-gradient-to-r from-[#0a0a0a] to-[#3a3a3c]"
          style={{ height: "7.5%" }}
          aria-hidden
        />
        {/* Power / sleep */}
        <div
          className="absolute right-0 top-[22%] w-[0.55mm] rounded-r-sm bg-gradient-to-l from-[#0a0a0a] to-[#3a3a3c]"
          style={{ height: "10%" }}
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
