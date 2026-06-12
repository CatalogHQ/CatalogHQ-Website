import {
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  inputRef: React.Ref<HTMLInputElement>;
  autoFocus?: boolean;
  className?: string;
};

function OtpCodeInput({
  value,
  onChange,
  onBlur,
  name,
  inputRef,
  autoFocus,
  className,
}: OtpCodeInputProps) {
  const { formItemId, formMessageId, error } = useFormField();

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
};

export default function OtpCodeField<T extends FieldValues>({
  control,
  name,
  label = "6-digit code",
  autoFocus = false,
}: OtpCodeFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <OtpCodeInput
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            inputRef={field.ref}
            autoFocus={autoFocus}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
