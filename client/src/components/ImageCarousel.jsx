import React, { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

const ImageCarousel = ({ images, title }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Ensure we have an array
    const imageList = Array.isArray(images) && images.length > 0 ? images : [];

    if (imageList.length === 0) {
        return (
            <div className="w-full h-96 bg-slate-800 rounded-xl flex items-center justify-center">
                <span className="text-slate-500">No image available</span>
            </div>
        );
    }

    if (imageList.length === 1) {
        return (
            <img
                src={imageList[0]}
                alt={title}
                className="w-full h-full object-cover rounded-xl"
            />
        );
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
    };

    return (
        <div className="relative group w-full h-full">
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-slate-900">
                <img
                    src={imageList[currentIndex]}
                    alt={`${title} - View ${currentIndex + 1}`}
                    className="w-full h-full object-cover transition-opacity duration-300"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={(e) => { e.preventDefault(); prevImage(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all transform hover:scale-110"
            >
                <LuChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={(e) => { e.preventDefault(); nextImage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/60 transition-all transform hover:scale-110"
            >
                <LuChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {imageList.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.preventDefault(); setCurrentIndex(idx); }}
                        className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                ? 'bg-cyan-400 w-4'
                                : 'bg-white/50 hover:bg-white/80'
                            }`}
                    />
                ))}
            </div>

            {/* Live/Status Badge usually goes here, but parent handles it absolutely positioned */}
        </div>
    );
};

export default ImageCarousel;
