import React from 'react';

const ActivityHeatmap = ({ hourlyData = [], weekdayData = [] }) => {
    // Fill empty hours with 0
    const fullHourly = Array.from({ length: 24 }).map((_, i) => {
        const match = hourlyData.find(d => d.hour === i);
        return { hour: i, count: match ? match.count : 0 };
    });
    
    // Fill empty weekdays with 0 (0=Sun, 6=Sat)
    const fullWeekday = Array.from({ length: 7 }).map((_, i) => {
        const match = weekdayData.find(d => d.weekday === i);
        return { weekday: i, count: match ? match.count : 0 };
    });
    
    const maxHourly = Math.max(...fullHourly.map(d => d.count), 1);
    const maxWeekday = Math.max(...fullWeekday.map(d => d.count), 1);
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-6 w-full">
            <div>
                <div className="flex justify-between items-end mb-2">
                    <h4 className="text-sm font-medium text-slate-300">Transactions by Hour</h4>
                </div>
                <div className="flex gap-[2px]">
                    {fullHourly.map((d, i) => {
                        const intensity = d.count / maxHourly;
                        // Map intensity to opacity 0.2 to 1
                        const opacity = Math.max(0.2, intensity);
                        
                        return (
                            <div 
                                key={`hour-${i}`} 
                                className="flex-1 h-12 rounded-sm relative group cursor-pointer transition-transform hover:scale-110"
                                style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})` }}
                            >
                                <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 w-max bg-slate-800 text-xs text-slate-200 px-2 py-1 rounded border border-slate-700 pointer-events-none shadow-xl">
                                    Hour {i}: {d.count} transactions
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase font-semibold px-1">
                    <span>12am</span>
                    <span>6am</span>
                    <span>12pm</span>
                    <span>6pm</span>
                </div>
            </div>
            
            <div>
                <div className="flex justify-between items-end mb-2">
                    <h4 className="text-sm font-medium text-slate-300">Transactions by Day</h4>
                </div>
                <div className="flex gap-[4px]">
                    {fullWeekday.map((d, i) => {
                        const intensity = d.count / maxWeekday;
                        const opacity = Math.max(0.2, intensity);
                        const heightPct = Math.max(10, intensity * 100);
                        
                        return (
                            <div key={`day-${i}`} className="flex-1 flex flex-col items-center gap-1 group h-20 justify-end">
                                <div 
                                    className="w-full rounded-sm relative cursor-pointer transition-transform hover:-translate-y-1"
                                    style={{ backgroundColor: `rgba(99, 102, 241, ${opacity})`, height: `${heightPct}%` }}
                                >
                                    <div className="hidden group-hover:flex absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 w-max bg-slate-800 text-xs text-slate-200 px-2 py-1 rounded border border-slate-700 pointer-events-none shadow-xl flex-col items-center">
                                        <span className="font-bold">{dayNames[i]}</span>
                                        <span>{d.count} tx</span>
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-slate-500">{dayNames[i]}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActivityHeatmap;
