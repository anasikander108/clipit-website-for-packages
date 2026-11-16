import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { SiteProvider } from "./lib/site";
import { RequireAdmin, RequireAuth, RequireSupabase } from "./components/common";
import { LinkButton } from "./components/ui";
import Landing from "./pages/public/Landing";
import { Privacy, Terms } from "./pages/public/Legal";
import About from "./pages/public/About";
import { AuthCallback, ForgotPassword, Login, Register, ResetPassword, VerifyEmail } from "./pages/auth/Auth";
import { Checkout, CheckoutSubmitted } from "./pages/checkout/Checkout";
import {
  AccountSettings, DashboardLayout, DownloadPage, MySubscription, Overview, PaymentHistory, Support,
} from "./pages/dashboard/Dashboard";
import { AdminLayout, AdminOverview } from "./pages/admin/AdminLayout";
import { PaymentDetail, PaymentRequests } from "./pages/admin/Payments";
import { CustomerDetail, Customers, Subscriptions } from "./pages/admin/Customers";
import { ActivityLogs, BankSettingsPage, Releases, WebsiteSettingsPage } from "./pages/admin/Settings";

/** Scroll to the top on page changes, or to the #section in the URL. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView(), 0);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="font-mono text-[13px] text-muted">404</p>
      <h1 className="text-[26px] font-semibold tracking-[-0.02em]">This page does not exist</h1>
      <LinkButton to="/" variant="secondary" className="mt-3">Go to the homepage</LinkButton>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <AuthProvider>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            <Route path="/login" element={<RequireSupabase><Login /></RequireSupabase>} />
            <Route path="/register" element={<RequireSupabase><Register /></RequireSupabase>} />
            <Route path="/verify-email" element={<RequireSupabase><VerifyEmail /></RequireSupabase>} />
            <Route path="/auth/callback" element={<RequireSupabase><AuthCallback /></RequireSupabase>} />
            <Route path="/forgot-password" element={<RequireSupabase><ForgotPassword /></RequireSupabase>} />
            <Route path="/reset-password" element={<RequireSupabase><ResetPassword /></RequireSupabase>} />

            <Route path="/checkout/submitted" element={<RequireAuth><CheckoutSubmitted /></RequireAuth>} />
            <Route path="/checkout/:slug" element={<RequireAuth><Checkout /></RequireAuth>} />

            <Route path="/dashboard" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
              <Route index element={<Overview />} />
              <Route path="subscription" element={<MySubscription />} />
              <Route path="download" element={<DownloadPage />} />
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="settings" element={<AccountSettings />} />
              <Route path="support" element={<Support />} />
            </Route>

            <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
              <Route index element={<AdminOverview />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="payments" element={<PaymentRequests />} />
              <Route path="payments/:id" element={<PaymentDetail />} />
              <Route path="subscriptions" element={<Subscriptions />} />
              <Route path="releases" element={<Releases />} />
              <Route path="bank" element={<BankSettingsPage />} />
              <Route path="settings" element={<WebsiteSettingsPage />} />
              <Route path="activity" element={<ActivityLogs />} />
            </Route>

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  );
}
