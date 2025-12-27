const express = require('express');
const { closeExpiredAuctions } = require('./utils/auctionUtils');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctions');
const sellerAuthRoutes = require('./routes/sellerAuth');
const sellerAuctionRoutes = require('./routes/sellerAuction');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes = require('./routes/payments');
const bidRoutes = require('./routes/bids');
const userRoutes = require('./routes/users');
const reviewRoutes = require('./routes/reviews');
const Auction = require('./models/Auction');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Make io available in routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/auction_portal';
mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        // Seed data if empty
        const count = await Auction.countDocuments();
        if (count === 0) {
            console.log('Seeding initial data...');
            await Auction.create([
                {
                    title: "Vintage Camera",
                    description: "A classic 1950s limited edition camera.",
                    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=80",
                    startingBid: 50,
                    currentBid: 150,
                    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24)
                },
                {
                    title: "Mechanical Keyboard",
                    description: "Custom built mechanical keyboard with distinct switches.",
                    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=1000&q=80",
                    startingBid: 20,
                    currentBid: 99,
                    endTime: new Date(Date.now() + 1000 * 60 * 60 * 12)
                }
            ]);
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/seller', sellerAuthRoutes);
app.use('/api/auction/seller', sellerAuctionRoutes);
app.use('/api/seller/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Checks for expired auctions every 30 seconds
setInterval(async () => {
    await closeExpiredAuctions(io);
}, 30000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
