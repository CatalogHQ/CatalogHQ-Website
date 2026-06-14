import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImageSwipeGalleryProps = {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
  showDots?: boolean;
  dotsClassName?: string;
  dotVariant?: "light" | "dark";
};

export default function ProductImageSwipeGallery({
  images,
  alt,
  className,
  imageClassName,
  selectedIndex,
  onIndexChange,
  showDots = true,
  dotsClassName,
  dotVariant = "light",
}: ProductImageSwipeGalleryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    axis: "x",
    containScroll: "trimSnaps",
  });
  const [activeIndex, setActiveIndex] = useState(selectedIndex ?? 0);

  const handleSelect = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    setActiveIndex(index);
    onIndexChange?.(index);
  }, [emblaApi, onIndexChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", handleSelect);
    handleSelect();
    return () => {
      emblaApi.off("select", handleSelect);
    };
  }, [emblaApi, handleSelect]);

  useEffect(() => {
    if (!emblaApi || selectedIndex === undefined) return;
    if (emblaApi.selectedScrollSnap() !== selectedIndex) {
      emblaApi.scrollTo(selectedIndex);
    }
  }, [emblaApi, selectedIndex]);

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gray-100",
          className,
        )}
      >
        <ShoppingBag className="h-12 w-12 text-gray-300 sm:h-16 sm:w-16" />
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className={cn("h-full w-full", className)}>
        <img
          src={images[0]}
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full touch-pan-y">
          {images.map((image, index) => (
            <div
              key={`${index}-${image.slice(0, 32)}`}
              className="h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={image}
                alt={`${alt} ${index + 1}`}
                className={cn("h-full w-full object-cover", imageClassName)}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {showDots && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-3 flex justify-center gap-1.5 px-4 sm:top-4",
            dotsClassName,
          )}
          aria-hidden="true"
        >
          {images.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex
                  ? dotVariant === "dark"
                    ? "w-4 bg-gray-900"
                    : "w-4 bg-white"
                  : dotVariant === "dark"
                    ? "w-1.5 bg-gray-900/35"
                    : "w-1.5 bg-white/45",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
