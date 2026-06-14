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
import { Link } from "react-router";
import VendorVerificationCard from "@/components/vendor/VendorVerificationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";
import { vendorHasActiveSubscription } from "@/lib/vendor-onboarding";
import {
  createSlugFromName,
  storeSetupSchema,
  type StoreSetupFormValues,
} from "@/lib/store-schemas";
import { STORE_CATEGORY_SUGGESTIONS } from "@/lib/store-category-suggestions";
import { getStoreUrl } from "@/lib/slug";
import SocialHandleFields from "@/components/vendor/SocialHandleFields";

export default function Settings() {
  const { user } = useAuth();
  const { store, completeSetup, isSlugAvailable } = useVendor();
  const canVerifyNin = vendorHasActiveSubscription(user);
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(true);
  const isVerified = store?.verificationStatus === "verified";

  const form = useForm<StoreSetupFormValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      businessName: "",
      legalFirstName: "",
      legalLastName: "",
      bio: "",
      whatsapp: "",
      instagramHandle: "",
      tiktokHandle: "",
      facebookHandle: "",
      xHandle: "",
      nin: "",
      slug: "",
      category: "",
      address: "",
      city: "",
      state: "",
    },
  });

  useEffect(() => {
    if (store) {
      form.reset({
        businessName: store.businessName,
        legalFirstName: store.legalFirstName ?? "",
        legalLastName: store.legalLastName ?? "",
        bio: store.bio,
        whatsapp: store.whatsapp,
        instagramHandle: store.instagramHandle ?? "",
        tiktokHandle: store.tiktokHandle ?? "",
        facebookHandle: store.facebookHandle ?? "",
        xHandle: store.xHandle ?? "",
        nin: store.nin,
        slug: store.slug,
        category: store.category ?? "",
        address: store.address ?? "",
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
    if (!canVerifyNin && !isVerified) {
      toast.error("Subscribe to a plan before submitting NIN verification.");
      return;
    }

    if (!(await isSlugAvailable(data.slug))) {
      form.setError("slug", {
        message: "This store link is already taken. Try another.",
      });
      return;
    }

    setLoading(true);
    try {
      const saved = await completeSetup({
        businessName: data.businessName,
        legalFirstName: data.legalFirstName,
        legalLastName: data.legalLastName,
        bio: data.bio,
        whatsapp: data.whatsapp,
        instagramHandle: data.instagramHandle,
        tiktokHandle: data.tiktokHandle,
        facebookHandle: data.facebookHandle,
        xHandle: data.xHandle,
        nin: data.nin,
        slug: data.slug,
        category: data.category,
        address: data.address,
        city: data.city,
        state: data.state,
      });

      if (saved.verificationStatus === "rejected") {
        toast.error(
          saved.rejectionReason ??
            "We could not verify your NIN. Check the number and try again.",
        );
        return;
      }

      if (saved.verificationStatus === "verified") {
        toast.success("Store settings updated. Your vendor account is verified.");
      } else {
        toast.success("Store settings updated.");
      }
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
                    <FormLabel>Primary contact (WhatsApp)</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormDescription>
                      Your main contact number. Customers reach you here first
                      after ordering.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SocialHandleFields control={form.control} />

              {!canVerifyNin && !isVerified ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-medium">Subscription required for NIN verification</p>
                  <p className="mt-1">
                    Choose a paid plan before you can submit or update your NIN.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-3 bg-whatsapp-green hover:bg-whatsapp-green/90"
                  >
                    <Link to="/dashboard/billing">Go to billing</Link>
                  </Button>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="legalFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal first name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="given-name"
                          disabled={!canVerifyNin && !isVerified}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must match the first name on your NIN.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Legal last name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="family-name"
                          disabled={!canVerifyNin && !isVerified}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Must match the last name on your NIN.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="nin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIN</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        maxLength={11}
                        disabled={isVerified || (!canVerifyNin && !isVerified)}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {isVerified
                        ? "Your NIN is locked after verification. Contact support if you need to update it."
                        : "Used for vendor verification. Changing your legal name or NIN triggers a new review."}
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

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
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
                        <>
                          <Input
                            list="store-category-suggestions-settings"
                            placeholder="Fashion, Wigs & hair, Gift packages"
                            {...field}
                          />
                          <datalist id="store-category-suggestions-settings">
                            {STORE_CATEGORY_SUGGESTIONS.map((suggestion) => (
                              <option key={suggestion} value={suggestion} />
                            ))}
                          </datalist>
                        </>
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
