import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StoreLinkCard from "@/components/vendor/StoreLinkCard";
import VendorSupportCard from "@/components/vendor/VendorSupportCard";
import VendorToolsCard from "@/components/vendor/VendorToolsCard";
import VendorVerificationCard from "@/components/vendor/VendorVerificationCard";
import { useVendor } from "@/contexts/VendorContext";
import {
  createSlugFromName,
  storeSetupSchema,
  type StoreSetupFormValues,
} from "@/lib/store-schemas";
import { getStoreUrl } from "@/lib/slug";

export default function Settings() {
  const { store, completeSetup, isSlugAvailable } = useVendor();
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(true);

  const form = useForm<StoreSetupFormValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      businessName: "",
      bio: "",
      whatsapp: "",
      nin: "",
      slug: "",
      category: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        businessName: store.businessName,
        bio: store.bio,
        whatsapp: store.whatsapp,
        nin: store.nin,
        slug: store.slug,
        category: store.category ?? "",
        city: store.city ?? "",
        state: store.state ?? "",
      });
    }
  }, [store, form]);

  const businessName = form.watch("businessName");
  const slug = form.watch("slug");

  useEffect(() => {
    if (!slugEdited && businessName) {
      form.setValue("slug", createSlugFromName(businessName), {
        shouldValidate: true,
      });
    }
  }, [businessName, slugEdited, form]);

  const onSubmit = async (data: StoreSetupFormValues) => {
    if (!(await isSlugAvailable(data.slug))) {
      form.setError("slug", {
        message: "This store link is already taken. Try another.",
      });
      return;
    }

    setLoading(true);
    try {
      await completeSetup({
        businessName: data.businessName,
        bio: data.bio,
        whatsapp: data.whatsapp,
        nin: data.nin,
        slug: data.slug,
        category: data.category || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
      });
      toast.success("Store settings updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save settings.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">
          Update your business profile and store link.
        </p>
      </div>

      {store.setupComplete && <StoreLinkCard slug={store.slug} />}

      <VendorVerificationCard store={store} />

      <Card>
        <CardHeader>
          <CardTitle>Business profile</CardTitle>
          <CardDescription>
            Update your public store details and contact information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business bio</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp number</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIN</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" maxLength={11} {...field} />
                    </FormControl>
                    <FormDescription>
                      Used for vendor verification. Changing it may trigger a
                      new review.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store link</FormLabel>
                    <FormControl>
                      <div className="flex rounded-md border bg-white">
                        <span className="inline-flex items-center px-3 text-sm text-gray-500 border-r bg-gray-50">
                          /s/
                        </span>
                        <Input
                          className="border-0 focus-visible:ring-0"
                          {...field}
                          onChange={(event) => {
                            setSlugEdited(true);
                            field.onChange(event);
                          }}
                        />
                      </div>
                    </FormControl>
                    {slug && (
                      <FormDescription>
                        Preview: {getStoreUrl(slug)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="bg-whatsapp-green hover:bg-whatsapp-green/90"
              >
                {loading ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <VendorToolsCard />
      <VendorSupportCard storeName={store.businessName} />
    </div>
  );
}
