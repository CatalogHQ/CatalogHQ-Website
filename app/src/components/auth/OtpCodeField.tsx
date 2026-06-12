import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { Hash } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import {
  authMinimalFieldClass,
  authMinimalIconClass,
  authMinimalMessageClass,
  authMinimalRowClass,
} from "@/components/auth/auth-minimal-styles";
import { cn } from "@/lib/utils";

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  inputRef: React.Ref<HTMLInputElement>;
  autoFocus?: boolean;
  className?: string;
  variant?: "default" | "minimal";
};

function OtpCodeInput({
  value,
  onChange,
  onBlur,
  name,
  inputRef,
  autoFocus,
  className,
  variant = "default",
}: OtpCodeInputProps) {
  const { formItemId, formMessageId, error } = useFormField();

  if (variant === "minimal") {
    return (
      <div
        className={cn(
          authMinimalRowClass,
          error && "border-destructive focus-within:border-destructive",
        )}
      >
        <Hash className={authMinimalIconClass} aria-hidden />
        <input
          id={formItemId}
          ref={inputRef}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          enterKeyHint="done"
          maxLength={6}
          autoFocus={autoFocus}
          placeholder="6-digit code"
          aria-invalid={!!error}
          aria-describedby={error ? formMessageId : undefined}
          value={value}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
          }}
          className={cn(
            authMinimalFieldClass,
            "tracking-[0.35em]",
            className,
          )}
        />
      </div>
    );
  }

  return (
    <input
      id={formItemId}
      ref={inputRef}
      name={name}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      enterKeyHint="done"
      maxLength={6}
      autoFocus={autoFocus}
      placeholder="123456"
      aria-invalid={!!error}
      aria-describedby={error ? formMessageId : undefined}
      value={value}
      onBlur={onBlur}
      onChange={(event) => {
        onChange(event.target.value.replace(/\D/g, "").slice(0, 6));
      }}
      className={cn(
        "border-input bg-transparent h-11 w-full min-w-0 rounded-md border px-3 py-1 text-base tracking-[0.3em] shadow-xs outline-none transition-[color,box-shadow] md:text-sm",
        "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className,
      )}
    />
  );
}

type OtpCodeFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  autoFocus?: boolean;
  variant?: "default" | "minimal";
};

export default function OtpCodeField<T extends FieldValues>({
  control,
  name,
  label = "6-digit code",
  autoFocus = false,
  variant = "minimal",
}: OtpCodeFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          {variant === "default" ? (
            <FormLabel>{label}</FormLabel>
          ) : (
            <FormLabel className="sr-only">{label}</FormLabel>
          )}
          <OtpCodeInput
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            inputRef={field.ref}
            autoFocus={autoFocus}
            variant={variant}
          />
          <FormMessage
            className={
              variant === "minimal"
                ? authMinimalMessageClass(!!fieldState.error)
                : undefined
            }
          />
        </FormItem>
      )}
    />
  );
}
