import { Link, Outlet, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
  ExternalLink,
  ClipboardList,
  Warehouse,
  BarChart3,
  Shield,
  Wallet,
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
import { useVendor } from "@/contexts/VendorContext";
import VendorOrderNotifications from "@/components/vendor/VendorOrderNotifications";
import CatalogHqLogo from "@/components/brand/CatalogHqLogo";
import { getStoreUrl } from "@/lib/slug";

const navItems = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", href: "/dashboard/orders", icon: ClipboardList, badge: true },
  { title: "Products", href: "/dashboard/products", icon: Package },
  { title: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "Payouts", href: "/dashboard/payouts", icon: Wallet },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const { store, unreadOrderCount } = useVendor();

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  const pageTitle =
    navItems.find((item) => isActive(item.href))?.title ??
    (location.pathname.includes("/setup") ? "Store setup" : "Dashboard");

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <CatalogHqLogo variant="wordmark" className="h-8 w-[144px] sm:h-9 sm:w-[162px]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {store?.businessName || "CatalogHQ"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                Vendor dashboard
              </p>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link to={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.badge && unreadOrderCount > 0 && (
                          <SidebarMenuBadge className="bg-whatsapp-green text-white">
                            {unreadOrderCount}
                          </SidebarMenuBadge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-4">
          {store?.setupComplete && store.slug && (
            <Button variant="outline" size="sm" className="w-full gap-2" asChild>
              <a
                href={getStoreUrl(store.slug)}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                View store
              </a>
            </Button>
          )}
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
          <VendorOrderNotifications />
          {isAdmin && (
            <Button variant="outline" size="sm" className="hidden gap-2 sm:inline-flex" asChild>
              <Link to="/admin">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </Button>
          )}
          {store?.setupComplete && store.slug && (
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
              <a
                href={getStoreUrl(store.slug)}
                target="_blank"
                rel="noreferrer"
              >
                View store
              </a>
            </Button>
          )}
        </header>
        <div className="relative flex-1 bg-gray-50 p-4 sm:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
