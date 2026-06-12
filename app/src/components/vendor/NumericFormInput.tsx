import { forwardRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

type NumericFormInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number;
  onChange: (value: number) => void;
};

function formatNumericDisplay(value: number): string {
  return value === 0 ? "" : String(value);
}

const NumericFormInput = forwardRef<HTMLInputElement, NumericFormInputProps>(
  function NumericFormInput(
    { value, onChange, onBlur, onFocus, ...props },
    ref,
  ) {
    const [text, setText] = useState(() => formatNumericDisplay(value));

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={text}
        onFocus={(event) => {
          event.target.select();
          onFocus?.(event);
        }}
        onChange={(event) => {
          const next = event.target.value.replace(/\D/g, "");
          setText(next);
          onChange(next === "" ? 0 : Number(next));
        }}
        onBlur={(event) => {
          if (text === "") {
            setText("");
            onChange(0);
          }
          onBlur?.(event);
        }}
      />
    );
  },
);

export default NumericFormInput;
