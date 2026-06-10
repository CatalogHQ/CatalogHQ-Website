import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  LogOut,
  Shield,
  Store,
  Users,
  UserCircle,
  ClipboardList,
  MessageSquare,
  BadgeCheck,
  BarChart3,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminBadges } from "@/hooks/use-admin-badges";

const navItems = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Vendors", href: "/admin/vendors", icon: Store },
  { title: "Customers", href: "/admin/customers", icon: UserCircle },
  { title: "Orders", href: "/admin/orders", icon: ClipboardList },
  {
    title: "Tickets",
    href: "/admin/tickets",
    icon: MessageSquare,
    badgeKey: "tickets" as const,
  },
  {
    title: "Verification",
    href: "/admin/verification",
    icon: BadgeCheck,
    badgeKey: "verification" as const,
  },
  { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const { pendingVerifications, openTickets } = useAdminBadges();

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const pageTitle =
    navItems.find((item) => isActive(item.href))?.title ?? "Admin";

  const getBadgeCount = (badgeKey?: "tickets" | "verification") => {
    if (badgeKey === "tickets") return openTickets;
    if (badgeKey === "verification") return pendingVerifications;
    return 0;
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-whatsapp-green text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                ShopEase
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                Admin dashboard
              </p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const badgeCount = getBadgeCount(item.badgeKey);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link to={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                          {badgeCount > 0 && (
                            <SidebarMenuBadge className="bg-whatsapp-green text-white">
                              {badgeCount}
                            </SidebarMenuBadge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <Button variant="outline" size="sm" className="w-full gap-2" asChild>
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to site
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full gap-2 text-gray-600"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <SidebarTrigger showLabel />
          <Separator orientation="vertical" className="h-6" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {pageTitle}
            </p>
          </div>
          <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" asChild>
            <Link to="/dashboard">
              <Users className="h-4 w-4" />
              Vendor view
            </Link>
          </Button>
        </header>
        <div className="flex-1 bg-gray-50 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
