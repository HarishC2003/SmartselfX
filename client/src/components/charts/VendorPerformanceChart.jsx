import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-lg shadow-xl text-sm">
                <p className="font-bold text-white mb-2">{data.vendorName || data.name}</p>
                <div className="space-y-1 text-slate-300">
                    <p>Total POs: <span className="font-bold text-white">{data.totalPOs || data.poCount || 0}</span></p>
                    <p>Total Value: <span className="font-bold text-white">₹{(data.totalValue || data.value || 0).toLocaleString()}</span></p>
                    <p>On-Time Rate: <span className="font-bold text-white">{(data.onTimeRate || 0).toFixed(1)}%</span></p>
                    <p>Approval Rate: <span className="font-bold text-white">{(data.approvalRate || 0).toFixed(1)}%</span></p>
                </div>
            </div>
        );
    }
    return null;
};

const VendorPerformanceChart = ({ data, metric = 'onTimeRate', height = '100%' }) => {
    // Sort descending by metric
    const sortedData = [...data].sort((a, b) => {
        const valA = a[metric] || 0;
        const valB = b[metric] || 0;
        return valB - valA;
    });

    const getBarColor = (entry) => {
        const rate = entry.onTimeRate || 0;
        if (rate >= 90) return '#22C55E'; // green
        if (rate >= 70) return '#F59E0B'; // amber
        return '#EF4444'; // red
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart layout="vertical" data={sortedData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="vendorName" type="category" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#0F172A' }} />
                <Bar dataKey={metric} radius={[0, 4, 4, 0]}>
                    {sortedData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default VendorPerformanceChart;
