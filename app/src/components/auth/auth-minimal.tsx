import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import {
  authMinimalFieldClass,
  authMinimalRowClass,
} from "@/components/auth/auth-minimal-styles";
import { cn } from "@/lib/utils";

type AuthMinimalInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: LucideIcon;
  invalid?: boolean;
};

export const AuthMinimalInput = forwardRef<HTMLInputElement, AuthMinimalInputProps>(
  function AuthMinimalInput({ icon: Icon, invalid, className, ...props }, ref) {
    return (
      <div
        className={cn(
          authMinimalRowClass,
          invalid && "border-red-300 focus-within:border-red-300",
        )}
      >
        <Icon className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
        <input
          ref={ref}
          className={cn(authMinimalFieldClass, className)}
          {...props}
        />
      </div>
    );
  },
);

type AuthMinimalPasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  invalid?: boolean;
};

export const AuthMinimalPasswordInput = forwardRef<
  HTMLInputElement,
  AuthMinimalPasswordInputProps
>(function AuthMinimalPasswordInput(
  { invalid, className, onChange, name, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const syncFromDom = useCallback(() => {
    const el = inputRef.current;
    if (!el || !onChange) return;

    onChange({
      target: { value: el.value, name: name ?? "" },
    } as ChangeEvent<HTMLInputElement>);
  }, [onChange, name]);

  const toggleVisible = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;

    const value = el.value;
    const next = !visible;

    setVisible(next);
    el.type = next ? "text" : "password";
    el.value = value;

    if (onChange) {
      onChange({
        target: { value, name: name ?? "" },
      } as ChangeEvent<HTMLInputElement>);
    }
  }, [visible, onChange, name]);

  return (
    <div
      className={cn(
        authMinimalRowClass,
        invalid && "border-red-300 focus-within:border-red-300",
      )}
    >
      <Lock className="h-5 w-5 shrink-0 text-white/85" aria-hidden />
      <input
        {...props}
        name={name}
        ref={setRefs}
        type={visible ? "text" : "password"}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(authMinimalFieldClass, "pr-2", className)}
        onChange={onChange}
        onInput={syncFromDom}
      />
      <button
        type="button"
        className="shrink-0 text-white/60 transition-colors hover:text-white"
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleVisible}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});

type AuthPrimaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthPrimaryButton({
  className,
  children,
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "h-12 w-full bg-[#0a2540] text-sm font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#0d3054] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type AuthSecondaryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function AuthSecondaryButton({
  className,
  children,
  ...props
}: AuthSecondaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "h-11 w-full border border-white/35 text-sm text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AuthGhostButton({
  className,
  children,
  ...props
}: AuthSecondaryButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full py-2 text-sm text-white/75 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type AuthMinimalCheckboxProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: ReactNode;
};

export function AuthMinimalCheckbox({
  id,
  checked,
  onCheckedChange,
  label,
}: AuthMinimalCheckboxProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="h-4 w-4 rounded-sm border-white/50 bg-[#0a2540]/60 text-[#0a2540] accent-[#0a2540]"
      />
      <span className="text-sm text-white/85">{label}</span>
    </label>
  );
}
