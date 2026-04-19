import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
    IN_STOCK: '#22C55E', // green
    LOW_STOCK: '#F59E0B', // amber
    OUT_OF_STOCK: '#EF4444', // red
    OVERSTOCKED: '#6366F1' // indigo
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[#1E293B] border border-[#334155] p-3 rounded-lg shadow-xl">
                <p className="font-semibold text-white">{data.name}</p>
                <div className="mt-2 text-sm text-slate-300">
                    <p>Count: <span className="font-bold text-white">{data.value}</span></p>
                    {data.percentage !== undefined && <p>Portion: <span className="font-bold text-white">{data.percentage.toFixed(1)}%</span></p>}
                </div>
            </div>
        );
    }
    return null;
};

const renderCustomCenteredLabel = (props) => {
    const { cx, cy, totalCount } = props;
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
            <tspan x={cx} dy="-0.5em" fill="#94A3B8" fontSize="12">Total Products</tspan>
            <tspan x={cx} dy="1.5em" fill="#F8FAFC" fontSize="24" fontWeight="bold">{totalCount}</tspan>
        </text>
    );
};

const StockStatusDonut = ({ data, height = '100%' }) => {
    const totalCount = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <ResponsiveContainer width="100%" height={height}>
            <PieChart>
                <Pie 
                    data={data} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                    labelLine={false}
                    label={(props) => <g>
                        {totalCount > 0 && props.index === 0 && renderCustomCenteredLabel({...props, totalCount})}
                    </g>}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.status] || entry.color || COLORS.IN_STOCK} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span style={{ color: '#94A3B8' }}>{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default StockStatusDonut;
