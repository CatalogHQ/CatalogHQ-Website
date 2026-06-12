import { cn } from "@/lib/utils";

export const authMinimalFieldClass =
  "flex-1 min-w-0 bg-transparent text-gray-900 placeholder:text-gray-400 outline-none border-0 ring-0 focus:ring-0 focus-visible:ring-0 text-base autofill:shadow-[inset_0_0_0px_1000px_#fff]";

export const authMinimalRowClass =
  "flex items-center gap-3 border-b border-gray-300 pb-2.5 transition-colors focus-within:border-whatsapp-dark";

export function authMinimalMessageClass(invalid?: boolean) {
  return cn("mt-1.5 text-xs", invalid ? "text-destructive" : "text-gray-500");
}

export const authMinimalIconClass = "h-5 w-5 shrink-0 text-gray-400";
