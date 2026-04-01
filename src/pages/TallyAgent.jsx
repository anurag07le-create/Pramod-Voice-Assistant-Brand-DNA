import React, { useState, useEffect } from 'react';
import { fetchTallyAgentData } from '../services/googleSheetsService';
import { StatsOverview } from '../components/tally/StatsOverview';
import { OutcomeChart } from '../components/tally/OutcomeChart';
import { CallTable } from '../components/tally/CallTable';
import { CallDetailModal } from '../components/tally/CallDetailModal';
import { Loader2 } from 'lucide-react';

export default function TallyAgent() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCall, setSelectedCall] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Fetch data using the updated service that maps directly to our schema
                const data = await fetchTallyAgentData();
                // Sort by date defaults to desc in table, but doing initial sort here is good
                const sortedData = data.sort((a, b) => new Date(String(b.dateTime).replace(/\s*[+-]\d{4}\s*$/, '').trim()) - new Date(String(a.dateTime).replace(/\s*[+-]\d{4}\s*$/, '').trim()));
                setCalls(sortedData);
            } catch (error) {
                console.error("Failed to load Tally Agent data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center text-gray-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p>Loading Tally Upscaling Agent Data...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen font-sans text-gray-900">


            {/* Stats Overview */}
            <StatsOverview calls={calls} />

            {/* Charts Section */}
            <OutcomeChart calls={calls} />

            {/* Recent Calls Table */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Calls</h2>
                <CallTable calls={calls} onSelectCall={setSelectedCall} />
            </div>

            {/* Call Detail Modal */}
            {selectedCall && (
                <CallDetailModal
                    call={selectedCall}
                    onClose={() => setSelectedCall(null)}
                />
            )}
        </div>
    );
}
