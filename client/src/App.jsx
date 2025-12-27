import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SellerAuthProvider } from './context/SellerAuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import ThreeBackground from './components/ThreeBackground';
import SellerPrivateRoute from './components/SellerPrivateRoute';
import Footer from './components/Footer';

// Buyer Pages
import LandingPage from './pages/LandingPage';
import AuctionList from './components/AuctionList';
import AuctionDetail from './components/AuctionDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyBids from './pages/MyBids';
import Watchlist from './pages/Watchlist';
import PaymentPage from './pages/PaymentPage';
import SellerPublicProfile from './pages/SellerPublicProfile';
import NotFound from './pages/NotFound';

// Seller Pages
import SellerLogin from './pages/seller/SellerLogin';
import SellerRegister from './pages/seller/SellerRegister';
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProfile from './pages/seller/SellerProfile';

const AppContent = () => {
    const { isDark } = useTheme();
    const isLandingPage = location.pathname === '/';

    return (
        <div className={`min-h-screen ${isLandingPage ? '' : 'pt-20'} relative transition-colors duration-300`}>
            {/* 
                Show AnimatedBackground on Landing Page (Dark Mode only is typical, but user might want it everywhere. 
                For now, let's keep Animated one strict or update it too? 
                User asked for "this same background" (ThreeBackground) for light theme.
                So we enable ThreeBackground for non-landing pages regardless of theme.
            */}
            {/* 
                Persistent ThreeBackground to maintain WebGL context.
                AnimatedBackground overlays it on Landing Page (Dark Mode).
            */}
            <ThreeBackground />
            {isLandingPage && isDark && <AnimatedBackground />}

            <Navbar />
            <main className={`${isLandingPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} relative z-10`}>
                <Routes>
                    {/* Buyer Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/auctions" element={<AuctionList />} />
                    <Route path="/auction/:id" element={<AuctionDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/my-bids" element={<MyBids />} />
                    <Route path="/watchlist" element={<Watchlist />} />
                    <Route path="/payments" element={<PaymentPage />} />
                    <Route path="/seller/view/:id" element={<SellerPublicProfile />} />

                    {/* Seller Routes */}
                    <Route path="/seller/login" element={<SellerLogin />} />
                    <Route path="/seller/register" element={<SellerRegister />} />
                    <Route path="/seller/dashboard" element={
                        <SellerPrivateRoute><SellerDashboard /></SellerPrivateRoute>
                    } />
                    <Route path="/seller/profile" element={
                        <SellerPrivateRoute><SellerProfile /></SellerPrivateRoute>
                    } />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>
            {isLandingPage && <Footer />}
        </div>
    );
};

function App() {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <SellerAuthProvider>
                        <ToastProvider>
                            <AppContent />
                        </ToastProvider>
                    </SellerAuthProvider>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;

