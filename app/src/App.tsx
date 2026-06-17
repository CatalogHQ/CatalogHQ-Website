import { Routes, Route, Navigate } from 'react-router'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import FeatureGuide from './pages/FeatureGuide'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import SetupRequired from './components/vendor/SetupRequired'
import DashboardLayout from './layouts/DashboardLayout'
import AdminLayout from './layouts/AdminLayout'
import Dashboard from './pages/dashboard/Dashboard'
import StoreSetup from './pages/dashboard/StoreSetup'
import Products from './pages/dashboard/Products'
import Settings from './pages/dashboard/Settings'
import Orders from './pages/dashboard/Orders'
import Inventory from './pages/dashboard/Inventory'
import Analytics from './pages/dashboard/Analytics'
import Payouts from './pages/dashboard/Payouts'
import Billing from './pages/dashboard/Billing'
import AdminOverview from './pages/admin/Overview'
import AdminVendors from './pages/admin/Vendors'
import AdminCustomers from './pages/admin/Customers'
import AdminOrders from './pages/admin/Orders'
import AdminPayouts from './pages/admin/Payouts'
import AdminSubscriptions from './pages/admin/Subscriptions'
import AdminTickets from './pages/admin/Tickets'
import AdminVerification from './pages/admin/Verification'
import AdminAnalytics from './pages/admin/Analytics'
import AdminPlans from './pages/admin/Plans'
import AdminSecurityLogs from './pages/admin/SecurityLogs'
import AdminSystemHealth from './pages/admin/SystemHealth'
import AdminSettings from './pages/admin/Settings'
import PublicStore from './pages/storefront/PublicStore'
import PublicProduct from './pages/storefront/PublicProduct'
import PublicStoreReviews from './pages/storefront/PublicStoreReviews'
import OrderStatus from './pages/storefront/OrderStatus'
import OrderReview from './pages/storefront/OrderReview'
import VerifyReceipt from './pages/storefront/VerifyReceipt'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/feature-guide" element={<FeatureGuide />} />

      <Route path="/s/:slug" element={<PublicStore />} />
      <Route path="/s/:slug/reviews" element={<PublicStoreReviews />} />
      <Route path="/s/:slug/order/:paymentRef" element={<OrderStatus />} />
      <Route path="/s/:slug/order/:paymentRef/review" element={<OrderReview />} />
      <Route path="/s/:slug/p/:productId" element={<PublicProduct />} />
      <Route path="/receipt/:paymentRef" element={<VerifyReceipt />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route
          path="setup"
          element={
            <SetupRequired redirectIfComplete requireComplete={false}>
              <StoreSetup />
            </SetupRequired>
          }
        />
        <Route
          path="products"
          element={
            <SetupRequired>
              <Products />
            </SetupRequired>
          }
        />
        <Route
          path="settings"
          element={
            <SetupRequired>
              <Settings />
            </SetupRequired>
          }
        />
        <Route
          path="orders"
          element={
            <SetupRequired>
              <Orders />
            </SetupRequired>
          }
        />
        <Route
          path="inventory"
          element={
            <SetupRequired>
              <Inventory />
            </SetupRequired>
          }
        />
        <Route
          path="analytics"
          element={
            <SetupRequired>
              <Analytics />
            </SetupRequired>
          }
        />
        <Route
          path="payouts"
          element={
            <SetupRequired>
              <Payouts />
            </SetupRequired>
          }
        />
        <Route path="billing" element={<Billing />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminOverview />} />
        <Route path="vendors" element={<AdminVendors />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payouts" element={<AdminPayouts />} />
        <Route path="subscriptions" element={<AdminSubscriptions />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="verification" element={<AdminVerification />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="plans" element={<AdminPlans />} />
        <Route path="security-logs" element={<AdminSecurityLogs />} />
        <Route path="system-health" element={<AdminSystemHealth />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="totp/setup" element={<Navigate to="/admin/settings" replace />} />
        <Route path="totp-setup" element={<Navigate to="/admin/settings" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
