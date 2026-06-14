import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  PRODUCT_IMAGE_LIMITS,
  uploadProductImages,
} from "@/lib/image-upload";

type ProductImageUploadProps = {
  value: string[];
  onChange: (images: string[]) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

export default function ProductImageUpload({
  value,
  onChange,
  disabled,
  onUploadingChange,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingUploads, setPendingUploads] = useState(0);
  const isUploading = pendingUploads > 0;

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    const fileCount = files.length;
    setPendingUploads(fileCount);

    try {
      const uploaded = await uploadProductImages(files, value.length);
      onChange([...value, ...uploaded]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not upload image.",
      );
    } finally {
      setPendingUploads(0);
      event.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    onChange(value.filter((_, currentIndex) => currentIndex !== index));
  };

  const atLimit = value.length + pendingUploads >= PRODUCT_IMAGE_LIMITS.maxImages;
  const controlsDisabled = disabled || isUploading;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={PRODUCT_IMAGE_LIMITS.acceptAttribute}
        multiple
        className="hidden"
        disabled={controlsDisabled || atLimit}
        onChange={handleFileChange}
      />

      {(value.length > 0 || isUploading) && (
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
                disabled={controlsDisabled}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
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

          {Array.from({ length: pendingUploads }).map((_, index) => (
            <div
              key={`uploading-${index}`}
              className="relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border border-dashed border-whatsapp-green/40 bg-whatsapp-green/5"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner className="size-6 text-whatsapp-green" />
              <span className="px-2 text-center text-[10px] font-medium text-whatsapp-dark">
                Uploading...
              </span>
            </div>
          ))}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
          <Spinner className="size-4 shrink-0 text-amber-700" />
          <p>
            Image upload in progress. Please wait before saving your product.
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        disabled={controlsDisabled || atLimit}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Spinner className="size-4" />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus className="h-4 w-4" />
            {value.length === 0
              ? "Upload pictures"
              : `Add more (${value.length}/${PRODUCT_IMAGE_LIMITS.maxImages})`}
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500">
        JPG, PNG, or WebP. Up to {PRODUCT_IMAGE_LIMITS.maxImages} images, 500KB
        each. First image is the cover photo.
      </p>
    </div>
  );
}
