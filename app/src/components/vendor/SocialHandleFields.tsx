import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { StoreSetupFormValues } from "@/lib/store-schemas";

type SocialHandleFieldsProps = {
  control: Control<StoreSetupFormValues>;
};

const SOCIAL_FIELDS = [
  {
    name: "instagramHandle" as const,
    label: "Instagram",
    placeholder: "yourstore",
  },
  {
    name: "tiktokHandle" as const,
    label: "TikTok",
    placeholder: "yourstore",
  },
  {
    name: "facebookHandle" as const,
    label: "Facebook",
    placeholder: "yourstore",
  },
  {
    name: "xHandle" as const,
    label: "X (Twitter)",
    placeholder: "yourstore",
  },
];

export default function SocialHandleFields({ control }: SocialHandleFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-900">Social handles</p>
        <p className="text-sm text-gray-600">
          Optional. Shown on your storefront so buyers can reach you on other
          platforms.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL_FIELDS.map((field) => (
          <FormField
            key={field.name}
            control={control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <div className="flex rounded-md border bg-white">
                    <span className="inline-flex items-center px-3 text-sm text-gray-500 border-r bg-gray-50">
                      @
                    </span>
                    <Input
                      className="border-0 focus-visible:ring-0"
                      placeholder={field.placeholder}
                      {...formField}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </div>
  );
}
