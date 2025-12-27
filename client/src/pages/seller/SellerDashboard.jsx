import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSellerAuth } from '../../context/SellerAuthContext';
import { useToast } from '../../context/ToastContext';
import AuctionStatusBadge from '../../components/AuctionStatusBadge';
import Countdown from '../../components/Countdown';
import SellerNotifications from '../../components/SellerNotifications';

const SellerDashboard = () => {
    const { seller, getSellerToken, logoutSeller } = useSellerAuth();
    const { showToast } = useToast();

    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [sortBy, setSortBy] = useState('latest');
    const [selectedAuction, setSelectedAuction] = useState(null);
    const [bids, setBids] = useState([]);

    // Create auction form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        images: '', // Changed to allow multiple
        category: 'Other', // Added category
        startingBid: '',
        endTime: ''
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchAuctions();
    }, []);

    const fetchAuctions = async () => {
        try {
            const token = getSellerToken();
            const res = await axios.get(`http://localhost:3001/api/auction/seller/seller/${seller.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAuctions(res.data);
        } catch (error) {
            console.error('Error fetching auctions:', error);
            showToast('Failed to load auctions', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchBids = async (auctionId) => {
        try {
            const res = await axios.get(`http://localhost:3001/api/auctions/${auctionId}/bids`);
            setBids(res.data);
            setSelectedAuction(auctionId);
        } catch (error) {
            console.error('Error fetching bids:', error);
            showToast('Failed to load bids', 'error');
        }
    };

    const handleCreateAuction = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const token = getSellerToken();
            // Split images by comma or newline and filter empty
            const imageArray = formData.images.split(/[\n,]+/).map(url => url.trim()).filter(url => url.length > 0);

            await axios.post('http://localhost:3001/api/auction/seller/create', {
                ...formData,
                images: imageArray,
                imageUrl: imageArray[0] || '', // First image as main
                startingBid: parseFloat(formData.startingBid)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            showToast('Auction created successfully', 'success');
            setShowCreateForm(false);
            showToast('Auction created successfully', 'success');
            setShowCreateForm(false);
            setFormData({ title: '', description: '', images: '', category: 'Other', startingBid: '', endTime: '' });
            fetchAuctions();
        } catch (error) {
            console.error('Error creating auction:', error);
            showToast(error.response?.data?.error || 'Failed to create auction', 'error');
        } finally {
            setCreating(false);
        }
    };

    // Sort auctions
    const sortedAuctions = [...auctions].sort((a, b) => {
        switch (sortBy) {
            case 'highest':
                return b.currentBid - a.currentBid;
            case 'ending':
                return new Date(a.endTime) - new Date(b.endTime);
            case 'latest':
            default:
                return new Date(b.createdAt || b._id) - new Date(a.createdAt || a._id);
        }
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="pt-24 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Seller
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-['Outfit'] mb-4">
                        Seller Dashboard
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2 border-white/10">
                            {seller?.sellername?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-slate-400 font-light text-sm">Welcome back,</p>
                            <h2 className="text-xl font-bold text-white font-['Outfit']">{seller?.sellername}</h2>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <SellerNotifications />
                    <Link to="/seller/profile" className="px-4 py-2 glass border border-white/10 rounded-lg text-sm text-slate-300 hover:text-white hover:border-purple-500/50 transition-all">
                        Edit Profile
                    </Link>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-2 rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Auction
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <div className="glass-card bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-500/20">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Total Auctions</p>
                    <p className="text-4xl font-bold text-white font-['Space_Grotesk']">{auctions.length}</p>
                </div>
                <div className="glass-card bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-500/20">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Active</p>
                    <p className="text-4xl font-bold text-green-400 font-['Space_Grotesk']">
                        {auctions.filter(a => a.status === 'active' && new Date(a.endTime) > new Date()).length}
                    </p>
                </div>
                <div className="glass-card bg-gradient-to-br from-cyan-900/30 to-cyan-900/10 border border-cyan-500/20">
                    <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Total Bids Value</p>
                    <p className="text-4xl font-bold text-cyan-400 font-['Space_Grotesk']">
                        ${auctions.reduce((sum, a) => sum + a.currentBid, 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Sorting */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white font-['Outfit']">Your Auctions</h2>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-slate-300 focus:border-purple-500 focus:outline-none"
                >
                    <option value="latest">Latest Created</option>
                    <option value="highest">Highest Bid</option>
                    <option value="ending">Ending Soon</option>
                </select>
            </div>

            {/* Auctions Grid */}
            {sortedAuctions.length === 0 ? (
                <div className="glass-card text-center py-16">
                    <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <p className="text-slate-400 text-lg mb-4">No auctions yet</p>
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                        Create your first auction →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedAuctions.map(auction => (
                        <div key={auction._id} className="glass-card group overflow-hidden">
                            <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                                <img
                                    src={auction.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'}
                                    alt={auction.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3">
                                    <AuctionStatusBadge status={auction.status} endTime={auction.endTime} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 truncate">{auction.title}</h3>
                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{auction.description}</p>

                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider">Highest Bid</p>
                                    <p className="text-xl font-bold text-purple-400 font-['Space_Grotesk']">
                                        ${auction.currentBid.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time Left</p>
                                    <Countdown endTime={auction.endTime} />
                                </div>
                            </div>

                            <button
                                onClick={() => fetchBids(auction._id)}
                                className="w-full py-2 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-all text-sm font-medium"
                            >
                                View Bid History
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Auction Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-premium w-full max-w-lg p-8 rounded-2xl border border-purple-500/20 animate-scale-in">
                        <h3 className="text-2xl font-bold text-white mb-6 font-['Outfit']">Create New Auction</h3>

                        <form onSubmit={handleCreateAuction} className="space-y-4">
                            <div>
                                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="input-primary focus:border-purple-400"
                                    placeholder="Auction title"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input-primary focus:border-purple-400 min-h-[80px] resize-none"
                                    placeholder="Describe your item..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="input-primary focus:border-purple-400 appearance-none cursor-pointer"
                                >
                                    {['Electronics', 'Fashion', 'Home', 'Art', 'Vehicles', 'Collectibles', 'Other'].map(c => (
                                        <option key={c} value={c} className="bg-slate-900 text-slate-300">{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">Image URLs (One per line)</label>
                                <textarea
                                    value={formData.images}
                                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                                    className="input-primary focus:border-purple-400 min-h-[100px] resize-none font-mono text-xs"
                                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">Starting Bid ($)</label>
                                    <input
                                        type="number"
                                        value={formData.startingBid}
                                        onChange={(e) => setFormData({ ...formData, startingBid: e.target.value })}
                                        className="input-primary focus:border-purple-400"
                                        placeholder="100"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-widest mb-2">End Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="input-primary focus:border-purple-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="flex-1 py-3 border border-white/10 rounded-xl text-slate-300 hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
                                >
                                    {creating ? (
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    ) : 'Create Auction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bid History Modal */}
            {selectedAuction && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="glass-premium w-full max-w-md p-8 rounded-2xl border border-purple-500/20">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white font-['Outfit']">Bid History</h3>
                            <button
                                onClick={() => { setSelectedAuction(null); setBids([]); }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {bids.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">No bids yet</p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {bids.map((bid, index) => (
                                    <div key={bid._id || index} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {bid.username?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{bid.username}</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(bid.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold text-purple-400 font-['Space_Grotesk']">
                                            ${bid.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;
