const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');
const Seller = require('../models/Seller');

// POST /api/reviews - Create a review
router.post('/', auth, async (req, res) => {
    try {
        const { sellerId, rating, comment } = req.body;

        // Prevent self-review if we allowed seller->seller interaction, but here user->seller
        // Check if seller exists
        const seller = await Seller.findById(sellerId);
        if (!seller) return res.status(404).json({ error: 'Seller not found' });

        const review = new Review({
            reviewer: req.user.id,
            seller: sellerId,
            rating,
            comment
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        console.error('Create review error:', err);
        res.status(500).json({ error: 'Failed to post review' });
    }
});

// GET /api/reviews/seller/:sellerId - Get reviews for a seller
router.get('/seller/:sellerId', async (req, res) => {
    try {
        const reviews = await Review.find({ seller: req.params.sellerId })
            .populate('reviewer', 'username')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error('Fetch reviews error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

module.exports = router;
