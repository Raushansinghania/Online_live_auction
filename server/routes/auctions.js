// routes/auctions.js
const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { closeExpiredAuctions } = require('../utils/auctionUtils');

// GET all active auctions with filters
router.get("/", async (req, res) => {
    try {
        const { search, minPrice, maxPrice, status, category, sort } = req.query;
        let query = {};

        // Search in title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Status filter (default to all if not specified, or handle as needed)
        // If frontend sends 'active', we filter by status.
        if (status) {
            query.status = status;
        }

        // Category filter
        if (category && category !== 'All') {
            query.category = category;
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.currentBid = {};
            if (minPrice) query.currentBid.$gte = Number(minPrice);
            if (maxPrice) query.currentBid.$lte = Number(maxPrice);
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { currentBid: 1 };
        if (sort === 'price_desc') sortOption = { currentBid: -1 };
        if (sort === 'ending_soon') sortOption = { endTime: 1 };

        const auctions = await Auction.find(query).sort(sortOption);
        res.json(auctions);
    } catch (err) {
        console.error("Fetch auctions error:", err);
        res.status(500).json({ error: "Failed to load auctions" });
    }
});

// GET auction details including bids
router.get("/:id", async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate("bids");

        if (!auction) return res.status(404).json({ error: "Auction not found" });

        res.json(auction);
    } catch (err) {
        console.error("Fetch auction error:", err);
        res.status(500).json({ error: "Failed to fetch auction" });
    }
});

// PLACE BID
router.post('/bid', auth, async (req, res) => {
    try {
        const { auctionId, amount } = req.body;
        console.log(`[BID REQUEST] User: ${req.userId}, Auction: ${auctionId}, Amount: ${amount}`);

        if (!auctionId || !amount) {
            return res.status(400).json({ error: 'Auction ID and bid amount required' });
        }

        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return res.status(400).json({ error: 'Bid amount must be a valid number' });
        }

        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ error: 'Auction not found' });

        if (auction.status !== "active") {
            return res.status(400).json({ error: "Auction is not active" });
        }

        if (new Date() > new Date(auction.endTime)) {
            return res.status(400).json({ error: "Auction has expired" });
        }

        // Initialize currentBid if it's undefined (fallback, should be seeded)
        const currentHighest = auction.currentBid || auction.startingBid || 0;

        if (numericAmount <= currentHighest) {
            return res.status(400).json({
                error: `Bid must be higher than current bid: $${currentHighest}`
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            console.error(`[BID ERROR] User not found for ID: ${req.userId}`);
            return res.status(404).json({ error: 'User not found' });
        }

        const bid = new Bid({
            auctionId,
            userId: user._id,
            username: user.username,
            amount: numericAmount,
            timestamp: new Date()
        });

        // Notify previous winner
        if (auction.winner) {
            const previousWinner = await User.findById(auction.winner);
            if (previousWinner && previousWinner._id.toString() !== user._id.toString()) {
                const { sendEmail } = require('../utils/emailService');
                // Don't await this to avoid blocking the bid response
                sendEmail(
                    previousWinner.email,
                    `Outbid Alert: ${auction.title}`,
                    `<p>You have been outbid on <b>${auction.title}</b>. The new current bid is $${numericAmount}. <a href="http://localhost:5173/auction/${auction._id}">Bid again now!</a></p>`
                ).catch(console.error);

                // Also create internal notification for outbid
                const Notification = require('../models/Notification');
                await Notification.create({
                    userId: previousWinner._id,
                    auctionId: auction._id,
                    type: "outbid",
                    message: `You were outbid on ${auction.title}!`
                });
            }
        }

        await bid.save();

        // Update auction
        auction.currentBid = numericAmount;
        auction.winner = user._id;
        await auction.save();

        console.log(`[BID SUCCESS] Bid placed on ${auctionId} for ${numericAmount}`);

        // Emit websocket event
        if (req.io) {
            req.io.emit("bid-update", {
                auctionId,
                newBid: numericAmount,
                bidder: user.username,
                history: bid, // Pass the full bid object for history update
                bid
            });
        }

        res.json({
            success: true,
            message: "Bid placed successfully",
            bid,
            currentBid: auction.currentBid
        });

    } catch (err) {
        console.error("Bid error:", err);
        res.status(500).json({ error: "Failed to place bid. Please try again." });
    }
});

// CLOSE EXPIRED AUCTIONS (manual trigger)
router.post("/close-expired", async (req, res) => {
    try {
        await closeExpiredAuctions(req.io);
        res.json({ message: "Expired auctions closed successfully" });
    } catch (err) {
        console.error("Close expired error:", err);
        res.status(500).json({ error: "Failed to close expired auctions" });
    }
});

module.exports = router;
