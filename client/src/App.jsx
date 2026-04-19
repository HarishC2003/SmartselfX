import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { Loader } from './components/ui/Loader';
import ProtectedRoute from './components/auth/ProtectedRoute';
import GlobalSearch from './components/search/GlobalSearch';
import OnboardingTour from './components/onboarding/OnboardingTour';

// Lazy loading pages
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const EmailVerificationPage = React.lazy(() => import('./pages/EmailVerificationPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));

const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const InventoryReportPage = React.lazy(() => import('./pages/reports/InventoryReportPage'));
const VendorReportPage = React.lazy(() => import('./pages/reports/VendorReportPage'));
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage'));
const AuditLogPage = React.lazy(() => import('./pages/admin/AuditLogPage'));
const SystemHealthPage = React.lazy(() => import('./pages/admin/SystemHealthPage'));

import UserManagementPage from './pages/admin/UserManagementPage';
const VendorDeclarationsPage = React.lazy(() => import('./pages/admin/VendorDeclarationsPage'));
const MyStockPage = React.lazy(() => import('./pages/vendor/MyStockPage'));
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import TransactionsPage from './pages/TransactionsPage';
import TransactionAnalyticsPage from './pages/TransactionAnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import { ProductProvider } from './context/ProductContext';
import { AlertProvider } from './context/AlertContext';
import { ForecastProvider } from './context/ForecastContext';
import { TransactionProvider } from './context/TransactionContext';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import ForecastPage from './pages/ForecastPage';
import PurchaseOrdersPage from './pages/PurchaseOrdersPage';
import RestockRecommendationsPage from './pages/RestockRecommendationsPage';
import VendorPortalPage from './pages/vendor/VendorPortalPage';
import POEmailActionPage from './pages/vendor/POEmailActionPage';
import { DeclarationProvider } from './context/DeclarationContext';

const RouteTransitionWrapper = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    useEffect(() => {
        if (location.pathname !== displayLocation.pathname) {
            setTransitionStage('fadeOut');
            setTimeout(() => {
                setDisplayLocation(location);
                setTransitionStage('fadeIn');
            }, 150);
        }
    }, [location, displayLocation]);

    return (
        <div 
            className={`transition-opacity transition-transform ${transitionStage === 'fadeIn' ? 'opacity-100 duration-200' : 'opacity-0 duration-150'}`}
        >
            <Routes location={displayLocation}>
                {children}
            </Routes>
        </div>
    );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastProvider />
        <GlobalSearch />
        <OnboardingTour />
        <ProductProvider>
          <AlertProvider>
            <ForecastProvider>
              <TransactionProvider>
                <PurchaseOrderProvider>
                  <AnalyticsProvider>
                    <DeclarationProvider>
                      <Suspense fallback={<Loader fullScreen />}>
                        <RouteTransitionWrapper>
                      {/* Public Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                      <Route path="/verify-email/:token" element={<EmailVerificationPage />} />

                      {/* Public PO Actions (Token driven) */}
                      <Route path="/vendor-portal/po/:id/approve" element={<POEmailActionPage />} />
                      <Route path="/vendor-portal/po/:id/reject" element={<POEmailActionPage />} />

                      {/* Base redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />

                      {/* Protected Routes - All authenticated users */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'VENDOR']}>
                          <DashboardPage />
                        </ProtectedRoute>
                      } />

                      {/* Admin only routes */}
                      <Route path="/users" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <UserManagementPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor-declarations" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <VendorDeclarationsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/audit-logs" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <AuditLogPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/system-health" element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                          <SystemHealthPage />
                        </ProtectedRoute>
                      } />

                      {/* Settings — all roles */}
                      <Route path="/settings" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'VENDOR']}>
                          <SettingsPage />
                        </ProtectedRoute>
                      } />

                      {/* Admin & Manager Routes */}
                      <Route path="/products" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <ProductsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/products/:id" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <ProductDetailPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/categories" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <CategoriesPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/transactions" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'VENDOR']}>
                          <TransactionsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/transactions/analytics" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <TransactionAnalyticsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/purchase-orders" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'VENDOR']}>
                          <PurchaseOrdersPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/purchase-orders/recommendations" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <RestockRecommendationsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/forecast" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <ForecastPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/alerts" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <AlertsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <AnalyticsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics/inventory" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <InventoryReportPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics/vendors" element={
                        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
                          <VendorReportPage />
                        </ProtectedRoute>
                      } />

                      {/* Vendor Portal */}
                      <Route path="/vendor-portal" element={
                        <ProtectedRoute allowedRoles={['VENDOR']}>
                          <VendorPortalPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor-portal/my-stock" element={
                        <ProtectedRoute allowedRoles={['VENDOR']}>
                          <MyStockPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor-products" element={
                        <ProtectedRoute allowedRoles={['VENDOR']}>
                          <ProductsPage />
                        </ProtectedRoute>
                      } />
                      <Route path="/vendor-products/:id" element={
                        <ProtectedRoute allowedRoles={['VENDOR']}>
                          <ProductDetailPage />
                        </ProtectedRoute>
                      } />

                      {/* Error Routes */}

                      <Route path="*" element={<NotFoundPage />} />
                      </RouteTransitionWrapper>
                    </Suspense>
                    </DeclarationProvider>
                  </AnalyticsProvider>
                </PurchaseOrderProvider>
              </TransactionProvider>
            </ForecastProvider>
          </AlertProvider>
        </ProductProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
