import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PRODUCT_IMAGE_LIMITS,
  uploadProductImages,
} from "@/lib/image-upload";

type ProductImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
};

export default function ProductImageUpload({
  value,
  onChange,
  disabled,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const uploaded = await uploadProductImages(files, value.length);
      onChange([...value, ...uploaded]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const atLimit = value.length >= PRODUCT_IMAGE_LIMITS.maxImages;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_LIMITS.acceptAttribute}
        multiple
        className="hidden"
        disabled={disabled || atLimit}
        onChange={handleFileChange}
      />

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((image, index) => (
            <div
              key={`${index}-${image.slice(0, 24)}`}
              className="relative aspect-square overflow-hidden rounded-lg border bg-gray-50"
            >
              <img
                src={image}
                alt={`Product ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                disabled={disabled}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Cover
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={disabled || atLimit}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
        {value.length === 0
          ? "Upload pictures"
          : `Add more (${value.length}/${PRODUCT_IMAGE_LIMITS.maxImages})`}
      </Button>

      <p className="text-xs text-gray-500">
        JPG, PNG, or WebP. Up to {PRODUCT_IMAGE_LIMITS.maxImages} images, 500KB
        each. First image is the cover photo.
      </p>
    </div>
  );
}
