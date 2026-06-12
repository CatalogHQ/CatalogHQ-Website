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
import OtpCodeField from "@/components/auth/OtpCodeField";
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import {
  signUpSchema,
  verifySignUpCodeSchema,
  type SignUpFormValues,
  type VerifySignUpCodeFormValues,
} from "@/lib/auth-schemas";

export default function SignUp() {
  const navigate = useNavigate();
  const { initSignUp, verifySignUp, resendSignUpOtp } = useAuth();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const detailsForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const verifyForm = useForm<VerifySignUpCodeFormValues>({
    resolver: zodResolver(verifySignUpCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmitDetails = async (data: SignUpFormValues) => {
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      await initSignUp(email, data.password);
      setPendingEmail(email);
      setPendingPassword(data.password);
      verifyForm.reset({ code: "" });
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

  const onResendCode = async () => {
    if (!pendingEmail || !pendingPassword) return;

    setResending(true);
    try {
      await resendSignUpOtp(pendingEmail, pendingPassword);
      toast.success("We sent a new verification code to your email.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not resend code.",
      );
    } finally {
      setResending(false);
    }
  };

  const onSubmitVerify = async (data: VerifySignUpCodeFormValues) => {
    if (!pendingEmail) {
      toast.error("Sign-up session expired. Please start again.");
      setStep("details");
      return;
    }

    setLoading(true);
    try {
      await verifySignUp(pendingEmail, data.code);
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
            <OtpCodeField
              control={verifyForm.control}
              name="code"
              autoFocus
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
              variant="outline"
              disabled={resending}
              className="h-11 w-full"
              onClick={onResendCode}
            >
              {resending ? "Sending..." : "Resend verification code"}
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
