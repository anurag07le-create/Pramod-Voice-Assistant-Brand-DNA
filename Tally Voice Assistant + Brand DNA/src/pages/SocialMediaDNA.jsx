import React, { useState, useEffect, useMemo } from 'react';
import { Share2, Loader2, AlertCircle, ArrowLeft, LayoutDashboard, Target, MessageSquare, TrendingUp, ShieldCheck, Database, Image, CheckCircle2, AlertTriangle, DollarSign, Linkedin, Youtube, Facebook, X } from 'lucide-react';
import { fetchSocialMediaDNA, fetchInstagramData } from '../services/googleSheetsService';
import { useAuth } from '../context/AuthContext';
import { useBrands } from '../context/BrandContext';
import Card from '../components/dashboard/Card';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Instagram } from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';

const SocialMediaDNA = ({ embeddedBrand }) => {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { brands, loading: brandsLoading } = useBrands();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedPlatform, setSelectedPlatform] = useState(null);
    const platformConfig = {
        LinkedIn: {
            icon: Linkedin,
            color: 'text-[#0077b5]',
            bg: 'bg-[#0077b5]/5',
            border: 'border-[#0077b5]/20',
            statsColumn: 'Linkedin Stats',
            postsColumn: 'Linkedin Recent Posts',
            metrics: {
                activity: 'Linkedin Month on Month Activity',
                consistency: 'Linkedin Estimated Consistency Score',
                videosVsStatic: 'Linkedin Videos vs Static',
                shortVsLong: 'Linkedin Short vs Long Form',
                dominantFormat: 'Linkedin Dominant Format'
            }
        },
        Instagram: {
            icon: Instagram,
            color: 'text-[#E1306C]', // Instagram Gradient logic can be complex, using standard pink/red
            bg: 'bg-[#E1306C]/5',
            border: 'border-[#E1306C]/20',
            statsColumn: 'Instagram Stats', // Or use _instagramData
            postsColumn: 'Instagram Recent Posts',
            metrics: {
                activity: 'Instagram Month on Month Activity',
                consistency: 'Instagram Estimated Consistency Score',
                videosVsStatic: 'Instagram Videos vs Static',
                shortVsLong: 'Instagram Short vs Long Form',
                dominantFormat: 'Instagram Dominant Format'
            }
        },
        YouTube: {
            icon: Youtube,
            color: 'text-[#FF0000]',
            bg: 'bg-[#FF0000]/5',
            border: 'border-[#FF0000]/20',
            statsColumn: 'Youtube Stats',
            postsColumn: 'Youtube Recent Posts', // Fallback or assume column exists
            metrics: {
                activity: 'Youtube Month on Month Activity',
                consistency: 'Youtube Estimated Consistency Score',
                videosVsStatic: 'Youtube Videos vs Static',
                shortVsLong: 'Youtube Short vs Long Form',
                dominantFormat: 'Youtube Dominant Format'
            }
        },
        Facebook: {
            icon: Facebook,
            color: 'text-[#1877F2]',
            bg: 'bg-[#1877F2]/5',
            border: 'border-[#1877F2]/20',
            statsColumn: 'Facebook Stats',
            postsColumn: 'Facebook Recent Posts',
            metrics: {
                activity: 'Facebook Month on Month Activity',
                consistency: 'Facebook Estimated Consistency Score',
                videosVsStatic: 'Facebook Videos vs Static',
                shortVsLong: 'Facebook Short vs Long Form',
                dominantFormat: 'Facebook Dominant Format'
            }
        }
    };

    // Helper to normalize URLs for matching
    const normalizeUrl = (u) => {
        if (!u) return '';
        return u.toLowerCase().trim()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '');
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                if (!user || !user.social_media_id) {
                    setLoading(false);
                    return;
                }
                const result = await fetchSocialMediaDNA(user);

                // Fetch Instagram specific data if ID is available
                let instagramData = [];
                if (user.instagram_sheet_id) {
                    try {
                        instagramData = await fetchInstagramData(user);
                        console.log("📸 Loaded Instagram Data:", instagramData.length);
                    } catch (instaError) {
                        console.error("Failed to load Instagram data", instaError);
                    }
                }

                // Merge strategies:
                // If we have specific Instagram data, we might want to append it or merge it if the brand already exists.
                // For now, let's treat it as supplementary data.
                // If a brand exists in 'result' (Social Media DNA), we attach the detailed Instagram data to it.
                // If it's a new brand only in Instagram sheet, we add it.

                const mergedData = [...result];

                instagramData.forEach(instaItem => {
                    const instaUrl = normalizeUrl(instaItem.url || instaItem['Brand URL'] || instaItem.Website || '');
                    const existingIndex = mergedData.findIndex(item =>
                        normalizeUrl(item['Brand URL'] || item.url || item.Website || '') === instaUrl
                    );

                    if (existingIndex >= 0) {
                        // Merge
                        mergedData[existingIndex] = {
                            ...mergedData[existingIndex],
                            _instagramData: instaItem,
                            // Override generic stats with specific ones if needed, or keep them separate
                            instagram_stats: instaItem // Keep cleaner separation
                        };
                    } else {
                        // Add as new entry
                        mergedData.push({
                            ...instaItem,
                            'Brand Name': instaItem['Username'] || instaItem['Brand Name'] || 'Unknown Instagram Brand',
                            'Platform': 'Instagram',
                            _instagramData: instaItem
                        });
                    }
                });

                setData(mergedData);
            } catch (err) {
                console.error("Failed to load Social Media DNA:", err);
                setError("Failed to load data. Please check your configuration.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadData();
        }
    }, [user]);

    // Join Social Media Data with Brands Data
    const joinedData = useMemo(() => {
        if (!data || !brands) return [];

        return data.map(item => {
            const itemUrl = item['Brand URL'] || item['url'] || item['Website'] || '';
            const normalizedItemUrl = normalizeUrl(itemUrl);
            const matchedBrand = brands.find(b => normalizeUrl(b.url) === normalizedItemUrl);

            return {
                ...item,
                _brandInfo: matchedBrand || {
                    name: item['Brand Name'] || 'Unknown Brand',
                    logo: null,
                    description: 'No brand details found'
                }
            };
        });
    }, [data, brands]);

    const deepLinkHandled = React.useRef(false);

    // Handle deep linking or embedded mode
    useEffect(() => {
        if (joinedData.length > 0) {
            // 1. Embedded Mode
            if (embeddedBrand) {
                const targetBrand = joinedData.find(item => item._brandInfo?.slug === embeddedBrand.slug);
                if (targetBrand) {
                    setSelectedBrand(targetBrand);
                }
                return;
            }

            // 2. Deep Linking (only if not embedded)
            if (!deepLinkHandled.current && !selectedBrand) {
                let targetBrand = null;

                // Try matching by Slug (Exact Match)
                if (location.state?.brandSlug) {
                    targetBrand = joinedData.find(item => item._brandInfo?.slug === location.state.brandSlug);
                }

                // Fallback: Try matching by Name (Fuzzy Match)
                if (!targetBrand && location.state?.brandName) {
                    const searchName = location.state.brandName.toLowerCase();
                    targetBrand = joinedData.find(item => {
                        const sheetName = (item['Brand Name'] || item._brandInfo?.name || '').toLowerCase();
                        return sheetName === searchName || sheetName.includes(searchName) || searchName.includes(sheetName);
                    });
                }

                if (targetBrand) {
                    setSelectedBrand(targetBrand);
                    deepLinkHandled.current = true;
                    // Clear state just in case to prevent sticking (though optional)
                    window.history.replaceState({}, document.title);
                }
            }
        }
    }, [location.state, joinedData, selectedBrand, embeddedBrand]);

    if (loading || brandsLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-pucho-purple animate-spin mb-4" />
                <p className="text-gray-500">Loading Social Media DNA...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
                <p className="text-gray-500 max-w-sm mt-2">{error}</p>
            </div>
        );
    }

    // DETAIL VIEW
    if (selectedBrand) {
        // --- Parsing Helpers ---
        // --- Parsing Helpers ---
        const parseList = (input, allowCommaSplit = true) => {
            if (!input) return [];
            if (Array.isArray(input)) return input;
            if (typeof input === 'string') {
                let trimmed = input.trim();

                // Handle Sheets double-wrapping e.g. "['a','b']"
                if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                    trimmed = trimmed.slice(1, -1).replace(/""/g, '"');
                }

                // JSON Array check
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    try {
                        return JSON.parse(trimmed);
                    } catch (e) {
                        try {
                            // Fix single quotes
                            const fixed = trimmed.replace(/'/g, '"');
                            return JSON.parse(fixed);
                        } catch (e2) {
                            // Proceed to text splitting
                        }
                    }
                }

                // Text splitting
                if (trimmed.includes(';') || trimmed.includes('\n')) {
                    if (trimmed.includes(';')) return trimmed.split(';').map(s => s.trim()).filter(Boolean);
                }
                if (allowCommaSplit) {
                    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
                }
                return [trimmed];
            }
            return [];
        };

        const parseObj = (input) => {
            if (!input) return {};
            if (typeof input === 'object') return input;
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
                return {};
            }
        };

        // --- Data Extraction ---
        // Dynamically select stats and posts based on selectedPlatform
        let statsColumn = selectedPlatform ? platformConfig[selectedPlatform].statsColumn : 'Stats';
        let postsColumn = selectedPlatform ? platformConfig[selectedPlatform].postsColumn : 'Recent Posts';

        // --- SMART DEFAULT LOGIC ---
        // If no platform selected (Overview) AND global 'Stats'/'Recent Posts' is missing, 
        // fallback to the "Platform" column specified in the sheet.
        if (!selectedPlatform) {
            const defaultPlatformName = selectedBrand['Platform']; // e.g., "LinkedIn", "YouTube", "Facebook"
            // Map the sheet's "Platform" value to our config keys (case-insensitive check might be safer)
            const matchedKey = Object.keys(platformConfig).find(k => k.toLowerCase() === (defaultPlatformName || '').toLowerCase());

            if (matchedKey) {
                if (!selectedBrand['Stats']) {
                    statsColumn = platformConfig[matchedKey].statsColumn;
                }
                if (!selectedBrand['Recent Posts']) {
                    postsColumn = platformConfig[matchedKey].postsColumn;
                }
            }
        }

        let stats = parseObj(selectedBrand[statsColumn]);
        // Data cleaning for stats: if we have "followers": "23,840", logic works.
        // if "posts": "Unknown", cleaned in StatCard.

        const address = parseObj(selectedBrand['Address']);
        // Note: The logic `selectedBrand[postsColumn] || selectedBrand['Recent Posts']` above was slightly redundant if we already set postsColumn to 'Recent Posts'.
        // But with the smart default logic, postsColumn might be 'Linkedin Recent Posts'.
        // So we strictly use `selectedBrand[postsColumn]`. If that fails, we can fallback to generic, but our smart logic handles the preference.

        // Refined extraction usage:
        const finalRecentPosts = parseList(selectedBrand[postsColumn]);


        // Lists with robust key checks
        const coreValues = parseList(selectedBrand['Core Values'] || selectedBrand['core_values']);
        const personality = parseList(selectedBrand['Brand Personality Traits'] || selectedBrand['brand_personality']);
        const contentPillars = parseList(selectedBrand['Content_Pillars'] || selectedBrand['Content Pillars']);
        const competitors = parseList(selectedBrand['Competitors']);
        const strategicFocus = parseList(selectedBrand['strategic_focus_next_90_days'], false);
        const experiments = parseList(selectedBrand['content_experiment_ideas']);
        const algoTriggers = parseList(selectedBrand['Alogrith Triggers'] || selectedBrand['Algorithm Triggers']);

        // New parsed fields
        const brandRisk = parseList(selectedBrand['Brand Risk']);
        const platformRisk = selectedBrand['Platfrom Dependency Risk'] || selectedBrand['Platform Dependency Risk'];

        // Monetization
        let monetization = {};
        const rawMonetization = selectedBrand['Monitization Signals'] || selectedBrand['Monetization Signals'];
        if (rawMonetization && (rawMonetization.trim().startsWith('{') || rawMonetization.trim().startsWith('"'))) {
            monetization = parseObj(rawMonetization);
        } else {
            monetization = {
                monetization_readiness: rawMonetization,
                brand_to_business_alignment: selectedBrand['Brand to Business Alignment'],
                likely_monetization_paths: parseList(selectedBrand['Likely Monetization Paths'] || selectedBrand['likely_monetization_paths'])
            };
        }

        const optimizations = parseList(selectedBrand['immediate_optimization_opportunities']);
        const scalingConstraint = selectedBrand['Scaling Constraint'];

        // --- NEW FIELDS EXTRACTION ---
        const slogan = selectedBrand['Slogan'];
        const analysisConfidence = selectedBrand['Analysis Confidence'];
        const interactionStyle = selectedBrand['Interaction Style'];
        const identifiedCampaigns = parseList(selectedBrand['Identified Campaigns']);
        const topPerformingThemes = parseList(selectedBrand['Top Performing Themes']);
        const positioningStatement = selectedBrand['Positioning Statement'];
        const perceivedUniqueness = selectedBrand['Percieved Uniqueness'] || selectedBrand['Perceived Uniqueness'];

        const strengths = parseList(selectedBrand['Strengths '] || selectedBrand['Strengths'] || selectedBrand['strengths']);
        const weaknesses = parseList(selectedBrand['Weakness'] || selectedBrand['Weaknesses'] || selectedBrand['weakness']);

        const algorithmFriendliness = selectedBrand['Algorithm Friendliness'];

        // Correct keys for Target Audience
        const primaryAudience = selectedBrand['Target Audience Primary'] || selectedBrand['Primary Audience'];
        const secondaryAudience = selectedBrand['Target Audience Secondary'] || selectedBrand['Secondary Audience'];
        const geographicFocus = selectedBrand['Target Audience Geographic Focus'] || selectedBrand['Geographic Focus'];
        const identityReinforcement = selectedBrand['Audience Identity Reinforcement'] || selectedBrand['Identity Reinforcement'];

        const audienceRelationship = selectedBrand['Audience Relationship'];
        const platformExpansionReadiness = selectedBrand['Platform Expansion Readiness'];
        const collaborationSustainability = selectedBrand['Collabration Sustainblity'] || selectedBrand['Collaboration Sustainability'];
        const viralProbability = selectedBrand['Viral Probablity'] || selectedBrand['Viral Probability'];

        // --- Render Components ---
        const StatCard = ({ label, value }) => {
            const displayValue = (!value || value.toString().toLowerCase() === 'unknown') ? '-' : value;
            return (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-between h-24">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-2xl font-bold text-gray-900 truncate" title={displayValue}>{displayValue}</p>
                </div>
            );
        };

        const SectionTitle = ({ title }) => (
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                {title}
            </h3>
        );

        // Enhanced InfoBlock that handles Arrays and Objects smartly
        const InfoBlock = ({ label, value, fullWidth = false, className = '' }) => {
            let content;

            if (Array.isArray(value) && value.length > 0) {
                // Render as list
                content = (
                    <ul className="space-y-2 mt-2">
                        {value.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pucho-purple shrink-0" />
                                <span className="leading-relaxed">{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                            </li>
                        ))}
                    </ul>
                );
            } else if (typeof value === 'object' && value !== null && !React.isValidElement(value)) {
                // Render as Key-Value Grid
                content = (
                    <div className="grid grid-cols-1 gap-3 mt-2">
                        {Object.entries(value).map(([k, v], i) => (
                            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">{k.replace(/_/g, ' ')}</span>
                                <div className="text-sm text-gray-900 font-medium">
                                    {Array.isArray(v) ? (
                                        <div className="flex flex-wrap gap-1">
                                            {v.map((tag, j) => <span key={j} className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">{tag}</span>)}
                                        </div>
                                    ) : v}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            } else {
                // Render as String
                const displayVal = (value && value.toString().toLowerCase() !== 'unknown') ? value : null;
                content = (
                    <div className="text-gray-900 text-sm leading-relaxed break-words whitespace-pre-wrap font-medium">
                        {displayVal || <span className="text-gray-300">-</span>}
                    </div>
                );
            }

            return (
                <div className={`space-y-2 ${fullWidth ? 'col-span-full' : ''} ${className}`}>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</h4>
                    {content}
                </div>
            );
        };

        const TagList = ({ tags }) => (
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => {
                    const label = typeof tag === 'string' ? tag : tag.name || JSON.stringify(tag);
                    return (
                        <span key={i} className="px-3 py-1.5 bg-purple-50 text-pucho-purple text-xs font-semibold rounded-lg border border-purple-100/50">
                            {label}
                        </span>
                    );
                })}
            </div>
        );

        const TabButton = ({ id, label, icon: Icon }) => (
            <button
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
            >
                <Icon className="w-4 h-4" />
                {label}
            </button>
        );

        // --- Tab Content ---



        const renderInstagramDeepDive = () => {
            const iData = selectedBrand._instagramData || selectedBrand; // Fallback if direct
            if (!iData) return <div className="p-8 text-center text-gray-500">No detailed Instagram data available.</div>;

            // parsing time series
            const likesData = parseObj(iData.likesOverTime); // Expecting array of {date, value}
            const followersData = parseObj(iData.followersOverTime);

            // parsing demographics
            const audienceCities = parseList(iData.audienceCities).map(item => {
                // If it's a string from parseList cleaning, it might need manual object creation if not JSON
                // But sample says: [{"name":"Delhi","weight":0.042429}, ...]
                return item;
            });
            // Fix: parseList might return strings if JSON parse fails or is simple list.
            // Sample input: [{"name":"Delhi","weight":0.042429}]. 
            // parseObj might be better for the full array if it's a JSON string of an array.
            const citiesRaw = parseObj(iData.audienceCities);
            const cities = Array.isArray(citiesRaw) ? citiesRaw : [];

            const countriesRaw = parseObj(iData.audienceCountries);
            const countries = Array.isArray(countriesRaw) ? countriesRaw : [];

            const audienceTypesRaw = parseObj(iData.audienceTypes); // e.g {"realPeople": 0.60}
            const audienceTypes = Object.entries(audienceTypesRaw).map(([key, value]) => ({ name: key, value: value }));

            const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

            return (
                <div className="space-y-8 animate-fade-in">
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard label="Followers" value={iData.followers} />
                        <StatCard label="Avg Likes" value={iData.averageLikes} />
                        <StatCard label="Engagement Rate" value={iData.engagementRatePercentage || iData.engagementRate} />
                        <StatCard label="Fake Followers" value={iData.fakeFollowersPercentage} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Likes Over Time Chart */}
                        {likesData && Array.isArray(likesData) && likesData.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <SectionTitle title="Likes Growth" />
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={likesData}>
                                            <defs>
                                                <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#E1306C" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#E1306C" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short' })} />
                                            <YAxis tick={{ fontSize: 10 }} />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="value" stroke="#E1306C" fillOpacity={1} fill="url(#colorLikes)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Audience Types Pie Chart */}
                        {audienceTypes.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <SectionTitle title="Audience Quality" />
                                <div className="h-64 w-full flex">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={audienceTypes}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {audienceTypes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                                            <Legend layout="vertical" align="right" verticalAlign="middle" />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Top Countries Bar Chart */}
                        {countries.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                <SectionTitle title="Top Audience Countries" />
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            layout="vertical"
                                            data={countries.slice(0, 5)} // Top 5
                                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" hide />
                                            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={(val) => `${(val * 100).toFixed(1)}%`} />
                                            <Bar dataKey="weight" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                                {countries.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Top Cities List (or Bar Chart) */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <SectionTitle title="Top Audience Cities" />
                            <div className="space-y-3">
                                {cities.slice(0, 5).map((city, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">{city.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${city.weight * 100 * 2}%` }} // Scale up a bit for visual
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-900">{(city.weight * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Popular Posts */}
                    {iData.popularPosts && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                            <SectionTitle title="Popular Posts" />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {parseObj(iData.popularPosts).map((post, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 p-4 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">{post.type || 'Post'}</span>
                                            <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm text-gray-800 line-clamp-3 font-medium">{post.title || post.text || post.caption}</p>
                                        <div className="mt-auto pt-3 flex gap-4 text-xs font-semibold text-gray-500 border-t border-gray-50">
                                            <span className="flex items-center gap-1">❤️ {(post.likes || 0).toLocaleString()}</span>
                                            <span className="flex items-center gap-1">💬 {(post.commentsCount || 0).toLocaleString()}</span>
                                        </div>
                                        <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-xs text-center w-full py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 mt-2">
                                            View on Instagram ↗
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        };

        const renderOverview = () => (
            <div className="space-y-8 animate-fade-in">
                {selectedBrand['summary'] && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Executive Summary" />
                        <p className="text-gray-700 leading-relaxed text-lg">{selectedBrand['summary']}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Followers" value={stats.followers} />
                    <StatCard label="Following" value={stats.following} />
                    <StatCard label="Posts" value={stats.posts} />
                    <StatCard label="Engagement" value={stats.engagement} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                        <SectionTitle title="Company Snapshot" />

                        {slogan && (
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                                <p className="text-sm font-semibold text-purple-900 uppercase tracking-wide mb-1">Slogan</p>
                                <p className="text-lg text-purple-900 font-medium italic">"{slogan}"</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <InfoBlock label="Industry" value={selectedBrand['Industry']} />
                            <InfoBlock label="Sub Niche" value={selectedBrand['Sub Niche']} />
                            <InfoBlock label="Business Model" value={selectedBrand['Business Model']} />
                            <InfoBlock label="Location" value={`${address.addressLocality || ''}, ${address.addressCountry || ''}`} />
                            {analysisConfidence && <InfoBlock label="Analysis Confidence" value={analysisConfidence} />}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                        <div className="flex justify-between items-center">
                            <SectionTitle title="Platform Deep Dive" />
                            {selectedPlatform && (
                                <button
                                    onClick={() => setSelectedPlatform(null)}
                                    className="text-xs font-semibold text-gray-500 hover:text-pucho-purple uppercase tracking-wide px-3 py-1 bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                                >
                                    Reset View
                                </button>
                            )}
                        </div>
                        <div className="flex gap-4">
                            {Object.entries(platformConfig).map(([key, config]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedPlatform(selectedPlatform === key ? null : key)}
                                    className={`flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-3 ${selectedPlatform === key
                                        ? `${config.bg} ${config.border} ring-2 ring-offset-2 ring-${config.color.split('-')[1]} shadow-md transform scale-105`
                                        : 'hover:shadow-md hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <config.icon className={`w-8 h-8 ${config.color}`} />
                                    <span className={`text-xs font-bold uppercase tracking-wide ${selectedPlatform === key ? 'text-gray-900' : 'text-gray-500'}`}>{key}</span>
                                </button>
                            ))}
                        </div>

                        {/* Inline Platform Metrics */}
                        {selectedPlatform && (
                            <div className="animate-in slide-in-from-top-4 duration-300 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    {React.createElement(platformConfig[selectedPlatform].icon, { className: `w-4 h-4 ${platformConfig[selectedPlatform].color}` })}
                                    {selectedPlatform} Performance Analysis
                                </h4>
                                <div className="space-y-6">
                                    <InfoBlock
                                        label="Month on Month Activity"
                                        value={selectedBrand[platformConfig[selectedPlatform].metrics.activity]}
                                        fullWidth
                                        className="bg-gray-50 p-4 rounded-xl border border-gray-100"
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoBlock
                                            label="Consistency Score"
                                            value={selectedBrand[platformConfig[selectedPlatform].metrics.consistency]}
                                        />
                                        <InfoBlock
                                            label="Dominant Format"
                                            value={selectedBrand[platformConfig[selectedPlatform].metrics.dominantFormat]}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                        <InfoBlock
                                            label="Video vs Static"
                                            value={selectedBrand[platformConfig[selectedPlatform].metrics.videosVsStatic]}
                                        />
                                        <InfoBlock
                                            label="Short vs Long Form"
                                            value={selectedBrand[platformConfig[selectedPlatform].metrics.shortVsLong]}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {finalRecentPosts.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                            <SectionTitle title="Latest Activity" />
                            <div className="space-y-4">
                                {finalRecentPosts.slice(0, 3).map((post, idx) => {
                                    const postText = typeof post === 'object' && post !== null ? post.text : post;
                                    const postDate = typeof post === 'object' && post !== null ? post.date : null;
                                    return (
                                        <div key={idx} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex gap-4 items-start">
                                            <div className="w-1 h-full bg-pucho-purple rounded-full shrink-0 min-h-[40px]"></div>
                                            <div>
                                                <p className="text-sm text-gray-800 line-clamp-2 mb-1 font-medium">{postText}</p>
                                                {postDate && <p className="text-xs text-gray-400">{new Date(postDate).toLocaleDateString()}</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                                <button
                                    onClick={() => setActiveTab('posts')}
                                    className="w-full py-2 text-center text-sm text-pucho-purple font-medium hover:text-purple-700 transition-colors"
                                >
                                    View all posts →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );

        const renderPosts = () => (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 animate-fade-in">
                <SectionTitle title={`Recent Posts (${finalRecentPosts.length})`} />
                {finalRecentPosts.length > 0 ? (
                    <div className="space-y-6">
                        {finalRecentPosts.map((post, idx) => {
                            const isObj = typeof post === 'object' && post !== null;
                            const postText = isObj ? post.text : post;
                            const postDate = isObj ? post.date : null;
                            const postUrl = isObj ? post.url : null;
                            const postLikes = isObj ? post.likes : null;

                            return (
                                <div key={idx} className="flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition-colors">
                                    <div className="md:w-1/4 flex-shrink-0">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                            {postDate ? new Date(postDate).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            }) : 'Unknown Date'}
                                        </div>
                                        {postUrl && (
                                            <a
                                                href={postUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-pucho-purple text-sm font-semibold hover:underline mt-2"
                                            >
                                                View original <Share2 className="w-3 h-3" />
                                            </a>
                                        )}
                                        {postLikes && (
                                            <div className="mt-4 text-sm">
                                                <span className="text-gray-900 font-bold">{postLikes}</span> <span className="text-gray-500">Likes</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:w-3/4">
                                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                            {postText}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        No recent posts found for this brand.
                    </div>
                )}
            </div>
        );

        const renderStrategy = () => (
            <div className="space-y-6 animate-fade-in">
                {/* Core Identity & Positioning */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Core Identity & Positioning" />
                    {positioningStatement && (
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-6">
                            <h4 className="text-sm font-bold text-blue-900 uppercase mb-2">Positioning Statement</h4>
                            <p className="text-blue-900 leading-relaxed font-medium">{positioningStatement}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <InfoBlock label="Problem Statement" value={selectedBrand['Problem Statement']} />
                        <InfoBlock label="Perceived Uniqueness" value={perceivedUniqueness} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 mt-6 border-t border-gray-100">
                        <InfoBlock label="Brand Personality Traits" value={<TagList tags={personality} />} />
                        <InfoBlock label="Core Values" value={<TagList tags={coreValues} />} />
                        <InfoBlock label="Belief System" value={selectedBrand['Belief System']} />
                    </div>
                </div>

                {/* Target Audience */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Target Audience Analysis" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                        <InfoBlock label="Primary Audience" value={primaryAudience} />
                        <InfoBlock label="Secondary Audience" value={secondaryAudience} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <InfoBlock label="Geographic Focus" value={geographicFocus} />
                        <InfoBlock label="Identity Reinforcement" value={identityReinforcement} />
                    </div>
                </div>

                {/* Communication Strategy */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Communication Strategy" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <InfoBlock label="Communication Style" value={selectedBrand['Communication Style']} />
                        <InfoBlock label="Interaction Style" value={interactionStyle} />
                        <InfoBlock label="Emotional Tone" value={selectedBrand['Emotional Tone']} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Voice & Tone</h4>
                            <div className="space-y-4">
                                <div>
                                    <span className="text-xs font-semibold text-gray-400">Language Complexity</span>
                                    <p className="text-gray-900 font-medium mt-1">{selectedBrand['Language Complexity'] || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-xs font-semibold text-gray-400">Voice Keywords</span>
                                    <p className="text-gray-900 mt-1">{selectedBrand['Voice Keywords'] || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                            <h4 className="text-xs font-bold text-purple-900 uppercase tracking-widest mb-4">Psychological Strategy</h4>
                            <div>
                                <span className="text-xs font-semibold text-purple-400">Psychological Hook</span>
                                <p className="text-purple-900 font-medium mt-1">{selectedBrand['Psychological Hook'] || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );


        const renderContent = () => (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Content Framework" />
                        <div className="space-y-6">
                            <InfoBlock label="Content Pillars" value={contentPillars} />
                            <div className="grid grid-cols-2 gap-4">
                                <InfoBlock label="Posting Intent" value={selectedBrand['Posting Intent']} />
                                <InfoBlock label="Content Depth" value={selectedBrand['Content Depth']} />
                            </div>
                            <InfoBlock label="Algorithm Triggers" value={algoTriggers} />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Voice & Tone" />
                        <div className="space-y-6">
                            <InfoBlock label="Voice Keywords" value={<TagList tags={parseList(selectedBrand['Brand Voice Keywords'] || selectedBrand['Voice Keywords'])} />} />
                            <div className="grid grid-cols-2 gap-4">
                                <InfoBlock label="Emotional Tone" value={selectedBrand['Emotional Tone']} />
                                <InfoBlock label="Consistency of Voice" value={selectedBrand['Consistency of Voice']} />
                            </div>
                            <InfoBlock label="Communication Style" value={selectedBrand['Communication Style']} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Format Strategy" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <InfoBlock label="Typical Formats" value={parseList(selectedBrand['Typical Content Formats'])} />
                        <InfoBlock label="Length Preference" value={selectedBrand['Short vs Long Form']} />
                        <InfoBlock label="Media Mix" value={parseList(selectedBrand['Videos vs Static'] || selectedBrand['Media Mix'])} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Campaigns & Themes" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
                            <h4 className="text-sm font-bold text-yellow-900 uppercase tracking-widest mb-4">Identified Campaigns</h4>
                            <TagList tags={identifiedCampaigns} />
                        </div>
                        <div className="bg-teal-50 p-6 rounded-xl border border-teal-100">
                            <h4 className="text-sm font-bold text-teal-900 uppercase tracking-widest mb-4">Top Performing Themes</h4>
                            <TagList tags={topPerformingThemes} />
                        </div>
                    </div>
                </div>
            </div>
        );

        const renderCompetitive = () => (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                    <SectionTitle title="Market Position" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <InfoBlock label="Direct Competitors" value={competitors} />
                            <InfoBlock label="Category" value={selectedBrand['competitive category']} />
                        </div>
                        <div className="space-y-4">
                            <InfoBlock label="Market Gap Opportunity" value={selectedBrand['Market Gap Opportunity']} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                            <SectionTitle title="Competitive Advantage" />
                            <p className="text-green-900 font-medium mb-4">{selectedBrand['competitive advantage'] || '-'}</p>
                            <h5 className="text-xs font-bold text-green-800 uppercase tracking-widest mb-2">Strengths</h5>
                            <TagList tags={strengths} />
                        </div>
                        <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                            <SectionTitle title="Disadvantage" />
                            <p className="text-red-900 font-medium mb-4">{selectedBrand['competative disadvantage'] || '-'}</p>
                            <h5 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-2">Weaknesses</h5>
                            <TagList tags={weaknesses} />
                        </div>
                    </div>
                </div>
            </div>
        );

        const renderGrowth = () => (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                <div className="lg:col-span-2 space-y-8">
                    {/* Growth Trajectory */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Growth Trajectory" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <InfoBlock label="Current Growth Stage" value={selectedBrand['Current Growth Stage']} />
                            <InfoBlock label="Growth Potential" value={selectedBrand['Growth Potential']} className="text-green-600 font-bold" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                            <InfoBlock label="Viral Probability" value={viralProbability} />
                            <InfoBlock label="Expansion Readiness" value={platformExpansionReadiness} />
                            <InfoBlock label="Algorithm Friendliness" value={algorithmFriendliness} />
                        </div>
                    </div>

                    {/* Strategic Roadmap */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Strategic Roadmap (90 Days)" />
                        <div className="mb-8 p-6 bg-purple-50 rounded-xl border border-purple-100">
                            <h4 className="text-sm font-bold text-pucho-purple uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Target className="w-4 h-4" /> Focus Areas
                            </h4>
                            <ul className="space-y-3">
                                {strategicFocus.map((focus, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-pucho-purple shrink-0" />
                                        <span className="text-gray-800 font-medium">{focus}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <InfoBlock label="Immediate Optimizations" value={optimizations} />
                            <InfoBlock label="Scaling Constraints" value={scalingConstraint} />
                        </div>
                    </div>

                    {/* Content Experiments */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                        <SectionTitle title="Content Experiments" />
                        <div className="space-y-3">
                            {experiments.map((idea, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-pucho-purple rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                                    <span className="mt-1">{typeof idea === 'string' ? idea : JSON.stringify(idea)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Health Scorecard */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
                        <SectionTitle title="Health Scorecard" />
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard label="Brand Score" value={selectedBrand['Brand Score']} />
                            <StatCard label="Consistency" value={selectedBrand['Content_Consistency Level'] || selectedBrand['Estimated Consistency Score']} />
                        </div>
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                            <InfoBlock label="Authority Level" value={selectedBrand['Authority Level']} />
                        </div>
                    </div>

                    {/* Risk Analysis */}
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-8 space-y-6">
                        <SectionTitle title="Risk Analysis" className="text-red-900" />
                        <div className="space-y-6">
                            <InfoBlock label="Brand Risk" value={<TagList tags={brandRisk} />} />
                            <InfoBlock label="Platform Dependency" value={platformRisk} />
                            <InfoBlock label="Audience Relationship" value={audienceRelationship} />
                            <InfoBlock label="Collaboration Sustainability" value={collaborationSustainability} />

                            {/* Monetization */}
                            <div>
                                <h4 className="text-xs font-semibold text-red-800/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <DollarSign className="w-3 h-3" /> Monetization Signals
                                </h4>
                                <div className="bg-white/50 rounded-xl p-4 border border-red-100 space-y-3">
                                    <div className="flex justify-between items-center border-b border-red-100 pb-2">
                                        <span className="text-xs font-bold text-red-800 uppercase">Readiness</span>
                                        <span className="text-sm font-bold text-red-900">{monetization.monetization_readiness || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-red-800 uppercase block mb-1">Likely Paths</span>
                                        {Array.isArray(monetization.likely_monetization_paths) ? (
                                            <div className="flex flex-wrap gap-1">
                                                {monetization.likely_monetization_paths.map((p, i) => (
                                                    <span key={i} className="text-xs bg-white text-red-800 px-2 py-1 rounded border border-red-200">{p}</span>
                                                ))}
                                            </div>
                                        ) : <span className="text-sm text-red-900">{String(monetization.likely_monetization_paths || '-')}</span>}
                                    </div>
                                    <div className="flex justify-between items-center border-t border-red-100 pt-2">
                                        <span className="text-xs font-bold text-red-800 uppercase">Alignment</span>
                                        <span className="text-sm font-bold text-red-900">{monetization.brand_to_business_alignment || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );




        return (
            <div className="space-y-8 animate-fade-in pb-20">
                {/* Header */}
                {/* Header */}
                {/* Header - Only show if NOT embedded */}
                {!embeddedBrand && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
                        <div className="flex items-center gap-6">

                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">{selectedBrand._brandInfo.name}</h1>
                                    <span className="text-gray-300 font-light text-2xl">/</span>
                                    <div className="flex items-center bg-gray-100/80 p-1 rounded-xl">
                                        <button
                                            onClick={() => navigate(`/dna/${selectedBrand._brandInfo.slug}`)}
                                            className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-white/50"
                                        >
                                            Brand DNA
                                        </button>
                                        <span className="px-4 py-1.5 bg-white shadow-sm rounded-lg text-sm font-semibold text-pucho-purple border border-gray-100 cursor-default">
                                            Social Media DNA
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-2">
                                    <span className="font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">{selectedBrand['Platform'] || 'Platform'}</span>
                                    <span>•</span>
                                    <span>@{selectedBrand['Username'] || 'username'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-none">
                    <TabButton id="overview" label="Overview" icon={LayoutDashboard} />
                    <TabButton id="posts" label="Posts" icon={Image} />
                    <TabButton id="strategy" label="Strategy" icon={Target} />
                    <TabButton id="content" label="Content DNA" icon={MessageSquare} />
                    <TabButton id="competitive" label="Competitive" icon={ShieldCheck} />
                    <TabButton id="growth" label="Growth & Risk" icon={TrendingUp} />

                </div>

                {/* Tab Content Area */}
                <div className="min-h-[500px]">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'posts' && renderPosts()}
                    {activeTab === 'strategy' && renderStrategy()}
                    {activeTab === 'content' && renderContent()}
                    {activeTab === 'competitive' && renderCompetitive()}
                    {activeTab === 'growth' && renderGrowth()}

                </div>



            </div >
        );
    }

    // MASTER GRID VIEW (Only if NOT embedded)
    if (embeddedBrand) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] bg-gray-50 rounded-[32px] border border-gray-100 text-center p-8">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-gray-300">
                    <Share2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No Social Media Data Found</h3>
                <p className="text-gray-500 max-w-sm mt-2">We couldn't find any connected social media analysis for this brand.</p>
            </div>
        );
    }

    // MASTER GRID VIEW
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-pucho-purple">
                    <Share2 className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Social Media DNA</h1>
                    <p className="text-gray-500">Analyze your social media presence and strategy</p>
                </div>
            </div>

            {joinedData.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-subtle flex flex-col items-center justify-center text-center">
                    <p className="text-gray-500">No data found in the connected sheet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {joinedData.map((item, idx) => (
                        <Card
                            key={idx}
                            title={item._brandInfo.name}
                            description={item['Brand Platform'] || item._brandInfo.shortDescription || 'Click to view details'}
                            logo={item._brandInfo.logo}
                            onClick={() => setSelectedBrand(item)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SocialMediaDNA;
