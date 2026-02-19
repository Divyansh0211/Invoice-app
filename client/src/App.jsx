import { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/authContext';
import AuthContext from './context/authContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetails from './pages/InvoiceDetails';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Reports from './pages/Reports';
import Invoices from './pages/Invoices';
import Staff from './pages/Staff';
import Communication from './pages/Communication';
import Expenses from './pages/Expenses';
import './index.css';

import Sidebar from './components/Sidebar';
import Settings from './pages/Settings';
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './pages/ForgotPassword';

const MainLayout = () => {
  return (
    <div className="app-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="content-wrapper">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      console.log('App: User settings:', user.settings);
    }
    if (user && user.settings && user.settings.themeColor) {
      console.log('App: Applying theme color:', user.settings.themeColor);
      document.documentElement.style.setProperty('--primary-color', user.settings.themeColor);
    }
  }, [user]);

  return (
    <Router>
      <Routes>
        {/* Public Routes - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes - Wrapped in PrivateRoute and MainLayout */}
        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/create-invoice" element={<InvoiceForm />} />
            <Route path="/edit-invoice/:id" element={<InvoiceForm />} />
            <Route path="/invoice/:id" element={<InvoiceDetails />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/communication" element={<Communication />} />
            <Route path="/products" element={<Products />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
