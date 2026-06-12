import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
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
  AuthGhostButton,
  AuthMinimalCheckbox,
  AuthMinimalInput,
  AuthMinimalPasswordInput,
  AuthPrimaryButton,
  AuthSecondaryButton,
} from "@/components/auth/auth-minimal";
import { authMinimalMessageClass } from "@/components/auth/auth-minimal-styles";
import { useAuth } from "@/contexts/AuthContext";
import { isSignupVerificationPending } from "@/lib/api-error";
import { storeRepository } from "@/lib/repositories";
import {
  signInSchema,
  verifySignUpCodeSchema,
  type SignInFormValues,
  type VerifySignUpCodeFormValues,
} from "@/lib/auth-schemas";

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, verifySignUp, resendSignUpOtp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingPassword, setPendingPassword] = useState("");

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const verifyForm = useForm<VerifySignUpCodeFormValues>({
    resolver: zodResolver(verifySignUpCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const completeSignIn = async (user: Awaited<ReturnType<typeof signIn>>) => {
    toast.success("Signed in successfully.");

    const returnTo = searchParams.get("returnTo");
    if (returnTo) {
      navigate(decodeURIComponent(returnTo));
      return;
    }

    const store = storeRepository.getMyStore
      ? await storeRepository.getMyStore()
      : await storeRepository.getByVendorId(user.id);
    navigate(store?.setupComplete ? "/dashboard" : "/dashboard/setup");
  };

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    try {
      const email = data.email.trim().toLowerCase();
      const user = await signIn(email, data.password);
      await completeSignIn(user);
    } catch (error) {
      if (isSignupVerificationPending(error)) {
        const email = data.email.trim().toLowerCase();
        setPendingVerification(true);
        setPendingEmail(email);
        setPendingPassword(data.password);
        verifyForm.reset({ code: "" });
        toast.error(
          error instanceof Error
            ? error.message
            : "Finish verifying your email to sign in.",
        );
        return;
      }

      toast.error(
        error instanceof Error ? error.message : "Could not sign in.",
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
      toast.error("Sign-up session expired. Please sign in and try again.");
      setPendingVerification(false);
      return;
    }

    setLoading(true);
    try {
      const user = await verifySignUp(pendingEmail, data.code);
      toast.success("Account verified! Let's set up your store.");
      await completeSignIn(user);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not verify your code.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <AuthLayout
        title="Verify email"
        subtitle={`Enter the code we sent to ${pendingEmail}.`}
        footerText="Already verified?"
        footerLinkText="Sign in"
        footerLinkTo="/sign-in"
      >
        <Form {...verifyForm}>
          <form
            onSubmit={verifyForm.handleSubmit(onSubmitVerify)}
            className="space-y-6"
          >
            <OtpCodeField
              control={verifyForm.control}
              name="code"
              autoFocus
            />

            <AuthPrimaryButton type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </AuthPrimaryButton>

            <AuthSecondaryButton
              type="button"
              disabled={resending}
              onClick={onResendCode}
            >
              {resending ? "Sending..." : "Resend code"}
            </AuthSecondaryButton>

            <AuthGhostButton
              type="button"
              onClick={() => {
                setPendingVerification(false);
                setPendingEmail("");
                setPendingPassword("");
              }}
            >
              Back to sign in
            </AuthGhostButton>
          </form>
        </Form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Vendor login"
      footerText="Don't have an account?"
      footerLinkText="Create account"
      footerLinkTo="/sign-up"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
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
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="sr-only">Password</FormLabel>
                <FormControl>
                  <AuthMinimalPasswordInput
                    autoComplete="current-password"
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

          <div className="flex items-center justify-between gap-4">
            <AuthMinimalCheckbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={setRememberMe}
              label="Remember me"
            />
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-sm italic text-white/90 transition-colors hover:text-white"
            >
              Forgot password?
            </button>
          </div>

          <AuthPrimaryButton type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </AuthPrimaryButton>
        </form>
      </Form>
    </AuthLayout>
  );
}
