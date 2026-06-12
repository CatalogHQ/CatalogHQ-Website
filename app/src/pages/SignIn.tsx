import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { isSignupVerificationPending } from "@/lib/api-error";
import { storeRepository } from "@/lib/repositories";
import {
  signInSchema,
  verifySignUpCodeSchema,
  type SignInFormValues,
  type VerifySignUpCodeFormValues,
} from "@/lib/auth-schemas";

const submitButtonClass =
  "h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90";

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
        title="Verify your email"
        subtitle={`Your sign-up for ${pendingEmail} is not complete yet. Enter the code we email you, or request a new one.`}
        footerText="Already verified?"
        footerLinkText="Try signing in again"
        footerLinkTo="/sign-in"
      >
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
              {loading ? "Verifying..." : "Verify and continue"}
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
              onClick={() => {
                setPendingVerification(false);
                setPendingEmail("");
                setPendingPassword("");
              }}
            >
              Back to sign in
            </Button>
          </form>
        </Form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your vendor dashboard."
      footerText="Don't have an account?"
      footerLinkText="Create an account"
      footerLinkTo="/sign-up"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked === true)
                }
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal text-gray-600"
              >
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs font-medium text-whatsapp-dark transition-colors hover:text-whatsapp-green"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" disabled={loading} className={submitButtonClass}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
