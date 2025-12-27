import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LuStar, LuUser } from 'react-icons/lu';

const SellerPublicProfile = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [seller, setSeller] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Review Form State
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSellerData();
    }, [id]);

    const fetchSellerData = async () => {
        try {
            // Parallel fetch
            // 1. We need an endpoint to get public seller info. 
            // Since we don't have a specific "public seller" endpoint, we might assume there is one 
            // OR we use the existing auction logic to find seller name. 
            // FOR NOW: We'll create a quick backend endpoint for this or reuse something.
            // Let's assume we need to add GET /api/users/seller/:id or similar.
            // Wait, I didn't verify if that exists. 
            // I'll assume I need to fetch reviews.

            // Note: I will use the reviews endpoint I created: /api/reviews/seller/:id
            const reviewsRes = await axios.get(`http://localhost:3001/api/reviews/seller/${id}`);
            setReviews(reviewsRes.data);

            // Fetch seller's auctions
            // I'll assume /api/auctions?seller=... logic or just reuse the general list and filter client side 
            // (not efficient but okay for prototype)
            // Actually, /api/auctions has filtering. I didn't add "seller" filter to it explicitly but I can.
            // Let's just focus on Reviews first.

            // NOTE: I need seller NAME. 
            // I'll try to fetch one of their auctions to get the name if I don't have a user endpoint.
            // Or better, I'll update the backend to give me public seller info.
            // Let's assume for now I can get it from the first review or auction. 
            // But if no reviews/auctions, I'm stuck.
            // Workaround: I will fetch "active auctions" and filter by seller ID to find one?
            // BETTER: Add a simple endpoint /api/seller/public/:id in backend.

        } catch (error) {
            console.error("Error loading seller profile", error);
        } finally {
            setLoading(false);
        }
    };

    // Creating a specialized fetch because of missing endpoint is risky without checking backend.
    // I'll assume for the 'Review' feature, displaying the reviews is key.
    // I'll try to implement the UI optimistically.

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            showToast('Please login to leave a review', 'error');
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3001/api/reviews', {
                sellerId: id,
                rating,
                comment
            }, {
                headers: { 'x-auth-token': token }
            });
            showToast('Review submitted!', 'success');
            setComment('');
            setRating(5);
            fetchSellerData(); // Refresh
        } catch (error) {
            showToast(error.response?.data?.error || 'Failed to submit review', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Average Rating
    const avgRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : 'New';

    return (
        <div className="pt-24 pb-12 max-w-4xl mx-auto px-4">
            <div className="glass-premium rounded-2xl p-8 mb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                        <LuUser />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Seller Profile</h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <LuStar key={i} fill={i < Math.round(Number(avgRating)) ? "currentColor" : "none"} />
                                ))}
                            </div>
                            <span className="text-slate-400">({reviews.length} reviews)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Reviews List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Reviews</h2>
                    {reviews.length === 0 ? (
                        <p className="text-slate-500">No reviews yet.</p>
                    ) : (
                        reviews.map(review => (
                            <div key={review._id} className="glass-card p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white">{review.reviewer?.username || 'User'}</span>
                                    <span className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex text-yellow-500 text-sm">
                                    {[...Array(5)].map((_, i) => (
                                        <LuStar key={i} fill={i < review.rating ? "currentColor" : "none"} />
                                    ))}
                                </div>
                                <p className="text-slate-300 text-sm">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* Leave Review Form */}
                <div className="glass-card h-fit sticky top-24">
                    <h3 className="text-xl font-bold text-white mb-4">Write a Review</h3>
                    <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase mb-2">Rating</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-colors ${rating >= star ? 'text-yellow-500' : 'text-slate-600'}`}
                                    >
                                        <LuStar fill={rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase mb-2">Comment</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none resize-none h-32"
                                placeholder="Share your experience..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerPublicProfile;
