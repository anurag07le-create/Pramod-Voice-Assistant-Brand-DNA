import React, { useState, useMemo } from 'react';
import { MoreHorizontal, Search, Filter, ArrowUpDown, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

export function CallTable({ calls, onSelectCall }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [interestFilter, setInterestFilter] = useState('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'dateTime', direction: 'desc' });

    // Unique values for filters
    const interestStatuses = useMemo(() => {
        const statuses = new Set(calls.map(c => c.interestClassification?.interest_status || 'N/A'));
        return Array.from(statuses);
    }, [calls]);

    // Helper to parse "DD/MM/YYYY, HH:mm PM" or standard ISO strings
    const parseDateTime = (dateStr) => {
        if (!dateStr) return new Date(0); // Return epoch if missing
        if (dateStr instanceof Date) return dateStr;

        // Strip timezone offset (e.g. +0000, +0530) or abbreviation (e.g. IST, PST)
        const strippedStr = String(dateStr).replace(/\s*(?:[+-]\d{4}|[A-Z]{2,5})\s*$/g, '').trim();

        // 1. Try standard parsing first (handles ISO 8601, YYYY/MM/DD etc.)
        const standardDate = new Date(strippedStr);
        if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() > 1970) {
            return standardDate;
        }

        // 2. Fallback for custom formats like "DD/MM/YYYY, HH:mm PM"
        try {
            // Normalize separators to slash
            const normalized = dateStr.replace(/-/g, '/').replace(/\./g, '/');

            // Extract date part (first 10 chars usually DD/MM/YYYY) and time part
            let datePart = normalized.substring(0, 10);
            let timePart = normalized.substring(10).replace(/,/g, '').trim();

            // Simple split check if substring method failed
            if (!datePart.includes('/')) {
                const parts = normalized.split(/[ ,]+/);
                datePart = parts[0];
                timePart = parts.slice(1).join(' ');
            }

            const parts = datePart.split('/').map(Number);
            let day, month, year;

            // Robust check: YYYY/MM/DD vs DD/MM/YYYY
            if (parts[0] > 31) {
                [year, month, day] = parts;
            } else {
                [day, month, year] = parts;
            }

            // Check validity
            if (!day || !month || !year) return new Date(0);

            let hours = 0, minutes = 0;
            if (timePart) {
                const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                if (timeMatch) {
                    hours = parseInt(timeMatch[1], 10);
                    minutes = parseInt(timeMatch[2], 10);
                    const period = timeMatch[3]?.toUpperCase();

                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                }
            }

            return new Date(year, month - 1, day, hours, minutes);
        } catch (e) {
            console.error("Error parsing date:", dateStr, e);
            return new Date(0); // Fallback
        }
    };

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

        // 4. Date Filter
        if (startDate) {
            // Construct local date from YYYY-MM-DD input
            const [sY, sM, sD] = startDate.split('-').map(Number);
            const start = new Date(sY, sM - 1, sD, 0, 0, 0, 0); // Local Midnight

            result = result.filter(call => parseDateTime(call.dateTime) >= start);
        }

        if (endDate) {
            // Construct local date from YYYY-MM-DD input
            const [eY, eM, eD] = endDate.split('-').map(Number);
            const end = new Date(eY, eM - 1, eD, 23, 59, 59, 999); // Local End of Day

            result = result.filter(call => parseDateTime(call.dateTime) <= end);
        }

        // 5. Sorting
        result.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle date sorting specially using the parser
            if (sortConfig.key === 'dateTime') {
                aValue = parseDateTime(a.dateTime);
                bValue = parseDateTime(b.dateTime);
            }

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
    }, [calls, searchTerm, statusFilter, interestFilter, sortConfig, startDate, endDate]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const SortIcon = ({ columnKey }) => (
        <ArrowUpDown className={cn(
            "w-3 h-3 ml-1 inline-block transition-opacity",
            sortConfig.key === columnKey ? "opacity-100 text-indigo-600" : "opacity-30 group-hover:opacity-50"
        )} />
    );

    const formatLabel = (str) => {
        if (!str || str === 'NOT_APPLICABLE' || str === 'NOT_AVAILABLE' || str === 'UNKNOWN') return 'N/A';
        return str.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search name, mobile, org..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>

                <div className="flex gap-2 text-sm flex-wrap">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600 w-36"
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-600 w-36"
                            placeholder="End Date"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-gray-300"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ANSWERED">Answered</option>
                            <option value="MISSED">Missed</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <select
                            value={interestFilter}
                            onChange={(e) => setInterestFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-200 rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-gray-300"
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th
                                    className="px-6 py-4 font-semibold text-gray-700 cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('dateTime')}
                                >
                                    Date & Customer <SortIcon columnKey="dateTime" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-gray-700 cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('mobile')}
                                >
                                    Mobile No. <SortIcon columnKey="mobile" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-gray-700 cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('customerAttended')}
                                >
                                    Status <SortIcon columnKey="customerAttended" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-gray-700 cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('interest')}
                                >
                                    Interest <SortIcon columnKey="interest" />
                                </th>
                                <th
                                    className="px-6 py-4 font-semibold text-gray-700 cursor-pointer group hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('outcomeTag')}
                                >
                                    Outcome <SortIcon columnKey="outcomeTag" />
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAndSortedCalls.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-6 h-6 text-gray-300" />
                                            <p>No calls match your filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedCalls.map((call) => (
                                    <tr
                                        key={call.id}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => onSelectCall(call)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900 highlight">{call.customerName}</span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(String(call.dateTime).replace(/\s*(?:[+-]\d{4}|[A-Z]{2,5})\s*$/g, '').trim()).toLocaleString('en-IN', {
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
                                        <td className="px-6 py-4 text-gray-600 font-mono text-xs">
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
                                                <span className="text-gray-400 text-xs">
                                                    {formatLabel(call.interestClassification?.interest_status)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                                                {formatLabel(call.outcomeTag)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
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
