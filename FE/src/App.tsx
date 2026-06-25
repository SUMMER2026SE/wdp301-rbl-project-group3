import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CartProvider } from './contexts/CartContext'
import { useEffect, useState } from 'react'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { MaintenancePage } from './pages/MaintenancePage'
import {
  DashboardLayout,
  DashboardOverview,
  OrdersPage,
  FavoritesPage,
  DashboardProfilePage,
  AddressesPage,
  VouchersPage,
  SettingsPage,
} from './pages/userDashboard'
import { AdminLayout, ManageInventoryPage, ManageOrdersPage, ManageBranchesPage, ManageUsersPage, ManageCategoriesPage, ManagePromotionsPage, ManageSystemSettingsPage, ManageFlashSalesPage, ManageBannersPage } from './pages/adminDashboard'
import './App.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// ─── Maintenance Guard ─────────────────────────────────────────────────────────
// Reads /api/settings/public every 60 seconds.
// If maintenance_mode is true AND user is not admin/staff → show maintenance page.
const POLL_INTERVAL_MS = 60_000

function useMaintenanceMode(): boolean {
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/settings/public')
        const data = await res.json()
        const mode = data?.data?.settings?.maintenance_mode
        setIsMaintenanceActive(mode === true)
      } catch {
        // Network error → don't block the app
        setIsMaintenanceActive(false)
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return isMaintenanceActive
}

function AppRoutes() {
  const isMaintenanceActive = useMaintenanceMode()
  const location = useLocation()

  // Admin/staff users bypass maintenance mode
  const token = localStorage.getItem('accessToken')
  let isAdmin = false
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      isAdmin = ['admin', 'branch_manager', 'staff'].includes(payload?.role)
    } catch {}
  }

  const isMaintenance = isMaintenanceActive && !isAdmin

  // Do not block the /login path during maintenance so admins can log in
  if (isMaintenance && location.pathname !== '/login') {
    return <MaintenancePage />
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />

      {/* Customer Dashboard Routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardOverview />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="profile" element={<DashboardProfilePage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="vouchers" element={<VouchersPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin / Back-office Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<ManageOrdersPage />} />
        <Route path="inventory" element={<ManageInventoryPage />} />
        <Route path="branches" element={<ManageBranchesPage />} />
        <Route path="categories" element={<ManageCategoriesPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="promotions" element={<ManagePromotionsPage />} />
        <Route path="settings" element={<ManageSystemSettingsPage />} />
        <Route path="flash-sales" element={<ManageFlashSalesPage />} />
        <Route path="banners" element={<ManageBannersPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <Router>
          <AppRoutes />
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  )
}

export default App
