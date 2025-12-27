import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
    LuGavel,
    LuHeart,
    LuLayoutDashboard,
    LuTrendingUp,
    LuLogOut,
    LuLogIn,
    LuUserPlus,
    LuStore,
    LuSun,
    LuMoon,
    LuSparkles,
    LuUser,
    LuArrowRight
} from 'react-icons/lu';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();

    // Don't show buyer navbar on seller routes
    const isSellerRoute = location.pathname.startsWith('/seller');

    return (
        <nav className="fixed w-full top-0 z-50 glass-premium border-b border-white/[0.08] transition-all duration-300">
            <div className="w-full mx-auto px-8 lg:px-20">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center gap-4">
                        <Link
                            to={isSellerRoute ? "/seller/dashboard" : "/"}
                            className="flex items-center gap-3 group"
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
                                    <LuSparkles className="w-5 h-5 text-white" />
                                </div>
                                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight font-['Outfit'] bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-white group-hover:from-cyan-400 group-hover:via-white group-hover:to-purple-400 transition-all duration-300">
                                LUXBID
                            </span>
                        </Link>
                        {isSellerRoute && (
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-purple-500/20">
                                Seller
                            </span>
                        )}
                    </div>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        {!isSellerRoute ? (
                            // Buyer Navigation
                            <>
                                <NavLink to="/auctions" current={location.pathname} icon={<LuGavel className="w-4 h-4" />}>
                                    Auctions
                                </NavLink>

                                {user ? (
                                    <>
                                        <NavLink to="/dashboard" current={location.pathname} icon={<LuLayoutDashboard className="w-4 h-4" />}>
                                            Dashboard
                                        </NavLink>
                                        <NavLink to="/my-bids" current={location.pathname} icon={<LuTrendingUp className="w-4 h-4" />}>
                                            My Bids
                                        </NavLink>
                                        <NavLink to="/watchlist" current={location.pathname} icon={<LuHeart className="w-4 h-4" />}>
                                            Watchlist
                                        </NavLink>



                                        <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/[0.1]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                                    <LuUser className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-white tracking-wide">{user.username}</span>
                                                    <span className="text-[10px] text-cyan-400 font-medium tracking-wider uppercase">Pro Member</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={logout}
                                                className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] px-4 py-2.5 rounded-xl transition-all hover:border-white/[0.15] group"
                                            >
                                                <LuLogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                Logout
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-4 ml-10 pl-8 border-l border-white/[0.1]">
                                        <Link
                                            to="/login"
                                            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-white/[0.05]"
                                        >
                                            <LuLogIn className="w-4 h-4" />
                                            Login
                                        </Link>
                                        <Link
                                            to="/register"
                                            className="flex items-center gap-2 btn-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                                        >
                                            <LuUserPlus className="w-4 h-4" />
                                            Get Started
                                            <LuArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                )}

                                {/* Seller Portal Link */}
                                <Link
                                    to="/seller/login"
                                    className="flex items-center gap-2 ml-4 text-xs text-purple-400 hover:text-purple-300 transition-all border border-purple-500/30 px-4 py-2 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/50 font-medium"
                                >
                                    <LuStore className="w-4 h-4" />
                                    Seller Portal
                                </Link>
                            </>
                        ) : (
                            // Seller Navigation
                            <>
                                <NavLink to="/seller/dashboard" current={location.pathname} icon={<LuLayoutDashboard className="w-4 h-4" />}>
                                    Dashboard
                                </NavLink>
                                <NavLink to="/seller/profile" current={location.pathname} icon={<LuUser className="w-4 h-4" />}>
                                    Profile
                                </NavLink>
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 ml-4 text-xs text-cyan-400 hover:text-cyan-300 transition-all border border-cyan-500/30 px-4 py-2 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/50 font-medium"
                                >
                                    <LuGavel className="w-4 h-4" />
                                    Buyer Site
                                </Link>
                            </>
                        )}

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="ml-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all group"
                            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {isDark ? (
                                <LuSun className="w-5 h-5 text-yellow-400 group-hover:rotate-45 transition-transform duration-300" />
                            ) : (
                                <LuMoon className="w-5 h-5 text-slate-600 group-hover:-rotate-12 transition-transform duration-300" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, children, current, icon }) => {
    const isActive = current === to;
    return (
        <Link
            to={to}
            className={`flex items-center gap-2 text-sm font-medium transition-all px-4 py-2.5 rounded-xl relative group ${isActive
                ? 'text-cyan-400 bg-cyan-500/10'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
        >
            {icon}
            {children}
            {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full" />
            )}
        </Link>
    );
};

export default Navbar;

