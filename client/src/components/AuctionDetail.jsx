import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Countdown from './Countdown';
import AuctionStatusBadge from './AuctionStatusBadge';
import ImageCarousel from './ImageCarousel';

import { LuHeart, LuShare2 } from 'react-icons/lu';

const socket = io('http://localhost:3001');

const AuctionDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [auction, setAuction] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [bidding, setBidding] = useState(false);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [bidAnimation, setBidAnimation] = useState(false);
    const bidDisplayRef = useRef(null);

    useEffect(() => {
        const fetchAuction = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/api/auctions/${id}`);
                setAuction(response.data);
                setBidAmount(response.data.currentBid + 10);
            } catch (error) {
                console.error("Error fetching auction:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAuction();

        // Poll for updates every 10 seconds
        const pollInterval = setInterval(fetchAuction, 10000);

        socket.on('bid-update', (data) => {
            if (data.auctionId === id) {
                setAuction(prev => ({
                    ...prev,
                    currentBid: data.newBid,
                    bids: [data.history, ...(prev.bids || [])].slice(0, 10)
                }));
                setBidAmount(prev => Math.max(prev, data.newBid + 10));

                // Trigger animation
                setBidAnimation(true);
                setTimeout(() => setBidAnimation(false), 500);
            }
        });

        return () => {
            clearInterval(pollInterval);
            socket.off('bid-update');
        };
    }, [id]);

    useEffect(() => {
        const checkWatchlist = async () => {
            if (user) {
                try {
                    const res = await axios.get('http://localhost:3001/api/users/watchlist', {
                        headers: { 'x-auth-token': localStorage.getItem('token') }
                    });
                    const isWatched = res.data.some(item => item._id === id || item === id);
                    setIsInWatchlist(isWatched);
                } catch (err) {
                    console.error("Error checking watchlist", err);
                }
            }
        };
        checkWatchlist();
    }, [id, user]);

    const validateBid = () => {
        if (!bidAmount || bidAmount.toString().trim() === '') {
            setError('Bid amount cannot be empty');
            return false;
        }
        if (isNaN(bidAmount) || parseInt(bidAmount) <= 0) {
            setError('Please enter a valid bid amount');
            return false;
        }
        if (parseInt(bidAmount) <= auction.currentBid) {
            setError(`Bid must be higher than current highest bid of $${auction.currentBid}`);
            return false;
        }
        return true;
    };

    const handleBid = async (e) => {
        e.preventDefault();
        console.log("Placing bid...");
        if (!user) {
            setError("Please login to place a bid");
            return;
        }

        setError('');

        if (!validateBid()) {
            return;
        }

        const amountToSend = parseInt(bidAmount);
        console.log(`Sending bid: ${amountToSend} for auction: ${id}`);

        setBidding(true);

        try {
            await axios.post('http://localhost:3001/api/auctions/bid', {
                auctionId: id,
                amount: amountToSend
            });
            showToast('Bid placed successfully!', 'success');
            // Optimistic update handles by socket, but we can reset form
            setBidAmount(amountToSend + 10);
            console.log("Bid success");
        } catch (err) {
            console.error("Bid error response:", err.response);
            const errorMsg = err.response?.data?.error || "Failed to place bid";
            setError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setBidding(false);
        }
    };

    const handleAuctionEnd = () => {
        setAuction(prev => ({ ...prev, status: 'closed' }));
    };

    const toggleWatchlist = async () => {
        if (!user) {
            showToast("Please login to add to watchlist", "error");
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };

            if (isInWatchlist) {
                await axios.delete(`http://localhost:3001/api/users/watchlist/${id}`, config);
                setIsInWatchlist(false);
                showToast("Removed from watchlist", "info");
            } else {
                await axios.post(`http://localhost:3001/api/users/watchlist/${id}`, {}, config);
                setIsInWatchlist(true);
                showToast("Added to watchlist", "success");
            }
        } catch (error) {
            console.error(error);
            showToast("Failed to update watchlist", "error");
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: auction.title,
            text: `Check out this ${auction.title} on LuxBid!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Error sharing', err);
                // Fallback to clipboard if share fails (e.g., user cancelled or not allowed)
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast("Link copied to clipboard!", "success");
                } catch (clipboardErr) {
                    showToast("Failed to copy link", "error");
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                showToast("Link copied to clipboard!", "success");
            } catch (err) {
                showToast("Failed to copy link", "error");
            }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
        </div>
    );

    if (!auction) return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Auction not found</h2>
            <Link to="/" className="text-cyan-400 hover:text-cyan-300">← Back to Auctions</Link>
        </div>
    );

    const isEnded = new Date() > new Date(auction.endTime) || auction.status === 'closed';

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-24 pb-12">
            {/* Left Column */}
            <div className="space-y-8 animate-slide-in-left">
                {/* Image Carousel */}
                <div className="relative rounded-2xl overflow-hidden glass-premium p-1 group h-[400px] lg:h-[500px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <ImageCarousel
                        images={auction.images && auction.images.length > 0 ? auction.images : [auction.imageUrl]}
                        title={auction.title}
                    />

                    <div className="absolute top-4 right-4 z-10">
                        <AuctionStatusBadge status={auction.status} endTime={auction.endTime} />
                    </div>

                    {!isEnded && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className="bg-black/60 backdrop-blur-md text-cyan-400 font-bold px-4 py-2 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-pulse flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                                LIVE AUCTION
                            </span>
                        </div>
                    )}
                </div>

                {/* Seller Info */}
                <div className="glass-card flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold text-white">
                            {typeof auction.seller === 'object' ? (auction.seller.sellername?.charAt(0).toUpperCase() || 'S') : 'S'}
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Seller</p>
                            <Link to={`/seller/view/${typeof auction.seller === 'object' ? auction.seller._id : auction.seller}`} className="text-white font-medium hover:text-cyan-400 transition-colors flex items-center gap-2">
                                {typeof auction.seller === 'object' ? (auction.seller.sellername || 'Verified Seller') : 'View Seller Profile'}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                    {/* Could add seller rating here if available */}
                </div>

                {/* Bid History */}
                <div className="glass-card">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 font-['Outfit']">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Live Activity
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {auction.bids && auction.bids.length > 0 ? (
                            auction.bids.map((bid, index) => (
                                <div key={index} className="flex justify-between items-center bg-white/[0.03] p-3 rounded-lg border border-white/[0.05] hover:bg-white/[0.08] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                            {bid.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-slate-200 block text-sm">{bid.username}</span>
                                            <span className="text-slate-500 text-xs">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <span className="font-bold text-cyan-400 font-['Space_Grotesk']">${bid.amount.toLocaleString()}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 text-center py-4 italic">No bids yet. Be the first!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8 animate-slide-in-right delay-200 opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div>
                    <div className="flex justify-between items-start">
                        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6 font-['Outfit'] drop-shadow-lg leading-tight">
                            {auction.title}
                        </h1>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleWatchlist}
                                className={`p-3 rounded-xl border transition-all ${isInWatchlist
                                    ? 'bg-red-500/20 border-red-500 text-red-400'
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                                title={isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                            >
                                <LuHeart className={`w-6 h-6 ${isInWatchlist ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={handleShare}
                                className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                                title="Share Auction"
                            >
                                <LuShare2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <p className="text-lg text-slate-400 leading-relaxed font-light border-l-2 border-cyan-500/30 pl-6">
                        {auction.description}
                    </p>
                </div>

                {/* Bid Panel - Glass Effect */}
                <div className="glass-premium rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] -z-10 rounded-full"></div>

                    <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-8">
                        <div>
                            <span className="text-slate-400 text-sm uppercase tracking-widest font-semibold block mb-2">Current Highest Bid</span>
                            <span
                                ref={bidDisplayRef}
                                className={`text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 font-['Space_Grotesk'] drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] ${bidAnimation ? 'animate-bid-pulse' : ''}`}
                            >
                                ${auction.currentBid.toLocaleString()}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-500 text-xs uppercase tracking-wider block mb-2">Time Remaining</span>
                            <Countdown endTime={auction.endTime} onEnd={handleAuctionEnd} />
                        </div>
                    </div>

                    {isEnded ? (
                        <div className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-xl p-6 text-center backdrop-blur-sm">
                            <p className="text-red-200 font-medium text-lg mb-2">Auction Has Ended</p>
                            <p className="text-slate-400 text-sm">Final bid: ${auction.currentBid.toLocaleString()}</p>
                        </div>
                    ) : !user ? (
                        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-xl p-6 text-center backdrop-blur-sm">
                            <p className="text-blue-200 mb-4 font-medium">Join the action to place a bid</p>
                            <Link to="/login" className="btn-primary inline-block px-8 py-3">Login Now</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleBid} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-3 uppercase tracking-wider">Place Your Bid</label>
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-cyan-400 transition-colors">$</span>
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => {
                                            setBidAmount(e.target.value);
                                            setError('');
                                        }}
                                        className="input-primary pl-10 text-xl font-['Space_Grotesk']"
                                        min={auction.currentBid + 1}
                                        placeholder={`Min $${auction.currentBid + 1}`}
                                        disabled={bidding}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2 text-right">Minimum bid increment: $10</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-slide-in">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={bidding}
                                className="btn-primary w-full py-4 text-lg shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] border border-white/20 relative overflow-hidden"
                            >
                                {bidding ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Placing Bid...
                                    </span>
                                ) : (
                                    'Place Bid'
                                )}
                            </button>
                        </form>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card text-center py-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Starting Bid</p>
                        <p className="text-xl font-bold text-white font-['Space_Grotesk']">${auction.startingBid?.toLocaleString() || 0}</p>
                    </div>
                    <div className="glass-card text-center py-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Bids</p>
                        <p className="text-xl font-bold text-cyan-400 font-['Space_Grotesk']">{auction.bids?.length || 0}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionDetail;
