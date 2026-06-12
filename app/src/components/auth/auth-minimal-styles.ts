import { cn } from "@/lib/utils";

export const authMinimalFieldClass =
  "flex-1 min-w-0 bg-transparent text-white placeholder:text-white/65 outline-none border-0 ring-0 focus:ring-0 focus-visible:ring-0 text-base autofill:shadow-[inset_0_0_0px_1000px_transparent]";

export const authMinimalRowClass =
  "flex items-center gap-3 border-b border-white/45 pb-2.5 transition-colors focus-within:border-white";

export function authMinimalMessageClass(invalid?: boolean) {
  return cn("mt-1.5 text-xs", invalid ? "text-red-200" : "text-white/60");
}
