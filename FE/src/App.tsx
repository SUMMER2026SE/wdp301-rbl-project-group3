import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { CartProvider } from './contexts/CartContext'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { CheckoutPage } from './pages/CheckoutPage'
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
import { AdminLayout, ManageInventoryPage, ManageOrdersPage } from './pages/adminDashboard'
import './App.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CartProvider>
        <Router>
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
              <Route path="branches" element={<div className="py-12 text-center text-on-surface-variant">Trang Quản lý Chi nhánh đang được phát triển…</div>} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </GoogleOAuthProvider>
  )
}

export default App
