import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import ProductManagement from "./pages/ProductManagement";
import Transactions from "./pages/Transactions";
import StockOpname from "./pages/StockOpname";
import ProductInventoryStatus from "./pages/ProductInventoryStatus";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Warehouse from "./pages/Warehouse";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import SetupPassword from "./pages/auth/SetupPassword";
import "./index.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes — no sidebar */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/new-input-password" element={<ForgotPassword />} />
          <Route path="/auth/setup-password" element={<SetupPassword />} />

          {/* App routes — with sidebar & protected */}
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<ProductManagement />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/stock-opname" element={<StockOpname />} />
                    <Route
                      path="/product-inventory"
                      element={<ProductInventoryStatus />}
                    />
                    <Route path="/warehouse" element={<Warehouse />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
