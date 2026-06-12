import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import AuthLayout from "@/components/auth/AuthLayout";
import OtpCodeField from "@/components/auth/OtpCodeField";
import {
  AuthMinimalInput,
  AuthMinimalPasswordInput,
} from "@/components/auth/auth-minimal";
import { authMinimalMessageClass } from "@/components/auth/auth-minimal-styles";
import { useAuth } from "@/contexts/AuthContext";
import {
  signUpSchema,
  verifySignUpCodeSchema,
  type SignUpFormValues,
  type VerifySignUpCodeFormValues,
} from "@/lib/auth-schemas";

const submitButtonClass =
  "h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90";

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
      title={step === "details" ? "Create a vendor account" : "Verify your email"}
      subtitle={
        step === "details"
          ? "Start selling with a shareable storefront link."
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
            className="space-y-5"
          >
            <FormField
              control={detailsForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Email</FormLabel>
                  <FormControl>
                    <AuthMinimalInput
                      icon={Mail}
                      type="email"
                      autoComplete="email"
                      placeholder="Email"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={detailsForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="new-password"
                      placeholder="Password"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={detailsForm.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="sr-only">Confirm password</FormLabel>
                  <FormControl>
                    <AuthMinimalPasswordInput
                      autoComplete="off"
                      placeholder="Confirm password"
                      invalid={!!fieldState.error}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage
                    className={authMinimalMessageClass(!!fieldState.error)}
                  />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className={submitButtonClass}>
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

            <Button type="submit" disabled={loading} className={submitButtonClass}>
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
