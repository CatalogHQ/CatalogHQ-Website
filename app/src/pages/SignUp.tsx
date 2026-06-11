import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AuthLayout from "@/components/auth/AuthLayout";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import {
  signUpSchema,
  verifySignUpSchema,
  type SignUpFormValues,
  type VerifySignUpFormValues,
} from "@/lib/auth-schemas";

export default function SignUp() {
  const navigate = useNavigate();
  const { initSignUp, verifySignUp } = useAuth();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  const detailsForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyForm = useForm<VerifySignUpFormValues>({
    resolver: zodResolver(verifySignUpSchema),
    defaultValues: {
      email: "",
      code: "",
    },
  });

  const onSubmitDetails = async (data: SignUpFormValues) => {
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      await initSignUp(email, data.password);
      setPendingEmail(email);
      verifyForm.setValue("email", email);
      setStep("verify");
      toast.success("We sent a verification code to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not start sign up.",
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmitVerify = async (data: VerifySignUpFormValues) => {
    setLoading(true);
    try {
      await verifySignUp(data.email.trim().toLowerCase(), data.code);
      toast.success("Account verified! Let's set up your store.");
      navigate("/dashboard/setup");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not verify your code.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={step === "details" ? "Create your store" : "Verify your email"}
      subtitle={
        step === "details"
          ? "Sign up with your email. You'll add your WhatsApp number when you set up your store."
          : `Enter the 6-digit code sent to ${pendingEmail || "your email"}.`
      }
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkTo="/sign-in"
    >
      {step === "details" ? (
        <Form {...detailsForm}>
          <form
            onSubmit={detailsForm.handleSubmit(onSubmitDetails)}
            className="space-y-4"
          >
            <FormField
              control={detailsForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to sign in and receive order alerts.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={detailsForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={detailsForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <PasswordInput
                      autoComplete="off"
                      placeholder="Re-enter your password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90"
            >
              {loading ? "Sending code..." : "Continue"}
            </Button>
          </form>
        </Form>
      ) : (
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onSubmitVerify)}
            className="space-y-4"
          >
            <FormField
              control={verifyForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>6-digit code</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="123456"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90"
            >
              {loading ? "Verifying..." : "Verify and create account"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep("details")}
            >
              Use a different email
            </Button>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}
