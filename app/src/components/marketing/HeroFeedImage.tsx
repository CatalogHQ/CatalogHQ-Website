import { useState } from "react";
import { cn } from "@/lib/utils";

type HeroFeedImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
};

export default function HeroFeedImage({
  src,
  alt,
  priority = false,
}: HeroFeedImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      width={600}
      height={1100}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        "block h-full w-full object-contain object-top transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
      )}
      draggable={false}
    />
  );
}
