import { readJson, writeJson } from "@/lib/local-storage";
import { authRepository } from "@/lib/repositories/local-auth-repository";
import type { SubscriptionRepository } from "@/lib/repositories/subscription-repository";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { PlanTier } from "@/data/plans";
import type {
  SubscriptionCheckoutInput,
  SubscriptionCheckoutResult,
  SubscriptionPayment,
  VendorSubscription,
} from "@/types/subscription";

type StoredSubscription = VendorSubscription & { vendorId: string };

function getSubscriptions(): StoredSubscription[] {
  return readJson<StoredSubscription[]>(STORAGE_KEYS.subscriptions, []);
}

function saveSubscriptions(subscriptions: StoredSubscription[]): void {
  writeJson(STORAGE_KEYS.subscriptions, subscriptions);
}

function defaultSubscription(vendorId: string, planTier: PlanTier): StoredSubscription {
  return {
    vendorId,
    status: "pending",
    planTier,
    subscriptionExempt: false,
    cancelAtPeriodEnd: false,
    isHardBlocked: true,
    hasActiveAccess: false,
  };
}

export class LocalSubscriptionRepository implements SubscriptionRepository {
  private getForCurrentUser(): StoredSubscription {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const user = authRepository.getUserById(session.userId);
    const existing = getSubscriptions().find(
      (entry) => entry.vendorId === session.userId,
    );

    if (existing) {
      return existing;
    }

    const created = defaultSubscription(
      session.userId,
      user?.planTier ?? "starter",
    );
    saveSubscriptions([...getSubscriptions(), created]);
    return created;
  }

  async getSubscription(): Promise<VendorSubscription> {
    const { vendorId: _vendorId, ...subscription } = this.getForCurrentUser();
    return subscription;
  }

  async listPayments(): Promise<SubscriptionPayment[]> {
    return [];
  }

  async checkout(
    input: SubscriptionCheckoutInput,
  ): Promise<SubscriptionCheckoutResult> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const reference = `sub_local_${Date.now()}`;
    const subscriptions = getSubscriptions().filter(
      (entry) => entry.vendorId !== session.userId,
    );
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    subscriptions.push({
      vendorId: session.userId,
      status: "active",
      planTier: input.planTier,
      paidPlanTier: input.planTier,
      subscriptionExempt: false,
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      cancelAtPeriodEnd: false,
      isHardBlocked: false,
      hasActiveAccess: true,
    });
    saveSubscriptions(subscriptions);

    return {
      authorizationUrl: `/dashboard/billing?status=success&reference=${reference}`,
      reference,
    };
  }

  async confirm(reference: string): Promise<VendorSubscription> {
    void reference;
    return this.getSubscription();
  }

  async cancel(): Promise<VendorSubscription> {
    const session = authRepository.getSession();
    if (!session) {
      throw new Error("Sign in required.");
    }

    const subscriptions = getSubscriptions();
    const current = subscriptions.find(
      (entry) => entry.vendorId === session.userId,
    );
    if (!current) {
      throw new Error("Subscription not found.");
    }

    current.cancelAtPeriodEnd = true;
    current.canceledAt = new Date().toISOString();
    saveSubscriptions(subscriptions);

    const { vendorId: _vendorId, ...subscription } = current;
    return subscription;
  }

  async changePlan(
    input: SubscriptionCheckoutInput,
  ): Promise<SubscriptionCheckoutResult> {
    return this.checkout(input);
  }
}

export const localSubscriptionRepository = new LocalSubscriptionRepository();
