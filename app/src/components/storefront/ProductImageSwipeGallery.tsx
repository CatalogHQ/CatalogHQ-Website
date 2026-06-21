import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

function ProductImage({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
}: ProductImageProps & { imageClassName?: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full bg-gray-900", className)}>
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-300",
          imageClassName,
          loaded ? "opacity-100" : "opacity-0",
        )}
        draggable={false}
      />
    </div>
  );
}

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
      <ProductImage
        src={images[0]}
        alt={alt}
        className={className}
        imageClassName={imageClassName}
        priority
      />
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
              <ProductImage
                src={image}
                alt={`${alt} ${index + 1}`}
                imageClassName={imageClassName}
                priority={index === 0}
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
