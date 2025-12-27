const express = require('express');
const router = express.Router();
const authSeller = require('../middleware/authSeller');
const Auction = require('../models/Auction');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Create auction (seller protected)
router.post('/create', authSeller, async (req, res) => {
    const { title, description, imageUrl, images, startingBid, endTime } = req.body;
    if (!title || !description || !startingBid || !endTime) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure images is an array
    let imageArray = images || [];
    // If imageUrl is provided but not in images array, add it? 
    // Or if only imageUrl provided, make it the first image.
    if (imageUrl && imageArray.length === 0) {
        imageArray = [imageUrl];
    }

    // Backward compatibility: Ensure imageUrl is set (use first image)
    const mainImage = imageUrl || (imageArray.length > 0 ? imageArray[0] : '');

    try {
        const auction = new Auction({
            title,
            description,
            imageUrl: mainImage,
            images: imageArray,
            startingBid,
            currentBid: startingBid,
            endTime,
            createdBy: req.sellerId,
            seller: req.sellerId
        });
        await auction.save();
        res.status(201).json(auction);
    } catch (err) {
        console.error('Seller auction creation error:', err);
        res.status(500).json({ error: 'Failed to create auction' });
    }
});

// Get all auctions for a seller
router.get('/seller/:sellerId', authSeller, async (req, res) => {
    const { sellerId } = req.params;
    if (sellerId !== req.sellerId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const auctions = await Auction.find({ seller: sellerId })
            .populate('winner', 'username email');
        res.json(auctions);
    } catch (err) {
        console.error('Fetch seller auctions error:', err);
        res.status(500).json({ error: 'Failed to fetch auctions' });
    }
});

// Get won auctions (closed with winner) for seller
router.get('/won/:sellerId', authSeller, async (req, res) => {
    const { sellerId } = req.params;
    if (sellerId !== req.sellerId) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const auctions = await Auction.find({
            seller: sellerId,
            status: 'closed',
            winner: { $exists: true, $ne: null }
        }).populate('winner', 'username email');

        // Get payment status for each
        const auctionsWithPayments = await Promise.all(
            auctions.map(async (auction) => {
                const payment = await Payment.findOne({ auctionId: auction._id });
                return {
                    ...auction.toObject(),
                    paymentStatus: payment?.status || 'awaiting_payment',
                    paymentAmount: payment?.amount,
                    paymentId: payment?._id
                };
            })
        );

        res.json(auctionsWithPayments);
    } catch (err) {
        console.error('Fetch won auctions error:', err);
        res.status(500).json({ error: 'Failed to fetch won auctions' });
    }
});

// Get winner details for a specific auction
router.get('/:auctionId/winner', authSeller, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId)
            .populate('winner', 'username email');

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        if (auction.seller?.toString() !== req.sellerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!auction.winner) {
            return res.status(404).json({ error: 'No winner for this auction' });
        }

        // Get payment info
        const payment = await Payment.findOne({ auctionId: auction._id });

        res.json({
            auction: {
                id: auction._id,
                title: auction.title,
                finalBid: auction.currentBid
            },
            winner: auction.winner,
            payment: payment ? {
                status: payment.status,
                amount: payment.amount,
                buyerDetails: payment.buyerDetails,
                completedAt: payment.completedAt
            } : null
        });
    } catch (err) {
        console.error('Fetch winner details error:', err);
        res.status(500).json({ error: 'Failed to fetch winner details' });
    }
});

// Manually close auction and determine winner
router.post('/:auctionId/close', authSeller, async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId);

        if (!auction) {
            return res.status(404).json({ error: 'Auction not found' });
        }

        if (auction.seller?.toString() !== req.sellerId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (auction.status === 'closed') {
            return res.status(400).json({ error: 'Auction already closed' });
        }

        // Close the auction
        auction.status = 'closed';
        await auction.save();

        // If there's a winner, create notification
        if (auction.winner) {
            const winner = await User.findById(auction.winner);

            const notification = new Notification({
                sellerId: req.sellerId,
                auctionId: auction._id,
                type: 'auction_won',
                buyerInfo: {
                    username: winner.username,
                    email: winner.email,
                    userId: winner._id
                },
                amount: auction.currentBid,
                message: `Auction "${auction.title}" has ended! Winner: ${winner.username} with bid of $${auction.currentBid}`
            });
            await notification.save();

            // Emit socket event
            if (req.io) {
                req.io.emit('auction-closed', {
                    auctionId: auction._id,
                    winner: winner.username,
                    amount: auction.currentBid
                });
            }
        }

        res.json({
            message: 'Auction closed successfully',
            auction,
            hasWinner: !!auction.winner
        });
    } catch (err) {
        console.error('Close auction error:', err);
        res.status(500).json({ error: 'Failed to close auction' });
    }
});

module.exports = router;

