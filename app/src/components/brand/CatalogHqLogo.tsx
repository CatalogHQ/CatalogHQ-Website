import { cn } from "@/lib/utils";

export const CATALOGHQ_LOGO_SRC =
  "/images/cataloghq-logos/cataloghq-full-logo-no-bg_3_360x360.png";

type CatalogHqLogoProps = {
  className?: string;
  /** Visible height in CSS pixels (default variant only). */
  height?: number;
  alt?: string;
  /**
   * Full wordmark with canvas padding. Pass h-* and w-* for the visible area.
   * Width must be generous enough for the full cart + wordmark (see header usage).
   */
  variant?: "default" | "wordmark";
  /** White backing for dark sections (footer, auth panel, etc.). */
  onDark?: boolean;
};

export default function CatalogHqLogo({
  className,
  height = 36,
  alt = "CatalogHQ",
  variant = "default",
  onDark = false,
}: CatalogHqLogoProps) {
  const image =
    variant === "wordmark" ? (
      <span
        className={cn(
          "relative inline-block shrink-0 overflow-hidden",
          className,
        )}
      >
        <img
          src={CATALOGHQ_LOGO_SRC}
          alt={alt}
          className="absolute left-0 top-1/2 h-[480%] w-auto max-w-none -translate-y-1/2 object-contain object-left"
        />
      </span>
    ) : (
      <img
        src={CATALOGHQ_LOGO_SRC}
        alt={alt}
        className={cn("w-auto max-w-none object-contain", className)}
        style={{ height }}
      />
    );

  if (onDark) {
    return (
      <span className="inline-flex w-fit items-center rounded-xl bg-white px-3.5 py-2 shadow-sm">
        {image}
      </span>
    );
  }

  return image;
}
