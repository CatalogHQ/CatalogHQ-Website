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
      closeButton
      expand
      className="toaster group"
      offset="1rem"
      mobileOffset={{
        top: "max(1rem, env(safe-area-inset-top))",
        bottom: "max(1.25rem, env(safe-area-inset-bottom))",
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 shrink-0" />,
        info: <InfoIcon className="size-4 shrink-0" />,
        warning: <TriangleAlertIcon className="size-4 shrink-0" />,
        error: <CircleAlertIcon className="size-4 shrink-0" />,
        loading: <Loader2Icon className="size-4 shrink-0 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast w-full items-start gap-3 rounded-xl border border-border bg-background px-4 py-3 pr-10 text-foreground shadow-lg sm:items-center",
          title: "text-sm font-semibold leading-snug",
          description: "text-sm leading-snug text-muted-foreground",
          closeButton:
            "!top-1/2 !left-auto !right-3 !translate-x-0 !-translate-y-1/2 !border-0 !bg-transparent hover:!bg-muted/60",
          error:
            "!border-destructive/35 !bg-destructive/10 !text-destructive [&_[data-description]]:!text-destructive/90",
          success:
            "!border-green-200 !bg-green-50 !text-green-900 [&_[data-description]]:!text-green-800",
          warning:
            "!border-amber-200 !bg-amber-50 !text-amber-950 [&_[data-description]]:!text-amber-900",
          info: "!border-blue-200 !bg-blue-50 !text-blue-950 [&_[data-description]]:!text-blue-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
