import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  orderRepository,
  productRepository,
  storeRepository,
} from "@/lib/repositories";
import { useAuth } from "@/contexts/AuthContext";
import { isSubscriptionBlocked } from "@/lib/api-error";
import type { Product, ProductInput, Store, StoreSetupInput } from "@/types/domain";
import type { CustomerOrder, OrderStatus } from "@/types/orders";

type VendorContextValue = {
  store: Store | null;
  products: Product[];
  orders: CustomerOrder[];
  unreadOrderCount: number;
  isLoading: boolean;
  refreshStore: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  saveStoreDraft: (input: StoreSetupInput) => Promise<Store>;
  completeSetup: (input: StoreSetupInput) => Promise<Store>;
  isSlugAvailable: (slug: string) => Promise<boolean>;
  createProduct: (input: ProductInput) => Promise<Product>;
  updateProduct: (productId: string, input: ProductInput) => Promise<Product>;
  deleteProduct: (productId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<CustomerOrder>;
  markOrdersSeen: () => Promise<void>;
  decrementProductStock: (productId: string, quantity: number) => Promise<Product>;
};

const VendorContext = createContext<VendorContextValue | null>(null);

export function VendorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [unreadOrderCount, setUnreadOrderCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStore = useCallback(async () => {
    if (!user) {
      setStore(null);
      return;
    }

    const nextStore = storeRepository.getMyStore
      ? await storeRepository.getMyStore()
      : await storeRepository.getByVendorId(user.id);
    setStore(nextStore);
  }, [user]);

  const refreshProducts = useCallback(async () => {
    if (!user) {
      setProducts([]);
      return;
    }
    setProducts(await productRepository.listByStoreId(user.id));
  }, [user]);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setUnreadOrderCount(0);
      return;
    }
    setOrders(await orderRepository.listByStoreId(user.id));
    setUnreadOrderCount(await orderRepository.getUnreadCount(user.id));
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user) {
        setStore(null);
        setProducts([]);
        setOrders([]);
        setUnreadOrderCount(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const nextStore = storeRepository.getMyStore
          ? await storeRepository.getMyStore()
          : await storeRepository.getByVendorId(user.id);

        if (cancelled) return;

        setStore(nextStore);

        try {
          setProducts(await productRepository.listByStoreId(user.id));
          setOrders(await orderRepository.listByStoreId(user.id));
          setUnreadOrderCount(await orderRepository.getUnreadCount(user.id));
        } catch (error) {
          if (!isSubscriptionBlocked(error)) {
            throw error;
          }
          setProducts([]);
          setOrders([]);
          setUnreadOrderCount(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveStoreDraft = useCallback(
    async (input: StoreSetupInput) => {
      if (!user) throw new Error("Not authenticated.");
      const saved = await storeRepository.save(user.id, input);
      setStore(saved);
      return saved;
    },
    [user],
  );

  const completeSetup = useCallback(
    async (input: StoreSetupInput) => {
      if (!user) throw new Error("Not authenticated.");
      const saved = await storeRepository.completeSetup(user.id, input);
      setStore(saved);
      return saved;
    },
    [user],
  );

  const isSlugAvailable = useCallback(
    async (slug: string) => {
      if (!user) return false;
      const taken = await storeRepository.isSlugTaken(slug, user.id);
      return !taken;
    },
    [user],
  );

  const createProduct = useCallback(
    async (input: ProductInput) => {
      if (!user) throw new Error("Not authenticated.");
      const created = await productRepository.create(user.id, input);
      await refreshProducts();
      return created;
    },
    [user, refreshProducts],
  );

  const updateProduct = useCallback(
    async (productId: string, input: ProductInput) => {
      if (!user) throw new Error("Not authenticated.");
      const updated = await productRepository.update(user.id, productId, input);
      await refreshProducts();
      return updated;
    },
    [user, refreshProducts],
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      if (!user) throw new Error("Not authenticated.");
      await productRepository.remove(user.id, productId);
      await refreshProducts();
    },
    [user, refreshProducts],
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (!user) throw new Error("Not authenticated.");
      const updated = await orderRepository.updateStatus(orderId, status);
      await refreshOrders();
      return updated;
    },
    [user, refreshOrders],
  );

  const markOrdersSeen = useCallback(async () => {
    if (!user) return;
    await orderRepository.markAllSeen(user.id);
    await refreshOrders();
  }, [user, refreshOrders]);

  const decrementProductStock = useCallback(
    async (productId: string, quantity: number) => {
      if (!user) throw new Error("Not authenticated.");
      const updated = await productRepository.decrementStock(
        user.id,
        productId,
        quantity,
      );
      await refreshProducts();
      return updated;
    },
    [user, refreshProducts],
  );

  const value = useMemo(
    () => ({
      store,
      products,
      orders,
      unreadOrderCount,
      isLoading,
      refreshStore,
      refreshProducts,
      refreshOrders,
      saveStoreDraft,
      completeSetup,
      isSlugAvailable,
      createProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      markOrdersSeen,
      decrementProductStock,
    }),
    [
      store,
      products,
      orders,
      unreadOrderCount,
      isLoading,
      refreshStore,
      refreshProducts,
      refreshOrders,
      saveStoreDraft,
      completeSetup,
      isSlugAvailable,
      createProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      markOrdersSeen,
      decrementProductStock,
    ],
  );

  return (
    <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
  );
}

export function useVendor() {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error("useVendor must be used within VendorProvider.");
  }
  return context;
}
