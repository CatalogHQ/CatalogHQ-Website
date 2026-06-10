import { DELIVERY_TYPE_IDS, DeliveryTypeId } from './constants/delivery-types';

export function deliveryRequiresAddress(deliveryType: string): boolean {
  return deliveryType === 'delivery';
}

export function isValidDeliveryType(value: string): value is DeliveryTypeId {
  return DELIVERY_TYPE_IDS.includes(value as DeliveryTypeId);
}
