import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type OtpCodeInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value?: string;
  onChange?: (value: string) => void;
};

const OtpCodeInput = forwardRef<HTMLInputElement, OtpCodeInputProps>(
  function OtpCodeInput(
    { className, value = "", onChange, onBlur, name, disabled, ...props },
    ref,
  ) {
    return (
      <Input
        ref={ref}
        type="text"
        name={name}
        value={value}
        disabled={disabled}
        inputMode="numeric"
        autoComplete="one-time-code"
        enterKeyHint="done"
        maxLength={6}
        pattern="[0-9]*"
        placeholder="123456"
        className={cn("h-11 tracking-[0.3em]", className)}
        onBlur={onBlur}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "").slice(0, 6);
          onChange?.(next);
        }}
        {...props}
      />
    );
  },
);

export default OtpCodeInput;
