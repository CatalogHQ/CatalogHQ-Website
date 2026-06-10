export const DELIVERY_TYPE_IDS = ['pickup', 'delivery'] as const;

export type DeliveryTypeId = (typeof DELIVERY_TYPE_IDS)[number];
