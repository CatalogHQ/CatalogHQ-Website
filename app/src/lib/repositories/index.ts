import { isApiMode } from "@/lib/use-api";
import { apiAdminRepository } from "@/lib/repositories/api-admin-repository";
import { apiTicketRepository } from "@/lib/repositories/api-ticket-repository";
import { localTicketRepository } from "@/lib/repositories/local-ticket-repository";
import { apiAuthRepository } from "@/lib/repositories/api-auth-repository";
import { apiOrderRepository } from "@/lib/repositories/api-order-repository";
import { apiProductRepository } from "@/lib/repositories/api-product-repository";
import { apiReviewRepository } from "@/lib/repositories/api-review-repository";
import { apiStoreRepository } from "@/lib/repositories/api-store-repository";
import { apiPayoutRepository } from "@/lib/repositories/api-payout-repository";
import { localPayoutRepository } from "@/lib/repositories/local-payout-repository";
import { localAdminRepository } from "@/lib/repositories/local-admin-repository";
import { authRepository as localAuthRepository } from "@/lib/repositories/local-auth-repository";
import { orderRepository as localOrderRepository } from "@/lib/repositories/local-order-repository";
import { productRepository as localProductRepository } from "@/lib/repositories/local-product-repository";
import { reviewRepository as localReviewRepository } from "@/lib/repositories/local-review-repository";
import { storeRepository as localStoreRepository } from "@/lib/repositories/local-store-repository";

const useApi = isApiMode();

export const authRepository = useApi ? apiAuthRepository : localAuthRepository;
export const storeRepository = useApi ? apiStoreRepository : localStoreRepository;
export const productRepository = useApi
  ? apiProductRepository
  : localProductRepository;
export const orderRepository = useApi ? apiOrderRepository : localOrderRepository;
export const reviewRepository = useApi
  ? apiReviewRepository
  : localReviewRepository;
export const adminRepository = useApi
  ? apiAdminRepository
  : localAdminRepository;
export const ticketRepository = useApi
  ? apiTicketRepository
  : localTicketRepository;
export const payoutRepository = useApi
  ? apiPayoutRepository
  : localPayoutRepository;
