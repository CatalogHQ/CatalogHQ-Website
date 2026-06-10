import { useEffect, useState } from "react";
import { storeRepository } from "@/lib/repositories";
import type { PublicStoreView } from "@/types/domain";

export function usePublicStore(slug: string) {
  const [store, setStore] = useState<PublicStoreView | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await storeRepository.getPublicBySlug(slug);
        if (!cancelled) {
          setStore(result);
        }
      } catch {
        if (!cancelled) {
          setStore(null);
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
      setStore(null);
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { store, isLoading };
}
