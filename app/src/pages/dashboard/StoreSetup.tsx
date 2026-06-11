import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
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
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import {
  createSlugFromName,
  storeSetupSchema,
  type StoreSetupFormValues,
} from "@/lib/store-schemas";
import { getStoreUrl } from "@/lib/slug";

export default function StoreSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store, completeSetup, isSlugAvailable } = useVendor();
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<StoreSetupFormValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      businessName: store?.businessName ?? "",
      bio: store?.bio ?? "",
      whatsapp: store?.whatsapp ?? user?.phone ?? "",
      nin: store?.nin ?? "",
      slug: store?.slug ?? "",
      category: store?.category ?? "",
      city: store?.city ?? "",
      state: store?.state ?? "",
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
      if (store.slug) setSlugEdited(true);
    } else if (user?.phone) {
      form.setValue("whatsapp", user.phone);
    }
  }, [store, user, form]);

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

      toast.success("Store setup complete!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save store details.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your store</h1>
        <p className="mt-1 text-gray-600">
          Tell customers who you are and get your shareable store link.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business details</CardTitle>
          <CardDescription>
            This information appears on your public storefront.
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
                      <Input placeholder="Amaka's Fashion Store" {...field} />
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
                      <Textarea
                        placeholder="Tell customers what you sell and why they should buy from you."
                        rows={4}
                        {...field}
                      />
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
                    <FormLabel>Contact number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="08012345678" {...field} />
                    </FormControl>
                    <FormDescription>
                      Customers can reach you here after ordering (WhatsApp,
                      calls, etc.).
                    </FormDescription>
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
                      <Input
                        inputMode="numeric"
                        placeholder="12345678901"
                        maxLength={11}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Required for vendor verification. Stored securely when the
                      backend is connected.
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
                          placeholder="amakas-fashion"
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
                    <FormItem className="sm:col-span-1">
                      <FormLabel>Category (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Fashion" {...field} />
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
                      <FormLabel>City (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Lagos" {...field} />
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
                      <FormLabel>State (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Lagos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90 sm:w-auto"
              >
                {loading ? "Saving..." : "Complete setup"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
