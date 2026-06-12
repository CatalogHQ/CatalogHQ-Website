import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      richColors
      closeButton
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <CircleAlertIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0.75rem",
          "--toast-close-button-transform": "translateY(-50%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "pr-10",
          closeButton:
            "!top-1/2 !left-auto !right-3 !translate-x-0 !-translate-y-1/2 !border-0 !bg-transparent hover:!bg-muted/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
