import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export function ChartsSection({ calls }) {
    // 1. Outcome Data (Bar Chart)
    const outcomeData = useMemo(() => {
        const counts = {};
        calls.forEach(call => {
            const outcome = call.outcomeTag || 'Unknown';
            counts[outcome] = (counts[outcome] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [calls]);

    // 2. Interest Data (Pie Chart)
    const interestData = useMemo(() => {
        const counts = {};
        calls.forEach(call => {
            const status = call.interestClassification?.interest_status || 'N/A';
            counts[status] = (counts[status] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [calls]);

    // 3. Call Status (Answered vs Missed) (Pie/Donut Chart)
    const statusData = useMemo(() => {
        const counts = { Answered: 0, Missed: 0 };
        calls.forEach(call => {
            if (call.customerAttended) counts.Answered++;
            else counts.Missed++;
        });
        return [
            { name: 'Answered', value: counts.Answered },
            { name: 'Missed', value: counts.Missed }
        ];
    }, [calls]);

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    const STATUS_COLORS = ['#4ade80', '#f87171']; // Green for Answered, Red for Missed

    const ChartCard = ({ title, children }) => (
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-[420px] flex flex-col">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 shrink-0">{title}</h3>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {children}
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Interest Chart */}
            <ChartCard title="Interest Distribution">
                <PieChart>
                    <Pie
                        data={interestData}
                        cx="50%"
                        cy="40%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {interestData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={70} iconType="circle" />
                </PieChart>
            </ChartCard>

            {/* Outcome Chart */}
            <ChartCard title="Call Outcomes">
                <BarChart data={outcomeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {outcomeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ChartCard>

            {/* Call Status Chart */}
            <ChartCard title="Call Status (Recieved vs Missed)">
                <PieChart>
                    <Pie
                        data={statusData}
                        cx="50%"
                        cy="40%"
                        innerRadius={0}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ChartCard>
        </div>
    );
}
