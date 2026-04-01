import React, { useState, useMemo } from 'react';
import { MoreHorizontal, Search, Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CallTable({ calls, onSelectCall }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [interestFilter, setInterestFilter] = useState('ALL');
    const [sortConfig, setSortConfig] = useState({ key: 'dateTime', direction: 'desc' });

    // Unique values for filters
    const interestStatuses = useMemo(() => {
        const statuses = new Set(calls.map(c => c.interestClassification?.interest_status || 'N/A'));
        return Array.from(statuses); // Removed 'ALL' to avoid duplicate with manual option
    }, [calls]);

    const filteredAndSortedCalls = useMemo(() => {
        let result = [...calls];

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(call =>
                call.customerName?.toLowerCase().includes(lowerTerm) ||
                call.mobile?.includes(searchTerm) ||
                call.organization?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Status Filter
        if (statusFilter !== 'ALL') {
            const isAnswered = statusFilter === 'ANSWERED';
            result = result.filter(call => call.customerAttended === isAnswered);
        }

        // 3. Interest Filter
        if (interestFilter !== 'ALL') {
            result = result.filter(call =>
                (call.interestClassification?.interest_status || 'N/A') === interestFilter
            );
        }

        // 4. Sorting
        result.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Special handling for nested or specific fields
            if (sortConfig.key === 'interest') {
                aValue = a.interestClassification?.interest_status || '';
                bValue = b.interestClassification?.interest_status || '';
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [calls, searchTerm, statusFilter, interestFilter, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => (
        <ArrowUpDown className={cn(
            "w-3 h-3 ml-1 inline-block transition-opacity",
            sortConfig.key === columnKey ? "opacity-100 text-pucho-purple" : "opacity-30 group-hover:opacity-50"
        )} />
    );

    const formatLabel = (str) => {
        if (!str || str === 'NOT_APPLICABLE' || str === 'NOT_AVAILABLE' || str === 'UNKNOWN') return 'N/A';
        return str.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                {/* ... existing search ... */}
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search name, mobile, org..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 focus:border-pucho-purple"
                    />
                </div>

                <div className="flex gap-2 text-sm">
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 cursor-pointer hover:border-slate-300"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ANSWERED">Answered</option>
                            <option value="MISSED">Missed</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <select
                            value={interestFilter}
                            onChange={(e) => setInterestFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 cursor-pointer hover:border-slate-300"
                        >
                            <option value="ALL">All Interests</option>
                            {interestStatuses.map(status => (
                                <option key={status} value={status}>{formatLabel(status)}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('dateTime')}
                                >
                                    Date & Customer <SortIcon columnKey="dateTime" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('mobile')}
                                >
                                    Mobile No. <SortIcon columnKey="mobile" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('customerAttended')}
                                >
                                    Status <SortIcon columnKey="customerAttended" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('interest')}
                                >
                                    Interest <SortIcon columnKey="interest" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-slate-700 cursor-pointer group hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort('outcomeTag')}
                                >
                                    Outcome <SortIcon columnKey="outcomeTag" />
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedCalls.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-6 h-6 text-slate-300" />
                                            <p>No calls match your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedCalls.map((call) => (
                                    <tr
                                        key={call.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => onSelectCall(call)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900 highlight">{call.customerName}</span>
                                                <span className="text-xs text-slate-400">
                                                    {new Date(call.dateTime).toLocaleString('en-IN', {
                                                        timeZone: 'Asia/Kolkata',
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }).toUpperCase()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                            {call.mobile}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                call.customerAttended
                                                    ? "bg-green-50 text-green-700 border-green-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            )}>
                                                {call.customerAttended ? 'Answered' : 'Missed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {call.interestClassification?.interest_status === 'INTERESTED' ? (
                                                <span className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                    Interested
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">
                                                    {formatLabel(call.interestClassification?.interest_status)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">
                                                {formatLabel(call.outcomeTag)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
