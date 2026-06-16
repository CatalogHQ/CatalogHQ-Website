export const SecurityAuditAction = {
  AUTH_SIGNIN_SUCCESS: 'auth.signin_success',
  AUTH_SIGNIN_FAILED: 'auth.signin_failed',
  AUTH_SIGNOUT: 'auth.signout',
  AUTH_PASSWORD_RESET: 'auth.password_reset',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_REFRESH_FAILED: 'auth.refresh_failed',
  AUTH_REFRESH_REUSE: 'auth.refresh_reuse',
  ADMIN_APPROVE_VERIFICATION: 'admin.approve_verification',
  ADMIN_REJECT_VERIFICATION: 'admin.reject_verification',
  ADMIN_UPDATE_VENDOR_PLAN: 'admin.update_vendor_plan',
  ADMIN_UPDATE_ORDER_STATUS: 'admin.update_order_status',
  ADMIN_CONFIRM_ORDER_PAYMENT: 'admin.confirm_order_payment',
  ADMIN_ENABLE_TOTP: 'admin.enable_totp',
  PAYMENT_ORDER_CONFIRMED: 'payment.order_confirmed',
  PAYMENT_ORDER_WEBHOOK_ONLY: 'payment.order_webhook_only_confirm',
  PAYMENT_ORDER_VERIFY_DEFERRED: 'payment.order_verify_deferred',
  PAYMENT_PAYOUT_SETTLED: 'payment.payout_settled',
  PAYMENT_PAYOUT_FAILED: 'payment.payout_failed',
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_AMOUNT_MISMATCH: 'subscription.amount_mismatch',
  VENDOR_PAYOUT_ACCOUNT_UPDATED: 'vendor.payout_account_updated',
  VENDOR_TEAM_MEMBER_ADDED: 'vendor.team_member_added',
  VENDOR_TEAM_MEMBER_REMOVED: 'vendor.team_member_removed',
} as const;

export type SecurityAuditActionId =
  (typeof SecurityAuditAction)[keyof typeof SecurityAuditAction];
