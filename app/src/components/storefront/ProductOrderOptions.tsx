import { Check, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DELIVERY_TYPES,
  deliveryRequiresAddress,
  getDeliveryType,
} from "@/lib/delivery-types";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";
import { computeCheckoutPricing } from "@/lib/flutterwave-fees";
import CheckoutPricingSummary from "@/components/storefront/CheckoutPricingSummary";
import {
  getDeliveryFee,
  getSelectionHint,
  type ProductOrderSelection,
} from "@/lib/product-order-selection";
import {
  getSizeEquivalent,
  getSizingType,
} from "@/lib/sizing-types";
import type { DeliveryZone } from "@/lib/delivery-zones";
import type { Product } from "@/types/domain";

type ProductOrderOptionsProps = {
  product: Product;
  selection: ProductOrderSelection;
  onChange: (selection: ProductOrderSelection) => void;
  selectionValid: boolean;
  onPayClick: () => void;
  deliveryZones?: DeliveryZone[];
  showDiscountCode?: boolean;
  paymentsDisabled?: boolean;
  paymentsDisabledMessage?: string;
};

function OptionSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        {hint ? <span className="text-xs text-gray-400">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}

function SelectableChip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition-all",
        selected
          ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark ring-1 ring-whatsapp-green/30"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
        className,
      )}
    >
      {selected && (
        <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-whatsapp-green" />
      )}
      {children}
    </button>
  );
}

export default function ProductOrderOptions({
  product,
  selection,
  onChange,
  selectionValid,
  onPayClick,
  deliveryZones = [],
  showDiscountCode = false,
  paymentsDisabled = false,
  paymentsDisabledMessage,
}: ProductOrderOptionsProps) {
  const deliveryFee = getDeliveryFee(
    deliveryZones,
    selection.deliveryType,
    selection.deliveryZoneId,
  );
  const quantity = Math.max(selection.quantity, 1);
  const vendorNet = product.price * quantity + deliveryFee;
  const { customerTotal } = computeCheckoutPricing(vendorNet);
  const availableDeliveryTypes = DELIVERY_TYPES.filter((type) =>
    product.deliveryOptions.includes(type.id),
  );
  const hint = getSelectionHint(product, selection);

  const updateQuantity = (nextQuantity: number) => {
    const clamped = Math.min(Math.max(nextQuantity, 1), product.stock);
    onChange({ ...selection, quantity: clamped });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="divide-y divide-gray-100 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="divide-y divide-gray-100">
          {product.colors.length > 0 && (
        <OptionSection
          title="Color"
          hint={
            product.colors.length > 1 && !selection.color
              ? "Required"
              : undefined
          }
        >
          <div className="flex flex-wrap gap-2">
            {product.colors.map((color) => (
              <SelectableChip
                key={color}
                selected={selection.color === color}
                onClick={() => onChange({ ...selection, color })}
              >
                {color}
              </SelectableChip>
            ))}
          </div>
        </OptionSection>
          )}

          {product.sizingType !== "none" && product.sizes.length > 0 && (
        <OptionSection
          title="Size"
          hint={getSizingType(product.sizingType).label}
        >
          <div className="grid grid-cols-4 gap-2">
            {product.sizes.map((size) => {
              const selected = selection.size === size;
              const equivalent = getSizeEquivalent(product.sizingType, size);

              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChange({ ...selection, size })}
                  className={cn(
                    "flex min-h-[3.25rem] flex-col items-center justify-center rounded-lg border px-1 py-2 text-center transition-all",
                    selected
                      ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark ring-1 ring-whatsapp-green/30"
                      : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300",
                  )}
                >
                  <span className="text-sm font-semibold leading-none">
                    {size}
                  </span>
                  {equivalent && (
                    <span className="mt-1 text-[10px] leading-tight text-gray-500">
                      {equivalent}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </OptionSection>
          )}

          <OptionSection title="Quantity" hint={`${product.stock} in stock`}>
        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={selection.quantity <= 1}
            onClick={() => updateQuantity(selection.quantity - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[2.5rem] px-2 text-center text-sm font-semibold tabular-nums">
            {selection.quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={selection.quantity >= product.stock}
            onClick={() => updateQuantity(selection.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </OptionSection>
        </div>

        {availableDeliveryTypes.length > 0 && (
          <div className="flex flex-col lg:justify-center">
            <OptionSection
          title="Delivery"
          hint={
            availableDeliveryTypes.length > 1 && !selection.deliveryType
              ? "Required"
              : undefined
          }
        >
          <div className="space-y-2">
            {availableDeliveryTypes.map((deliveryType) => {
              const selected = selection.deliveryType === deliveryType.id;

              return (
                <button
                  key={deliveryType.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...selection, deliveryType: deliveryType.id })
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                    selected
                      ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark ring-1 ring-whatsapp-green/30"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-whatsapp-green bg-whatsapp-green text-white"
                        : "border-gray-300 bg-white",
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5" />}
                  </span>
                  <span className="font-medium">{deliveryType.label}</span>
                </button>
              );
            })}
          </div>
          {selection.deliveryType && (
            <p className="mt-2 text-xs text-gray-500">
              {getDeliveryType(selection.deliveryType).requiresAddress
                ? "You'll enter your delivery address and a reachable mobile number at checkout."
                : "Collect your order directly from the vendor."}
            </p>
          )}
          {deliveryRequiresAddress(selection.deliveryType ?? "pickup") &&
            deliveryZones.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">
                  Delivery area
                </p>
                {deliveryZones.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() =>
                      onChange({ ...selection, deliveryZoneId: zone.id })
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all",
                      selection.deliveryZoneId === zone.id
                        ? "border-whatsapp-green bg-whatsapp-green/10 text-whatsapp-dark"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                    )}
                  >
                    <span>{zone.name}</span>
                    <span className="font-medium">{formatNaira(zone.fee)}</span>
                  </button>
                ))}
              </div>
            )}
        </OptionSection>
          </div>
        )}
      </div>

      {showDiscountCode && (
        <OptionSection title="Discount code" hint="Optional">
          <Input
            placeholder="e.g. STATUS10"
            value={selection.discountCode ?? ""}
            onChange={(event) =>
              onChange({
                ...selection,
                discountCode: event.target.value.toUpperCase(),
              })
            }
            className="uppercase"
          />
        </OptionSection>
      )}

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-5 lg:flex lg:items-center lg:justify-between lg:gap-8">
        <div className="mb-4 lg:mb-0 lg:flex-1">
          <CheckoutPricingSummary
            vendorNetNgn={vendorNet}
            showSubtotalLines={{
              unitPrice: product.price,
              quantity,
              deliveryFee,
            }}
          />
        </div>

        <div className="lg:w-72 lg:shrink-0">
        <Button
          size="lg"
          disabled={!selectionValid || paymentsDisabled}
          className="h-11 w-full bg-whatsapp-green text-sm hover:bg-whatsapp-green/90 sm:h-12 sm:text-base"
          onClick={onPayClick}
        >
          Pay now · {formatNaira(customerTotal)}
        </Button>

        {paymentsDisabled && paymentsDisabledMessage ? (
          <p className="mt-2 text-center text-xs text-amber-700">
            {paymentsDisabledMessage}
          </p>
        ) : null}

        {hint && !selectionValid && !paymentsDisabled && (
          <p className="mt-2 text-center text-xs text-gray-500">{hint}</p>
        )}
        </div>
      </div>
    </div>
  );
}
