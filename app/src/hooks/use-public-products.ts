import { useEffect, useState } from "react";
import { productRepository } from "@/lib/repositories";
import { hasFeature } from "@/data/plans";
import type { PlanTier } from "@/data/plans";
import type { Product } from "@/types/domain";

export function usePublicProducts(slug: string, planTier: PlanTier) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const listed = await productRepository.listPublishedBySlug(slug);
        const hideSoldOut = hasFeature(planTier, "advanced-inventory-tracking");
        const filtered = listed.filter(
          (product) => !hideSoldOut || product.stock > 0,
        );
        if (!cancelled) {
          setProducts(filtered);
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (slug) {
      void load();
    } else {
      setProducts([]);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug, planTier]);

  return { products, isLoading };
}
