import React, { useState } from 'react';
import { LuSearch, LuFilter, LuX } from 'react-icons/lu';

const FilterBar = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        search: '',
        category: 'All',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
        status: '' // default empty = all
    });

    const [isExpanded, setIsExpanded] = useState(false);
    const [hideEnded, setHideEnded] = useState(false);

    const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Art', 'Vehicles', 'Collectibles', 'Other'];

    const handleChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        // Debounce search, but trigger others immediately
        if (key === 'search') {
            const timeoutId = setTimeout(() => {
                onFilterChange(newFilters);
            }, 500);
            return () => clearTimeout(timeoutId);
        } else {
            onFilterChange(newFilters);
        }
    };

    // Immediate trigger for search on enter or when this wrapper is called directly
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setFilters(prev => ({ ...prev, search: val }));
        // We pass the new value directly to parent to avoid closure stale state issues if needed, 
        // but here we just rely on the effect in parent or debounce.
        // Let's debounce the parent call.
    };

    // Dedicated effect for search debounce could be here, but simpler to just pass "filters" to parent 
    // and let parent fetch. 
    // Actually, let's just add a "Apply" button or debounce.
    // For "efficient" UX, real-time is nice.

    // Let's refine handleChange for search:
    const handleSearch = (e) => {
        const val = e.target.value;
        setFilters(prev => {
            const next = { ...prev, search: val };
            // Debounce the callback
            clearTimeout(window.searchTimeout);
            window.searchTimeout = setTimeout(() => {
                onFilterChange(next);
            }, 600);
            return next;
        });
    };


    return (
        <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-grow">
                    <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search auctions..."
                        value={filters.search}
                        onChange={handleSearch}
                        className="w-full bg-slate-800/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                    />
                </div>

                {/* Filter Toggle (Mobile) */}
                <button
                    className="md:hidden flex items-center justify-center gap-2 bg-slate-800/50 border border-white/10 rounded-xl p-3 text-slate-300"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <LuFilter /> Filters
                </button>

                {/* Desktop Filters Row */}
                <div className={`flex-col md:flex-row gap-4 ${isExpanded ? 'flex' : 'hidden md:flex'}`}>

                    {/* Category */}
                    <select
                        value={filters.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                    >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>

                    {/* Sort */}
                    <select
                        value={filters.sort}
                        onChange={(e) => handleChange('sort', e.target.value)}
                        className="bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                    >
                        <option value="newest">Newest</option>
                        <option value="ending_soon">Ending Soon</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Expanded Price Filters */}
            <div className={`p-4 bg-slate-800/30 rounded-xl border border-white/5 flex gap-4 items-center ${isExpanded || window.innerWidth > 768 ? 'block' : 'hidden'}`}>
                <span className="text-slate-400 text-sm">Price Range:</span>
                <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleChange('minPrice', e.target.value)}
                    className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-white w-24 text-sm"
                />
                <span className="text-slate-600">-</span>
                <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                    className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1 text-white w-24 text-sm focus:border-cyan-500/50 outline-none"
                />

                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
                    <input
                        type="checkbox"
                        id="hideEnded"
                        checked={hideEnded}
                        onChange={(e) => {
                            const isChecked = e.target.checked;
                            setHideEnded(isChecked);
                            handleChange('status', isChecked ? 'active' : '');
                        }}
                        className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-cyan-500 focus:ring-offset-0 focus:ring-1 focus:ring-cyan-500"
                    />
                    <label htmlFor="hideEnded" className="text-sm text-slate-300 cursor-pointer select-none">
                        Hide Ended
                    </label>
                </div>
            </div>
        </div>
    );
};

export default FilterBar;
