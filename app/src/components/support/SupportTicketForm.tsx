import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ticketRepository } from "@/lib/repositories";
import { phoneSchema } from "@/lib/auth-schemas";

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject is required").max(200),
  description: z.string().min(10, "Please describe your issue").max(5000),
  contactName: z.string().min(2, "Name is required").max(100),
  contactPhone: phoneSchema,
  contactEmail: z
    .string()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  orderRef: z.string().max(50).optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

type SupportTicketFormProps = {
  audience: "vendor" | "customer";
  storeName?: string;
  defaultOrderRef?: string;
  defaultContactName?: string;
  defaultContactPhone?: string;
  trigger: ReactNode;
};

export default function SupportTicketForm({
  audience,
  storeName,
  defaultOrderRef,
  defaultContactName,
  defaultContactPhone,
  trigger,
}: SupportTicketFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      description: "",
      contactName: defaultContactName ?? "",
      contactPhone: defaultContactPhone ?? "",
      contactEmail: "",
      orderRef: defaultOrderRef ?? "",
    },
  });

  const onSubmit = async (values: TicketFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        subject: values.subject,
        description: values.description,
        contactName: values.contactName,
        contactPhone: values.contactPhone,
        contactEmail: values.contactEmail?.trim() || undefined,
        orderRef: values.orderRef?.trim() || undefined,
      };

      if (audience === "vendor") {
        await ticketRepository.createVendor(payload);
      } else {
        await ticketRepository.createPublic(payload);
      }

      toast.success("Support ticket submitted. We'll get back to you soon.");
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit ticket.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a support ticket</DialogTitle>
          <DialogDescription>
            {audience === "vendor"
              ? `Tell us how we can help${storeName ? ` with ${storeName}` : ""}.`
              : "Describe your issue and we'll follow up by SMS or email."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="What happened? Include any relevant details."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (WhatsApp)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {audience === "customer" && (
              <FormField
                control={form.control}
                name="orderRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order reference (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="SHP-20260608-AB12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-whatsapp-green hover:bg-whatsapp-green/90"
            >
              {submitting ? "Submitting..." : "Submit ticket"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
