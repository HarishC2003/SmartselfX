import React, { useState, useEffect } from 'react';
import { PackageOpen, Home, ArrowLeft, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background */}
            <div
                className="absolute w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-700 ease-out"
                style={{
                    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                    left: mousePos.x - 300,
                    top: mousePos.y - 300,
                }}
            />
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-500/30 rounded-full animate-ping" />
            <div className="absolute top-3/4 right-1/4 w-1.5 h-1.5 bg-cyan-500/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-500/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />

            {/* Floating shelves */}
            <div className="absolute opacity-5 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded"
                        style={{
                            width: `${60 + Math.random() * 120}px`,
                            height: '3px',
                            left: `${-200 + Math.random() * 400}px`,
                            top: `${-200 + Math.random() * 400}px`,
                            transform: `rotate(${-5 + Math.random() * 10}deg)`,
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 text-center max-w-lg">
                {/* Icon */}
                <div className="relative flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-2xl animate-pulse" />
                        <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-3xl border border-white/5">
                            <PackageOpen className="h-16 w-16 text-indigo-400" />
                        </div>
                    </div>
                </div>

                {/* 404 Text */}
                <h1 className="text-[120px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-cyan-400 mb-2 select-none">
                    404
                </h1>
                <h2 className="text-3xl font-bold text-white mb-4">Shelf Not Found</h2>
                <p className="text-lg text-slate-400 mb-10 leading-relaxed">
                    The page you're looking for doesn't exist or has been moved to another warehouse.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link to="/dashboard">
                        <button className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-semibold hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5">
                            <Home className="w-5 h-5" /> Go to Dashboard
                        </button>
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2.5 px-8 py-3.5 bg-surface text-slate-300 rounded-2xl font-semibold border border-white/10 hover:bg-white/5 hover:text-white transition-all hover:-translate-y-0.5"
                    >
                        <ArrowLeft className="w-5 h-5" /> Go Back
                    </button>
                </div>

                {/* Keyboard shortcut hint */}
                <p className="mt-10 text-sm text-slate-600 flex items-center justify-center gap-2">
                    <Search className="w-3.5 h-3.5" />
                    Press <kbd className="px-2 py-0.5 bg-surface rounded text-[11px] font-mono border border-white/10">Ctrl+K</kbd> to search
                </p>
            </div>
        </div>
    );
};

export default NotFoundPage;
