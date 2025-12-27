// utils/auctionUtils.js (CommonJS FIXED)
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Notification = require("../models/Notification");

/**
 * Close expired auctions
 */
async function closeExpiredAuctions(io = null) {
    try {
        const now = new Date();
        console.log(`[AUCTION_bg] Checking for expired auctions at ${now.toISOString()}`);

        // Find all expired but still active auctions
        const expiredAuctions = await Auction.find({
            status: "active",
            endTime: { $lte: now }
        });

        if (expiredAuctions.length > 0) {
            console.log(`[AUCTION_bg] Found ${expiredAuctions.length} expired auctions to close.`);
        }

        for (const auction of expiredAuctions) {
            console.log(`[AUCTION_bg] Closing auction: ${auction.title} (${auction._id})`);

            const highestBid = await Bid.findOne({ auctionId: auction._id })
                .sort({ amount: -1 });

            if (highestBid) {
                console.log(`[AUCTION_bg] Winner found: ${highestBid.username} (${highestBid.userId}) with bid ${highestBid.amount}`);

                auction.winner = highestBid.userId;
                auction.currentBid = highestBid.amount;

                // Prevent duplicate notifications
                const exists = await Notification.findOne({
                    userId: highestBid.userId,
                    auctionId: auction._id,
                    type: "auction_won"
                });

                if (!exists) {
                    await Notification.create({
                        userId: highestBid.userId,
                        auctionId: auction._id,
                        type: "auction_won",
                        message: `You won the auction for ${auction.title}!`
                    });

                    // Send Email
                    const User = require('../models/User'); // Lazy load to avoid circular dependency if any
                    const { sendEmail } = require('./emailService');
                    const winnerUser = await User.findById(highestBid.userId);
                    if (winnerUser) {
                        await sendEmail(
                            winnerUser.email,
                            `You Won: ${auction.title}`,
                            `<h1>Congratulations!</h1><p>You have won the auction for <b>${auction.title}</b> with a bid of $${highestBid.amount}.</p>`
                        );
                    }
                }
            } else {
                console.log(`[AUCTION_bg] No bids found for ${auction._id}`);
            }

            auction.status = "closed";
            await auction.save();

            // Emit socket event
            if (io) {
                io.emit("auction-closed", {
                    auctionId: auction._id,
                    winner: auction.winner,
                    finalBid: auction.currentBid
                });
            }
        }
    } catch (err) {
        console.error("closeExpiredAuctions ERROR:", err);
    }
}

// Export correctly
module.exports = { closeExpiredAuctions };
