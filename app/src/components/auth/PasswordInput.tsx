import {
  forwardRef,
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, onChange, name, ...props }, ref) {
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
      <div className="relative">
        <Input
          {...props}
          name={name}
          ref={setRefs}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn("pr-10", className)}
          onChange={onChange}
          onInput={syncFromDom}
        />
        <button
          type="button"
          className="absolute right-0 top-0 z-10 flex h-full min-w-11 touch-manipulation items-center justify-center px-3 text-gray-400 hover:text-gray-600"
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
  },
);

export default PasswordInput;
