import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

const TOUR_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to SmartShelfX 👋',
        desc: 'Take a quick tour to learn how to monitor your inventory, automate restocks, and leverage AI forecasts.',
        target: null
    },
    {
        id: 'sidebar',
        title: 'Navigation Sidebar',
        desc: 'This is your navigation. Access all modules, intelligence analytics, and settings from here.',
        target: '#tour-sidebar'
    },
    {
        id: 'kpis',
        title: 'Dashboard KPIs',
        desc: 'These cards show your overall inventory health, alert states, and AI accuracy at a glance.',
        target: '#tour-kpis'
    },
    {
        id: 'bell',
        title: 'Notification Bell',
        desc: 'Alerts appear here when stock is low, APIs disconnect, or POs need attention.',
        target: '#tour-bell'
    },
    {
        id: 'actions',
        title: 'Quick Actions',
        desc: 'Use these quick shortcuts to record immediate Stock Ins/Outs or jump to generate new POs.',
        target: '#tour-quick-actions'
    },
    {
        id: 'search',
        title: 'Global Search',
        desc: 'Press Ctrl+K anytime, anywhere to instantly search across your entire product base, users, and orders.',
        target: '#tour-search'
    },
    {
        id: 'finish',
        title: 'You\'re all set! 🎉',
        desc: 'Explore SmartShelfX and start managing your intelligent inventory smarter.',
        target: null
    }
];

const OnboardingTour = () => {
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [rect, setRect] = useState(null);

    useEffect(() => {
        const completed = localStorage.getItem('smartshelfx_tour_completed');
        if (!completed) {
            // Slight delay so DOM mounts
            setTimeout(() => setIsVisible(true), 500);
        }
    }, []);

    const updateRect = () => {
        if (!isVisible || stepIndex >= TOUR_STEPS.length) return;
        const targetId = TOUR_STEPS[stepIndex].target;
        if (!targetId) {
            setRect(null);
            return;
        }

        const el = document.querySelector(targetId);
        if (el) {
            const { top, left, width, height } = el.getBoundingClientRect();
            // Provide a small padding
            setRect({ 
                top: top - 8, 
                left: left - 8, 
                width: width + 16, 
                height: height + 16 
            });
        }
    };

    useEffect(() => {
        updateRect();
        window.addEventListener('resize', updateRect);
        return () => window.removeEventListener('resize', updateRect);
    }, [stepIndex, isVisible]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isVisible) {
                endTour();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible]);

    const endTour = () => {
        setIsVisible(false);
        localStorage.setItem('smartshelfx_tour_completed', 'true');
    };

    const nextStep = () => {
        if (stepIndex === TOUR_STEPS.length - 1) {
            endTour();
        } else {
            setStepIndex(s => s + 1);
        }
    };

    const prevStep = () => {
        if (stepIndex > 0) setStepIndex(s => s - 1);
    };

    if (!isVisible) return null;

    const currentStep = TOUR_STEPS[stepIndex];
    
    // Calculate tooltip position avoiding edges
    let tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    if (rect) {
        // Place tooltip below or right of the element generally
        const isBottomSpace = window.innerHeight - (rect.top + rect.height) > 250;
        const isRightSpace = window.innerWidth - (rect.left + rect.width) > 350;

        if (isRightSpace) {
            tooltipStyle = { top: Math.max(20, rect.top), left: rect.left + rect.width + 20 };
        } else if (isBottomSpace) {
            tooltipStyle = { top: rect.top + rect.height + 20, left: Math.max(20, rect.left) };
        } else {
            // fallback (often left or top)
            tooltipStyle = { bottom: window.innerHeight - rect.top + 20, right: window.innerWidth - (rect.left + rect.width) + 20 };
        }
    }

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
            {/* Dark Mask with SVG Cutout */}
            <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none transition-all duration-300">
                <defs>
                    <mask id="cutout-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {rect && (
                            <rect 
                                x={rect.left} 
                                y={rect.top} 
                                width={rect.width} 
                                height={rect.height} 
                                rx="8" 
                                fill="black" 
                                className="transition-all duration-300 ease-in-out"
                            />
                        )}
                    </mask>
                </defs>
                <rect 
                    x="0" 
                    y="0" 
                    width="100%" 
                    height="100%" 
                    fill="rgba(15, 23, 42, 0.7)" 
                    mask="url(#cutout-mask)" 
                    className="backdrop-blur-[2px]"
                />
            </svg>

            {/* Glowing Border around Rect */}
            {rect && (
                <div 
                    className="absolute border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-lg pointer-events-none transition-all duration-300 ease-in-out"
                    style={{
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    }}
                />
            )}

            {/* Tooltip Dialog */}
            <div 
                className={`absolute bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl p-6 w-[340px] pointer-events-auto transition-all duration-300 ease-in-out ${!rect ? 'animate-in zoom-in-95' : ''}`}
                style={tooltipStyle}
            >
                <button onClick={endTour} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">
                    <X className="w-4 h-4" />
                </button>
                
                <div className="mb-2 uppercase text-[10px] font-bold tracking-widest text-indigo-400">
                    Step {stepIndex + 1} of {TOUR_STEPS.length}
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2">{currentStep.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {currentStep.desc}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === stepIndex ? 'bg-indigo-500' : 'bg-slate-700'}`} />
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {stepIndex === 0 ? (
                            <>
                                <button onClick={endTour} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition">Skip Tour</button>
                                <button onClick={nextStep} className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">Start Tour &rarr;</button>
                            </>
                        ) : stepIndex === TOUR_STEPS.length - 1 ? (
                            <button onClick={endTour} className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition">Finish Setup &rarr;</button>
                        ) : (
                            <>
                                <button onClick={prevStep} className="p-2 text-slate-400 hover:text-white transition"><ChevronLeft className="w-4 h-4" /></button>
                                <button onClick={nextStep} className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1">Next <ChevronRight className="w-4 h-4" /></button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingTour;
