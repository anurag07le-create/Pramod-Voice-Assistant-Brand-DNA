import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchCreativeHistory } from '../../services/googleSheetsService';
import { useBrands } from '../../context/BrandContext';
import { Activity, Search, ExternalLink } from 'lucide-react';

const ActivityLogs = () => {
    const { user } = useAuth();
    const { brands } = useBrands();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadHistory();
    }, [user]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await fetchCreativeHistory(user);
            setHistory(data || []);
        } catch (err) {
            console.error('Error fetching history:', err);
            setError('Failed to load creative history.');
        } finally {
            setLoading(false);
        }
    };

    // Group creatives by brand URL
    const groupedByBrand = useMemo(() => {
        const filtered = history.filter(item =>
            (item.prompt || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.website || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const groups = {};
        filtered.forEach(item => {
            const brandUrl = item.website || 'Unknown';
            if (!groups[brandUrl]) {
                groups[brandUrl] = [];
            }
            groups[brandUrl].push(item);
        });

        return groups;
    }, [history, searchTerm]);

    // Get brand name from URL
    const getBrandName = (url) => {
        if (!url || url === 'Unknown') return 'Unknown Brand';

        // Try to find matching brand from context
        const normalizedUrl = url.toLowerCase().trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');

        const matchingBrand = brands.find(brand => {
            if (!brand.url) return false;
            const brandNormalized = brand.url.toLowerCase().trim()
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .replace(/\/$/, '');
            return brandNormalized === normalizedUrl;
        });

        return matchingBrand?.name || url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="text-pucho-purple" />
                        Creative History
                    </h1>
                    <p className="text-gray-500">View all generated creatives and their details</p>
                </div>
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search by brand or prompt..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm w-64"
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading history...</div>
            ) : error ? (
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center text-red-600 mb-6">
                    {error}
                </div>
            ) : Object.keys(groupedByBrand).length === 0 ? (
                <div className="bg-gray-50 p-12 rounded-2xl border border-gray-200 text-center text-gray-400">
                    No creatives found.
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedByBrand).map(([brandUrl, creatives]) => (
                        <div key={brandUrl} className="space-y-4">
                            {/* Brand Name Header */}
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    {getBrandName(brandUrl)}
                                </h2>
                                {brandUrl !== 'Unknown' && (
                                    <a
                                        href={brandUrl.startsWith('http') ? brandUrl : `https://${brandUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 hover:text-blue-500 transition-colors"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                                <span className="text-sm text-gray-400 ml-auto">
                                    {creatives.length} {creatives.length === 1 ? 'creative' : 'creatives'}
                                </span>
                            </div>

                            {/* Images Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {creatives.map((item, index) => (
                                    <div
                                        key={index}
                                        className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                                        onClick={() => window.open(item.image_url, '_blank')}
                                    >
                                        <img
                                            src={item.image_url}
                                            alt={item.prompt || 'Creative'}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/300?text=Error';
                                            }}
                                        />
                                        {/* Hover Overlay with Prompt */}
                                        {item.prompt && (
                                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                                                <p className="text-white text-xs font-medium line-clamp-2">
                                                    {item.prompt}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityLogs;
