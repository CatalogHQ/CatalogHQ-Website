import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from "react";
import { Eye, EyeOff, Lock, type LucideIcon } from "lucide-react";
import {
  authMinimalFieldClass,
  authMinimalIconClass,
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
          invalid && "border-destructive focus-within:border-destructive",
        )}
      >
        <Icon className={authMinimalIconClass} aria-hidden />
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
        invalid && "border-destructive focus-within:border-destructive",
      )}
    >
      <Lock className={authMinimalIconClass} aria-hidden />
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
        className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
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
