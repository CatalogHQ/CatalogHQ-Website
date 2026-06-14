import type { SocialPlatform } from "@/lib/social-links";

const PLATFORM_ICON_COLORS: Record<SocialPlatform, string> = {
  instagram: "text-[#E4405F] hover:bg-[#E4405F]/10 hover:border-[#E4405F]/30",
  tiktok: "text-gray-900 hover:bg-gray-100 hover:border-gray-300",
  facebook: "text-[#1877F2] hover:bg-[#1877F2]/10 hover:border-[#1877F2]/30",
  x: "text-gray-900 hover:bg-gray-100 hover:border-gray-300",
};

export function getSocialPlatformButtonClass(platform: SocialPlatform): string {
  return PLATFORM_ICON_COLORS[platform];
}
