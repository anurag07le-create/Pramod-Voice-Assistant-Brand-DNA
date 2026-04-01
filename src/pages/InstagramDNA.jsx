import React, { useState, useEffect } from 'react';
import { fetchInstagramData } from '../services/googleSheetsService';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, Instagram, TrendingUp, Users, MapPin, Heart, MessageCircle, Activity, Brain, Shield } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

const InstagramDNA = () => {
    const { user } = useAuth();
    const [allData, setAllData] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                // If user doesn't have instagram_sheet_id, we can't load data
                if (!user?.instagram_sheet_id) {
                    setError("No Instagram Sheet ID found for this user. Please contact admin.");
                    setLoading(false);
                    return;
                }

                const result = await fetchInstagramData(user);
                if (result && result.length > 0) {
                    setAllData(result);
                    setSelectedProfile(result[0]);
                } else {
                    setError("No data found in the Instagram sheet.");
                }
            } catch (err) {
                console.error("Failed to load Instagram Data:", err);
                setError("Failed to load data. Please check your configuration.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    // Handle Profile Switching
    const filteredProfiles = allData.filter(p =>
        (p['Username'] || p['Brand Name'] || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Helpers ---

    // --- Helpers ---
    const parseObj = (input) => {
        if (!input) return null;
        try {
            let cleaned = input.trim();
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
            }
            if (cleaned.includes('\n') || cleaned.includes('\r')) {
                cleaned = cleaned.replace(/\r\n/g, '\\n').replace(/\n/g, '\\n').replace(/\r/g, '\\n');
            }
            return JSON.parse(cleaned);
        } catch (e) {
            return null;
        }
    };

    const parseList = (input) => {
        if (!input) return [];
        if (typeof input === 'string') {
            try {
                return JSON.parse(input);
            } catch (e) {
                return input.split(',').map(s => s.trim());
            }
        }
        return [];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="w-10 h-10 text-pink-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading Instagram DNA...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-gray-500 max-w-sm mt-2">{error}</p>
            </div>
        );
    }

    if (!selectedProfile) return null;

    // --- Process Data ---
    const iData = selectedProfile;
    const likesData = parseObj(iData.likesOverTime) || [];
    const followersData = parseObj(iData.followersOverTime) || [];

    // Complex JSON Parsing with fallback
    const hashtags = parseList(iData.mostUsedHashtags);
    const mentions = parseList(iData.mostUsedMention);

    // Parse Engagement for Recent Posts: Expecting [[Date, Val1, Val2], ...]
    const recentEngagementRaw = parseObj(iData.engagementForRecentPosts);
    const recentEngagement = Array.isArray(recentEngagementRaw) ? recentEngagementRaw.map(item => ({
        date: item[0],
        likes: item[1] || 0,
        comments: item[2] || 0
    })) : [];

    const audienceCitiesRaw = parseObj(iData.audienceCities) || [];
    const audienceCities = Array.isArray(audienceCitiesRaw) ? audienceCitiesRaw : [];

    const audienceCountriesRaw = parseObj(iData.audienceCountries) || [];
    const audienceCountries = Array.isArray(audienceCountriesRaw) ? audienceCountriesRaw : [];

    const audienceTypesRaw = parseObj(iData.audienceTypes) || {};
    const audienceTypes = Object.entries(audienceTypesRaw).map(([key, value]) => {
        // Format camelCase to Title Case
        const name = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return { name, value };
    });

    const popularPosts = parseObj(iData.popularPosts) || [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // --- Components ---
    const DashboardCard = ({ title, icon: Icon, children, className = "" }) => (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                {Icon && <Icon className="w-5 h-5 text-gray-500" />}
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );

    const MetricItem = ({ label, value, trend, subtext }) => (
        <div className="flex flex-col">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{value}</h3>
                {trend && <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">{trend}</span>}
            </div>
            {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
    );

    const DataRow = ({ label, value }) => {
        let displayValue = value;
        const isUrl = String(value).startsWith('http');

        if (typeof value === 'object' && value !== null) {
            displayValue = (
                <pre className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 overflow-x-auto font-mono text-gray-600">
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        } else if (isUrl) {
            displayValue = (
                <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1">
                    Link <Activity className="w-3 h-3" />
                </a>
            );
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 md:py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors px-4 -mx-4">
                <div className="md:col-span-1 text-xs font-bold text-gray-500 uppercase tracking-wide self-center">
                    {label}
                </div>
                <div className="md:col-span-2 text-sm font-medium text-gray-900 break-words self-center">
                    {displayValue || <span className="text-gray-300 italic">N/A</span>}
                </div>
            </div>
        );
    };

    // Helper for icons based on key name
    const getIconForKey = (key) => {
        if (key.includes('Followers')) return Users;
        if (key.includes('Likes')) return Heart;
        if (key.includes('Comment')) return MessageCircle;
        if (key.includes('View')) return Eye;
        return Activity;
    };

    // Lucide imports needed for this scope (adding Eye, CategoryScale/ExternalLink proxy)
    const Eye = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>;

    const usedKeys = new Set([
        'Username', 'Brand Name', 'Is Verified', 'bio', 'location', 'url', 'followers',
        'averageLikes', 'engagementRate', 'fakeFollowersPercentage', 'likesOverTime',
        'followersOverTime', 'audienceCities', 'audienceCountries', 'audienceTypes',
        'popularPosts', 'mostUsedHashtags', 'mostUsedMention', 'engagementForRecentPosts',
        'averageReelPlays', 'averageComments'
    ]);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans pb-24">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Profile Switcher - Only show if multiple profiles exist */}
                {allData.length > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center justify-between gap-4 sticky top-4 z-50">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-full"><Users className="w-4 h-4 text-gray-600" /></div>
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap hidden md:block">Active Profile:</span>
                            <div className="relative flex-1 max-w-md">
                                <select
                                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none appearance-none"
                                    value={allData.indexOf(selectedProfile)}
                                    onChange={(e) => setSelectedProfile(allData[e.target.value])}
                                >
                                    {allData.map((profile, idx) => (
                                        <option key={idx} value={idx}>
                                            {profile['Username'] || profile['Brand Name'] || `Profile ${idx + 1}`}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">
                            {allData.length} Profiles Available
                        </div>
                    </div>
                )}

                {/* 1. Header & Profile */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px] shrink-0 shadow-lg">
                        <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                            <Instagram className="w-10 h-10 text-pink-600" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                {iData['Username'] || iData['Brand Name']}
                            </h1>
                            {iData['Is Verified'] === 'TRUE' && (
                                <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                            )}
                        </div>
                        <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">{iData.bio}</p>
                        <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-400 pt-1">
                            <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {iData.location || 'Global'}</div>
                            {iData.url && (
                                <a href={iData.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-pink-600 hover:underline">
                                    <Activity className="w-4 h-4" /> {new URL(iData.url).hostname}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
                            {iData.followersOverTime && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">+ Growth</span>}
                        </div>
                        <MetricItem label="Total Followers" value={Number(iData.followers).toLocaleString()} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-pink-50 rounded-lg text-pink-600"><Heart className="w-5 h-5" /></div>
                        </div>
                        <MetricItem label="Avg. Likes" value={Number(iData.averageLikes).toLocaleString()} subtext="Per post average" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><TrendingUp className="w-5 h-5" /></div>
                        </div>
                        <MetricItem label="Engagement Rate" value={iData.engagementRatePercentage || `${(parseFloat(iData.engagementRate || 0) * 100).toFixed(2)}%`} subtext="Benchmark: 1.5%" />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><Shield className="w-5 h-5" /></div>
                            <span className="text-xs font-bold text-gray-400">Score</span>
                        </div>
                        <MetricItem label="Audience Quality" value={`${100 - (parseFloat(iData.fakeFollowersPercentage) || 0)}/100`} subtext={`${iData.fakeFollowersPercentage || '0%'} Suspicious`} />
                    </div>
                </div>

                {/* 3. Deep Dive Grid - Replaces List/Table with Visual Modules */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Module A: Content Cloud (Hashtags & Mentions) */}
                    <DashboardCard title="Conversation Topics" icon={MessageCircle} className="xl:col-span-1">
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Top Hashtags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.length > 0 ? hashtags.map((tag, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-100">
                                            #{tag.replace(/^#/, '')}
                                        </span>
                                    )) : <span className="text-gray-400 italic text-sm">No hashtags found</span>}
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Frequent Mentions</h4>
                                <div className="flex flex-wrap gap-2">
                                    {mentions.length > 0 ? mentions.map((user, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-full border border-blue-100 flex items-center gap-1">
                                            @ {user.replace(/^@/, '')}
                                        </span>
                                    )) : <span className="text-gray-400 italic text-sm">No mentions found</span>}
                                </div>
                            </div>
                        </div>
                    </DashboardCard>

                    {/* Module B: Recent Activity Histogram (EngagementForRecentPosts) */}
                    <DashboardCard title="Recent Engagement Pulse" icon={Activity} className="xl:col-span-2">
                        {recentEngagement.length > 0 ? (
                            <div className="h-[250px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={recentEngagement} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#f9fafb' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="likes" name="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                                        <Bar dataKey="comments" name="Comments" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center text-gray-400">No recent engagement data</div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-gray-100 pt-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg"><Activity className="w-4 h-4 text-gray-600" /></div>
                                <MetricItem label="Avg. Reel Plays" value={Number(iData.averageReelPlays || 0).toLocaleString()} />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg"><MessageCircle className="w-4 h-4 text-gray-600" /></div>
                                <MetricItem label="Avg. Comments" value={Number(iData.averageComments || 0).toLocaleString()} />
                            </div>
                        </div>
                    </DashboardCard>
                </div>

                {/* 4. Main Charts (Growth & Audience) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Growth Chart */}
                    <DashboardCard title="Growth Trajectory" icon={TrendingUp} className="xl:col-span-2 min-h-[400px]">
                        {likesData.length > 0 ? (
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={likesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorLikes2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })} axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: '#111827', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorLikes2)" name="Activity" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <div className="h-full flex items-center justify-center text-gray-400">No Data</div>}
                    </DashboardCard>

                    {/* Audience Viz */}
                    <DashboardCard title="Audience Demographics" icon={Users} className="min-h-[400px] flex flex-col">
                        <div className="flex-1 flex flex-col">
                            <div className="h-[200px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={audienceTypes}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {audienceTypes.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold text-gray-900">{audienceTypes.length}</span>
                                    <span className="text-[10px] text-gray-400 uppercase">Types</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar mt-4 pr-2 space-y-3">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Top Locations</p>
                                {audienceCountries.slice(0, 5).map((country, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700 font-medium truncate max-w-[120px]">{country.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${country.weight * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold w-8 text-right">{(country.weight * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </DashboardCard>
                </div>

                {/* 5. Top Content */}
                <DashboardCard title="Top Performing Content" icon={Instagram}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {popularPosts.map((post, idx) => (
                            <a
                                key={idx}
                                href={post.url}
                                target="_blank"
                                rel="noreferrer"
                                className="group block bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-pink-300 hover:shadow-md transition-all h-full"
                            >
                                <div className="aspect-[4/5] bg-gray-200 relative">
                                    {/* Placeholder Gradient */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${idx % 2 === 0 ? 'from-purple-100 to-indigo-100' : 'from-pink-100 to-orange-100'} group-hover:scale-105 transition-transform duration-700`}></div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                        <span className="bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">View Post</span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(post.date).toLocaleDateString()}</span>
                                        <IconWrapper icon={Heart} className="w-3 h-3 text-pink-500" />
                                    </div>
                                    <p className="text-xs text-gray-800 line-clamp-3 mb-3 leading-relaxed font-medium">
                                        {post.text || post.caption || "No caption"}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {(post.likes || 0).toLocaleString()}</span>
                                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {(post.commentsCount || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

// Simple Icon wrapper to save space
const IconWrapper = ({ icon: Icon, className }) => <Icon className={className} />;

export default InstagramDNA;
