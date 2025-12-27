import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

const Watchlist = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchWatchlist();
    }, [user]);

    const fetchWatchlist = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3001/api/users/watchlist', {
                headers: { 'x-auth-token': token }
            });
            setWatchlist(res.data);
        } catch (error) {
            console.error('Error fetching watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12">
            <div className="mb-10">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-3 font-['Outfit']">
                    My Watchlist
                </h1>
                <p className="text-slate-400 font-light text-lg">Auctions you are interested in</p>
            </div>

            {watchlist.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-400 text-lg mb-4">Your watchlist is empty</p>
                    <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium">
                        Explore Auctions →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {watchlist.map((auction, index) => (
                        <div key={auction._id || index} className="animate-fade-in-up">
                            <AuctionCard auction={auction} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Watchlist;
