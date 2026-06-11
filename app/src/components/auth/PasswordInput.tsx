import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export default function PasswordInput({
  className,
  style,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("pr-10", className)}
        style={{
          ...style,
          WebkitTextSecurity: visible ? "none" : "disc",
        } as React.CSSProperties}
      />
      <button
        type="button"
        className="absolute right-0 top-0 flex h-full items-center px-3 text-gray-400 hover:text-gray-600"
        onPointerDown={(event) => {
          event.preventDefault();
          setVisible((value) => !value);
        }}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
