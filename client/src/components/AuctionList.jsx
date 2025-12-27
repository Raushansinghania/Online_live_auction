import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AuctionCard from './AuctionCard';
import FilterBar from './FilterBar';

const AuctionList = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: 'All',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
        status: ''
    });

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const params = {
                search: filters.search,
                category: filters.category,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                sort: filters.sort,
                status: filters.status
            };
            const response = await axios.get('http://localhost:3001/api/auctions', { params });
            setAuctions(response.data);
        } catch (error) {
            console.error("Error fetching auctions:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuctions();
    }, [filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    return (
        <div className="pt-24 pb-12">
            <div className="mb-12">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-3 font-['Outfit']">
                    Live Auctions
                </h1>
                <p className="text-slate-400 text-lg">Discover unique items and place your bids in real-time.</p>
            </div>

            <FilterBar onFilterChange={handleFilterChange} />

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                </div>
            ) : auctions.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                    <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-500 text-xl font-light">No auctions found matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {auctions.map((auction, index) => (
                        <div
                            key={auction._id}
                            className="animate-fade-in-up opacity-0"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <AuctionCard auction={auction} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuctionList;
