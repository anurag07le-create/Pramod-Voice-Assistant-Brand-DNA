import React, { useMemo } from 'react';
import { Phone, CheckCircle, Sparkles } from 'lucide-react';

export function StatsOverview({ calls }) {
    const stats = useMemo(() => {
        const totalCalls = calls.length;
        const connectedCalls = calls.filter(c => c.customerAttended).length;
        const interestedCalls = calls.filter(c => c.interestClassification?.interest_status === 'INTERESTED').length;

        const connectedRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;
        const interestRate = connectedCalls > 0 ? Math.round((interestedCalls / connectedCalls) * 100) : 0;

        return [
            {
                label: 'Total Calls',
                value: totalCalls,
                icon: Phone,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
            },
            {
                label: 'Connected Rate',
                value: `${connectedRate}%`,
                subText: `${connectedCalls} answered`,
                icon: CheckCircle,
                color: 'text-green-600',
                bg: 'bg-green-50',
            },
            {
                label: 'Interest Rate',
                value: `${interestRate}%`,
                subText: `${interestedCalls} interested`,
                icon: Sparkles,
                color: 'text-purple-600',
                bg: 'bg-purple-50',
            },
        ];
    }, [calls]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {stats.map((stat, index) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
                        <div className={`p-2 rounded-lg ${stat.bg}`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                        {stat.subText && (
                            <span className="text-xs text-slate-400">{stat.subText}</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
