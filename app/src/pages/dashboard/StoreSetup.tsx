import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { useVendor } from "@/contexts/VendorContext";
import {
  createSlugFromName,
  STORE_SETUP_STEPS,
  storeSetupSchema,
  type StoreSetupFormValues,
} from "@/lib/store-schemas";
import { getStoreUrl } from "@/lib/slug";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = STORE_SETUP_STEPS.length;

export default function StoreSetup() {
  const navigate = useNavigate();
  const { store, completeSetup, isSlugAvailable } = useVendor();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);

  const form = useForm<StoreSetupFormValues>({
    resolver: zodResolver(storeSetupSchema),
    defaultValues: {
      businessName: store?.businessName ?? "",
      legalFirstName: store?.legalFirstName ?? "",
      legalLastName: store?.legalLastName ?? "",
      bio: store?.bio ?? "",
      whatsapp: store?.whatsapp ?? "",
      nin: store?.nin ?? "",
      slug: store?.slug ?? "",
      category: store?.category ?? "",
      address: store?.address ?? "",
      city: store?.city ?? "",
      state: store?.state ?? "",
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
        nin: store.nin,
        slug: store.slug,
        category: store.category ?? "",
        address: store.address ?? "",
        city: store.city ?? "",
        state: store.state ?? "",
      });
      if (store.slug) setSlugEdited(true);
    }
  }, [store, form]);

  const businessName = form.watch("businessName");
  const slug = form.watch("slug");
  const currentStep = STORE_SETUP_STEPS[step];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  useEffect(() => {
    if (!slugEdited && businessName) {
      form.setValue("slug", createSlugFromName(businessName), {
        shouldValidate: true,
      });
    }
  }, [businessName, slugEdited, form]);

  const goToPreviousStep = () => {
    setStep((current) => Math.max(0, current - 1));
  };

  const goToNextStep = async () => {
    const fields = [...currentStep.fields];
    const valid = await form.trigger(fields);
    if (!valid) return;

    if (currentStep.id === "business") {
      const slugValue = form.getValues("slug");
      if (!(await isSlugAvailable(slugValue))) {
        form.setError("slug", {
          message: "This store link is already taken. Try another.",
        });
        return;
      }
    }

    setStep((current) => Math.min(TOTAL_STEPS - 1, current + 1));
  };

  const onSubmit = async (data: StoreSetupFormValues) => {
    if (!(await isSlugAvailable(data.slug))) {
      form.setError("slug", {
        message: "This store link is already taken. Try another.",
      });
      setStep(0);
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
        setStep(TOTAL_STEPS - 1);
        return;
      }

      if (saved.verificationStatus === "verified") {
        toast.success("Store setup complete. Your vendor account is verified.");
      } else {
        toast.success("Store setup complete. NIN verification is in progress.");
      }

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
        <p className="text-sm font-medium text-whatsapp-green">
          Step {step + 1} of {TOTAL_STEPS}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Set up your store</h1>
        <p className="mt-1 text-gray-600">
          A few quick steps and your storefront link is ready to share.
        </p>
      </div>

      <Progress value={progress} className="h-1.5 bg-gray-100 [&>div]:bg-whatsapp-green" />

      <ol className="flex gap-2">
        {STORE_SETUP_STEPS.map((setupStep, index) => (
          <li key={setupStep.id} className="flex-1">
            <div
              className={cn(
                "h-1 rounded-full transition-colors",
                index <= step ? "bg-whatsapp-green" : "bg-gray-200",
              )}
              aria-hidden
            />
            <p
              className={cn(
                "mt-2 hidden text-xs font-medium sm:block",
                index === step ? "text-gray-900" : "text-gray-400",
              )}
            >
              {setupStep.title}
            </p>
          </li>
        ))}
      </ol>

      <Card>
        <CardHeader>
          <CardTitle>{currentStep.title}</CardTitle>
          <CardDescription>{currentStep.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {currentStep.id === "business" && (
                <>
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Input placeholder="Fashion" {...field} />
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Store link</FormLabel>
                        <FormControl>
                          <div className="flex rounded-md border bg-white">
                            <span className="inline-flex items-center border-r bg-gray-50 px-3 text-sm text-gray-500">
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
                </>
              )}

              {currentStep.id === "location" && (
                <>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="12 Admiralty Way, Lekki Phase 1"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
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
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Lagos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                </>
              )}

              {currentStep.id === "identity" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="legalFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal first name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Amaka"
                              autoComplete="given-name"
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
                              placeholder="Okafor"
                              autoComplete="family-name"
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
                            placeholder="12345678901"
                            maxLength={11}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          We verify your NIN against your legal name when you
                          finish setup.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                    disabled={loading}
                    className="sm:w-auto"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                ) : (
                  <span className="hidden sm:block" />
                )}

                {step < TOTAL_STEPS - 1 ? (
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90 sm:ml-auto sm:w-auto"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90 sm:ml-auto sm:w-auto"
                  >
                    {loading ? "Saving..." : "Complete setup"}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
