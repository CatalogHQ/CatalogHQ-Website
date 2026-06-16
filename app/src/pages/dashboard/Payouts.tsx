import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import BankSearchSelect from "@/components/vendor/BankSearchSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import VendorVerificationCard from "@/components/vendor/VendorVerificationCard";
import { useVendor } from "@/contexts/VendorContext";
import { formatNaira } from "@/lib/format";
import {
  getPayoutStatusLabel,
  MIN_VENDOR_PAYOUT_NAIRA,
} from "@/lib/payout-constants";
import { payoutSetupSchema, type PayoutSetupFormValues } from "@/lib/payout-schemas";
import { payoutRepository } from "@/lib/repositories";
import type { CustomerOrder } from "@/types/orders";
import type { PayoutBank, ResolvedPayoutAccount, VendorPayoutAccount } from "@/types/payout";

const PAYOUT_STATUS_LABELS: Record<
  NonNullable<CustomerOrder["payoutStatus"]>,
  string
> = {
  pending: "Pending",
  processing: "Transfer in progress",
  split: "Transfer sent",
  settled: "Settled",
  failed: "Failed",
};

export default function Payouts() {
  const { store, markPayoutsSeen } = useVendor();
  const [banks, setBanks] = useState<PayoutBank[]>([]);
  const [sandboxMode, setSandboxMode] = useState(false);
  const [sandboxHint, setSandboxHint] = useState<string | null>(null);
  const [testAccountNumbers, setTestAccountNumbers] = useState<string[]>([]);
  const [account, setAccount] = useState<VendorPayoutAccount | null>(null);
  const [history, setHistory] = useState<CustomerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedAccount, setResolvedAccount] =
    useState<ResolvedPayoutAccount | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const form = useForm<PayoutSetupFormValues>({
    resolver: zodResolver(payoutSetupSchema),
    defaultValues: {
      bankCode: "",
      accountNumber: "",
    },
  });

  useEffect(() => {
    void markPayoutsSeen();
  }, [markPayoutsSeen]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [bankList, payoutAccount, payoutHistory] = await Promise.all([
          payoutRepository.listBanks(),
          payoutRepository.getAccount(),
          payoutRepository.listHistory(),
        ]);
        if (!cancelled) {
          setBanks(bankList.banks);
          setSandboxMode(bankList.sandboxMode);
          setSandboxHint(bankList.sandboxHint ?? null);
          setTestAccountNumbers(bankList.testAccountNumbers ?? []);
          setAccount(payoutAccount);
          setHistory(payoutHistory);
          form.reset({
            bankCode: payoutAccount.bankCode ?? "",
            accountNumber: "",
          });
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Could not load payout settings.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [form]);

  const bankCode = form.watch("bankCode");
  const accountNumber = form.watch("accountNumber");
  const canResolveAccount =
    Boolean(bankCode) && /^\d{10}$/.test(accountNumber ?? "");
  const resolvedMatchesForm =
    resolvedAccount?.accountNumber === accountNumber &&
    canResolveAccount;

  useEffect(() => {
    if (!canResolveAccount) {
      setResolvedAccount(null);
      setResolveError(null);
      setIsResolving(false);
      return;
    }

    setResolvedAccount(null);
    setResolveError(null);
    setIsResolving(true);

    const timeoutId = window.setTimeout(() => {
      void payoutRepository
        .resolveAccount({ bankCode, accountNumber })
        .then((result) => {
          setResolvedAccount(result);
          setResolveError(null);
        })
        .catch((error) => {
          setResolvedAccount(null);
          setResolveError(
            error instanceof Error
              ? error.message
              : "Could not verify this bank account.",
          );
        })
        .finally(() => {
          setIsResolving(false);
        });
    }, 500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [bankCode, accountNumber, canResolveAccount]);

  const onSubmit = async (values: PayoutSetupFormValues) => {
    if (!resolvedMatchesForm) {
      toast.error("Confirm the account holder name before linking.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await payoutRepository.updateAccount(values);
      setAccount(updated);
      const payoutHistory = await payoutRepository.listHistory();
      setHistory(payoutHistory);
      toast.success("Payout bank account linked.");
      form.reset({
        bankCode: updated.bankCode ?? values.bankCode,
        accountNumber: "",
      });
      setResolvedAccount(null);
      setResolveError(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save payout account.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!store) {
    return null;
  }

  if (isLoading || !account) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-8 text-whatsapp-green" />
      </div>
    );
  }

  const isVerified = account.verificationStatus === "verified";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="mt-1 text-gray-600">
          Link the bank account where Flutterwave settles your order payments.
          CatalogHQ does not hold your money. Automatic bank transfers require
          at least {formatNaira(MIN_VENDOR_PAYOUT_NAIRA)} per order.
        </p>
      </div>

      <VendorVerificationCard store={store} variant="banner" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settlement account</CardTitle>
          <CardDescription>
            After a customer pays, CatalogHQ automatically transfers your order
            earnings to this bank account when the amount is at least{" "}
            {formatNaira(MIN_VENDOR_PAYOUT_NAIRA)}. You receive your listed
            price in full. Customers pay the processing fee at checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {account.payoutSetupComplete ? (
            <div className="rounded-lg border border-whatsapp-green/30 bg-whatsapp-green/5 px-4 py-3 text-sm">
              <p className="font-medium text-gray-900">Payout account linked</p>
              <p className="mt-1 text-gray-600">
                {account.accountName} · {account.bankName} ·{" "}
                {account.accountNumber}
              </p>
              {account.payoutSetupAt ? (
                <p className="mt-1 text-xs text-gray-500">
                  Linked {new Date(account.payoutSetupAt).toLocaleDateString("en-NG")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-amber-800">
              Link a settlement bank account before customers can pay on your
              store.
            </p>
          )}

          {!isVerified ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Complete store verification before linking a payout account.{" "}
              <Link to="/dashboard/settings" className="font-medium underline">
                Go to settings
              </Link>
            </div>
          ) : (
            <>
              {sandboxMode && sandboxHint ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  <p className="font-medium">Flutterwave test mode</p>
                  <p className="mt-1">{sandboxHint}</p>
                  {testAccountNumbers.length > 0 ? (
                    <p className="mt-2 text-xs text-blue-800">
                      Test account numbers:{" "}
                      {testAccountNumbers.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4 sm:grid-cols-2"
              >
                <FormField
                  control={form.control}
                  name="bankCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <FormControl>
                        <BankSearchSelect
                          banks={banks}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select bank"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account number</FormLabel>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder={
                            sandboxMode
                              ? "0690000032"
                              : "0123456789"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-2">
                  {isResolving ? (
                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      <Spinner className="size-4 text-whatsapp-green" />
                      Checking account holder name...
                    </div>
                  ) : null}

                  {!isResolving && resolvedMatchesForm && resolvedAccount ? (
                    <div className="rounded-lg border border-whatsapp-green/30 bg-whatsapp-green/5 px-4 py-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-whatsapp-green" />
                        <div>
                          <p className="font-medium text-gray-900">
                            Account holder: {resolvedAccount.accountName}
                          </p>
                          <p className="mt-1 text-gray-600">
                            Confirm this name matches your bank account before
                            linking.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {!isResolving && resolveError && canResolveAccount ? (
                    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                      <AlertCircle className="mt-0.5 size-4 shrink-0" />
                      <p>{resolveError}</p>
                    </div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    disabled={
                      isSaving ||
                      isResolving ||
                      !resolvedMatchesForm ||
                      Boolean(resolveError)
                    }
                    className="bg-whatsapp-green hover:bg-whatsapp-green/90"
                  >
                    {account.payoutSetupComplete
                      ? "Update payout account"
                      : "Link payout account"}
                  </Button>
                </div>
              </form>
            </Form>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payout history</CardTitle>
          <CardDescription>
            Paid orders and their automatic bank transfer status. Orders below{" "}
            {formatNaira(MIN_VENDOR_PAYOUT_NAIRA)} stay pending until you have
            a qualifying sale.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              No paid orders yet. Your payout history will appear here after
              your first sale.
            </p>
          ) : (
            <div className="rounded-lg border-0 border-t bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>You receive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.paymentRef}
                      </TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell>
                        {formatNaira(order.vendorNet ?? 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPayoutStatusLabel(order, PAYOUT_STATUS_LABELS)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString("en-NG")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
