import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import PasswordInput from "@/components/auth/PasswordInput";
import { useAuth } from "@/contexts/AuthContext";
import { storeRepository } from "@/lib/repositories";
import {
  signInSchema,
  type SignInFormValues,
} from "@/lib/auth-schemas";

export default function SignIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInFormValues) => {
    setLoading(true);
    try {
      const user = await signIn(data.email.trim().toLowerCase(), data.password);
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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not sign in.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle=""
      footerText="Don't have an account?"
      footerLinkText="Create an account"
      footerLinkTo="/sign-up"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-whatsapp-dark hover:text-whatsapp-green transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <FormControl>
                  <PasswordInput
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setRememberMe(checked === true)
              }
            />
            <Label htmlFor="remember" className="text-sm font-normal text-gray-600">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-xl bg-whatsapp-green text-base font-semibold hover:bg-whatsapp-green/90"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
