import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, BarChart2, Users, Layers, Target, TrendingUp, AlertTriangle, Shield,
    LayoutGrid, Globe, Brain, Sparkles, Scale, Swords, Award, StickyNote, Activity, Zap,
    MessageCircle, MapPin, Briefcase, Link as LinkIcon, CheckCircle2, Crown, Percent,
    Calendar, ExternalLink, MessageSquare
} from 'lucide-react';

/**
 * SocialComparisonModal
 * Premium Redesign - V2 Fixed
 */
const SocialComparisonModal = ({ isOpen, onClose, report }) => {
    if (!isOpen || !report) return null;

    const [activeTab, setActiveTab] = useState('comparison');
    const [isScrolled, setIsScrolled] = useState(false);

    // Scroll reset on tab change
    useEffect(() => {
        const content = document.getElementById('modal-content-body');
        if (content) {
            content.scrollTop = 0;
            // Add scroll listener
            const handleScroll = () => {
                setIsScrolled(content.scrollTop > 50);
            };
            content.addEventListener('scroll', handleScroll);
            return () => content.removeEventListener('scroll', handleScroll);
        }
    }, [activeTab]);

    const brandAName = report['Brand A Username'] || 'Brand A';
    const brandBName = report['Brand B Username'] || 'Brand B';

    // --- UTILS ---

    // Robust parser for the "dirty" JSON often coming from sheets/LLMs
    const parseData = (input) => {
        if (input === null || input === undefined) return null;
        if (typeof input === 'object') return input;

        const clean = String(input).trim();
        // If it doesnt look like structure, return string
        if (!clean.startsWith('{') && !clean.startsWith('[')) return clean;

        try {
            return JSON.parse(clean);
        } catch (e) {
            try {
                // Common issue: "Double escaped" quotes or newlines common in CSV exports
                const fixed = clean
                    .replace(/\\n/g, "\\n")
                    .replace(/\\'/g, "'")
                    .replace(/\\"/g, '"')
                    .replace(/""/g, '"') // weird csv artifact
                    .replace(/"{/g, '{')
                    .replace(/}"/g, '}');
                return JSON.parse(fixed);
            } catch (e2) {
                // console.warn("Failed to parse JSON", clean);
                return clean; // Fallback to raw string
            }
        }
    };

    const formatLabel = (key) => {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    // --- COMPONENTS ---

    const Badge = ({ children, color = 'gray' }) => {
        const styles = {
            gray: 'bg-gray-100 text-gray-700 border-gray-200',
            indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
            rose: 'bg-rose-50 text-rose-700 border-rose-100',
            green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            blue: 'bg-blue-50 text-blue-700 border-blue-100',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[color] || styles.gray}`}>
                {children}
            </span>
        );
    };

    const PostCard = ({ post }) => {
        // Handle various post shapes
        const text = post.text || post.content || post.description || "";
        const date = post.date || post.posted_at || "";
        const url = post.url || post.link || post.permalink || "";
        const headline = post.headline || "";

        return (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all h-full flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    {date && (
                        <div className="flex items-center text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded border border-gray-100">
                            <Calendar className="w-3 h-3 mr-1" />
                            {date}
                        </div>
                    )}
                    {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium" title="View Post">
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </div>
                {headline && <h4 className="font-bold text-gray-900 text-sm mb-2 leading-tight">{headline}</h4>}
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line line-clamp-4 flex-1">
                    {text.replace(/\\n/g, '\n')}
                </p>
            </div>
        );
    };

    const MetricValue = ({ value, align = 'left', theme = 'gray' }) => {
        if (value === null || value === undefined) return <span className="text-gray-300 italic text-xs">N/A</span>;

        const data = parseData(value);
        const colorClass = theme === 'indigo' ? 'text-indigo-600' : theme === 'rose' ? 'text-rose-600' : 'text-gray-900';

        // 1. Array handling
        if (Array.isArray(data)) {
            // Check if it's an array of objects (likely posts or complex data)
            if (data.length > 0 && typeof data[0] === 'object') {
                return (
                    <div className="grid grid-cols-1 gap-3 mt-2">
                        {data.map((item, i) => (
                            <div key={i}>
                                {/* Try to detect if it's a post-like object */}
                                {(item.text || item.headline || item.url) ? (
                                    <PostCard post={item} />
                                ) : (
                                    // Fallback for generic objects
                                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 border border-gray-100">
                                        {Object.entries(item).map(([k, v]) => (
                                            <div key={k} className="flex gap-2">
                                                <span className="font-bold text-gray-400">{k}:</span>
                                                <span className="truncate">{String(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            }

            // Simple string array -> Chips
            return (
                <div className={`flex flex-wrap gap-2 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                    {data.map((item, i) => (
                        <span key={i} className="px-2 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-md shadow-sm">
                            {String(item)}
                        </span>
                    ))}
                </div>
            );
        }

        // 2. Object handling
        if (typeof data === 'object') {
            return (
                <div className={`space-y-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
                    {Object.entries(data).map(([k, v]) => (
                        // Skip empty keys/values
                        v ? (
                            <div key={k} className="text-sm">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{formatLabel(k)}</span>
                                <span className="text-gray-700 font-medium">{String(v)}</span>
                            </div>
                        ) : null
                    ))}
                </div>
            );
        }

        // 3. String/Number handling
        const stringVal = String(data);
        const isMetric = stringVal.length < 20 && /[\d%]+/.test(stringVal);

        if (isMetric) {
            return (
                <div className={`text-xl font-bold ${colorClass} tracking-tight font-display`}>
                    {stringVal}
                </div>
            );
        }

        return (
            <div className={`prose prose-sm max-w-none text-gray-600 leading-relaxed text-sm ${align === 'right' ? 'text-right' : 'text-left'}`}>
                <p className="whitespace-pre-line">{stringVal.replace(/\\n/g, '\n')}</p>
            </div>
        );
    };

    // --- COMPARISON COMPONENTS ---

    const ComparisonRow = ({ label, aVal, bVal }) => (
        <div className="grid grid-cols-12 gap-0 py-1 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors group items-stretch">
            {/* Brand A - Left Side (Indigo) */}
            <div className="col-span-12 sm:col-span-5 order-2 sm:order-1 text-left sm:text-right px-4 py-3 bg-indigo-50 border-l-4 border-indigo-300 rounded-r-lg sm:rounded-r-none sm:rounded-l-lg my-1 sm:my-0 ml-1 sm:ml-0">
                <MetricValue value={aVal} align="right" theme="indigo" />
            </div>

            {/* Label - Center */}
            <div className="col-span-12 sm:col-span-2 order-1 sm:order-2 flex justify-center items-center py-2 sm:py-0">
                <div className="bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center shadow-sm whitespace-normal z-10">
                    {label}
                </div>
            </div>

            {/* Brand B - Right Side (Rose) */}
            <div className="col-span-12 sm:col-span-5 order-3 flex items-center px-4 py-3 bg-rose-50 border-l-4 sm:border-l-0 sm:border-r-4 border-rose-300 rounded-r-lg my-1 sm:my-0 mr-1 sm:mr-0">
                <MetricValue value={bVal} align="left" theme="rose" />
            </div>
        </div>
    );

    const ComparisonCard = ({ title, icon: Icon, dataKey, description }) => {
        const rawValue = report[dataKey];
        if (!rawValue) return null;

        const data = parseData(rawValue);
        let aContent = null;
        let bContent = null;
        let insight = null;

        // Splitting logic
        if (typeof data === 'object' && !Array.isArray(data)) {
            const keys = Object.keys(data);
            // More robust keys finding
            const aKey = keys.find(k => /BRAND[_\s]?A/i.test(k) || k.includes(brandAName));
            const bKey = keys.find(k => /BRAND[_\s]?B/i.test(k) || k.includes(brandBName));
            const iKey = keys.find(k => /INSIGHT|KEY[_\s]?DIFF|VERDICT/i.test(k));
            if (aKey) aContent = data[aKey];
            if (bKey) bContent = data[bKey];
            if (iKey) insight = data[iKey];
        } else if (typeof data === 'string') {
            // Basic text splitter if object parse failed
            const text = data.trim();
            const aMatch = text.search(/BRAND[_\s]?A|Brand 1/i);
            const bMatch = text.search(/BRAND[_\s]?B|Brand 2/i);
            const iMatch = text.search(/INSIGHT|KEY[_\s]?DIFF|VERDICT/i);

            if (aMatch !== -1 && bMatch !== -1) {
                const parts = [
                    { type: 'A', index: aMatch },
                    { type: 'B', index: bMatch },
                    ...(iMatch !== -1 ? [{ type: 'I', index: iMatch }] : [])
                ].sort((a, b) => a.index - b.index);

                parts.forEach((part, i) => {
                    const content = text.substring(part.index, parts[i + 1]?.index || text.length)
                        .replace(/^(BRAND[_\s]?[AB]|Brand [12]|INSIGHT|KEY[_\s]?DIFF|VERDICT)[:\s]*/i, '').replace(/^[-–:]\s*/, '').trim();
                    if (part.type === 'A') aContent = content;
                    if (part.type === 'B') bContent = content;
                    if (part.type === 'I') insight = content;
                });
            } else {
                aContent = data; // show as unified text
            }
        }

        // If we still didn't get split content, treat whole as Brand A if visual wrapper
        if (!aContent && !bContent) aContent = data;

        const isStructured = typeof parseData(aContent) === 'object' && typeof parseData(bContent) === 'object';

        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 transition-all hover:shadow-md">
                <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-200">
                            <Icon className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
                            {description && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{description}</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-2">
                    {isStructured ? (
                        <div className="flex flex-col">
                            {(() => {
                                const aObj = parseData(aContent) || {};
                                const bObj = parseData(bContent) || {};
                                const allKeys = Array.from(new Set([...Object.keys(aObj), ...Object.keys(bObj)]));
                                const validKeys = allKeys.filter(k => !/BRAND|INSIGHT|VERDICT/i.test(k));
                                return validKeys.map(key => (
                                    <ComparisonRow key={key} label={formatLabel(key)} aVal={aObj[key]} bVal={bObj[key]} />
                                ));
                            })()}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                            <div className="p-4 sm:p-6">
                                <div className="block md:hidden text-xs font-bold text-indigo-600 mb-2">{brandAName}</div>
                                <MetricValue value={aContent} theme="indigo" />
                            </div>
                            <div className="p-4 sm:p-6">
                                <div className="block md:hidden text-xs font-bold text-rose-600 mb-2">{brandBName}</div>
                                <MetricValue value={bContent} theme="rose" />
                            </div>
                        </div>
                    )}
                </div>
                {/* Insight footer moved to logic above if needed, but handled inside ComparisonRow often */}
                {insight && (
                    <div className="px-6 py-4 bg-amber-50/50 border-t border-amber-100/50 flex gap-4">
                        <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-700 leading-relaxed">
                            <span className="font-bold text-gray-900 mr-2">Key Insight:</span>
                            {String(parseData(insight))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const ComparisonView = () => (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Header VS Card */}
            <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden sticky top-0 z-[100] transition-all duration-500 ease-in-out ${isScrolled ? 'my-0 rounded-none border-x-0 border-t-0 shadow-md transform-gpu' : 'rounded-2xl border shadow-sm'}`}>
                <div className="flex flex-col lg:flex-row items-stretch">

                    {/* Brand A Section (Indigo) */}
                    <div className={`flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-transparent relative overflow-hidden transition-all duration-500 ease-in-out ${isScrolled ? 'p-2' : 'p-8'}`}>
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>

                        {/* Flex Container: Logo - Spacer - Text */}
                        <div className="flex flex-wrap flex-row items-center justify-center z-10 w-full">

                            {/* Logo */}
                            <div className={`bg-white border-2 border-indigo-200 rounded-2xl shadow-xl shadow-indigo-100/50 flex items-center justify-center text-indigo-700 font-bold transition-all duration-500 ease-in-out ${isScrolled ? 'w-10 h-10 text-lg border' : 'w-20 h-20 text-3xl'}`}>
                                {brandAName[0]}
                            </div>

                            {/* Dynamic Spacer: Transitions from full width (break) to small gap (inline) */}
                            <div className={`transition-all duration-500 ease-in-out ${isScrolled ? 'w-3 h-0' : 'w-full h-4'}`}></div>

                            {/* Text Content */}
                            <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out px-4 w-full ${isScrolled ? 'text-left items-start' : 'text-center'}`}>
                                <h2 className={`font-bold text-gray-900 transition-all duration-500 ease-in-out leading-tight overflow-hidden text-ellipsis ${isScrolled ? 'text-base line-clamp-1' : 'text-xl md:text-2xl line-clamp-3'}`}>{brandAName}</h2>
                                <div className={`flex justify-center overflow-hidden transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0' : 'h-6 opacity-100 mt-2'}`}>
                                    <Badge color="indigo">Primary Brand</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VS Badge */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                        <div className={`rounded-full bg-white border-gray-50 text-gray-400 font-black uppercase tracking-widest flex items-center justify-center shadow-lg transition-all duration-500 ease-in-out ${isScrolled ? 'w-8 h-8 text-[8px] border-2 scale-90' : 'w-12 h-12 text-xs border-4 scale-100'}`}>
                            VS
                        </div>
                    </div>
                    {/* Mobile VS */}
                    <div className={`flex lg:hidden justify-center bg-gray-50/50 transition-all duration-500 ease-in-out ${isScrolled ? 'py-0 h-0 opacity-0 overflow-hidden' : 'py-4 h-auto opacity-100'}`}>
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center shadow-sm">
                            VS
                        </div>
                    </div>

                    {/* Brand B Section (Rose) */}
                    <div className={`flex-1 flex items-center justify-center bg-gradient-to-bl from-rose-100 via-white to-transparent relative overflow-hidden transition-all duration-500 ease-in-out ${isScrolled ? 'p-2' : 'p-8'}`}>
                        <div className="absolute top-0 right-0 w-full h-2 bg-rose-500"></div>

                        {/* Flex Container: Logo - Spacer - Text (Reversed Order visual) */}
                        <div className="flex flex-wrap flex-row-reverse items-center justify-center z-10 w-full">

                            {/* Logo */}
                            <div className={`bg-white border-2 border-rose-200 rounded-2xl shadow-xl shadow-rose-100/50 flex items-center justify-center text-rose-600 font-bold transition-all duration-500 ease-in-out ${isScrolled ? 'w-10 h-10 text-lg border' : 'w-20 h-20 text-3xl'}`}>
                                {brandBName[0]}
                            </div>

                            {/* Dynamic Spacer */}
                            <div className={`transition-all duration-500 ease-in-out ${isScrolled ? 'w-3 h-0' : 'w-full h-4'}`}></div>

                            {/* Text Content */}
                            <div className={`flex flex-col items-center justify-center transition-all duration-500 ease-in-out px-4 w-full ${isScrolled ? 'text-right items-end' : 'text-center'}`}>
                                <h2 className={`font-bold text-gray-900 transition-all duration-500 ease-in-out leading-tight overflow-hidden text-ellipsis ${isScrolled ? 'text-base line-clamp-1' : 'text-xl md:text-2xl line-clamp-3'}`}>{brandBName}</h2>
                                <div className={`flex justify-center overflow-hidden transition-all duration-500 ease-in-out ${isScrolled ? 'h-0 opacity-0' : 'h-6 opacity-100 mt-2'}`}>
                                    <Badge color="rose">Market Benchmark</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Verdict */}
            {(report.overall_verdict) && (
                <div className="bg-indigo-400/50 rounded-2xl p-6 md:p-8 text-white shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-black mb-2">Executive Verdict</h3>
                            <p className="text-black leading-relaxed font-dark text-lg">"{report.overall_verdict}"</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Cards Grid */}
            <div className="space-y-4">
                <ComparisonCard label="Market & Scale" title="Market Scale Comparison" icon={Scale} dataKey="profile_scale_comparison" description="Size & Reach" />
                <ComparisonCard label="Positioning" title="Brand Positioning" icon={Target} dataKey="brand_positioning" description="Value Proposition" />
                <ComparisonCard label="Audience" title="Audience & Reach" icon={Users} dataKey="audience_targeting" description="Target Demographics" />
                <ComparisonCard label="Content" title="Content Strategy" icon={Layers} dataKey="content_strategy_comparison" description="Themes & Formats" />
                <ComparisonCard label="Moat" title="Competitive Moat" icon={Shield} dataKey="competitive_moat_analysis" description="Defenserbility" />
                <ComparisonCard label="Strategy" title="Strategic Leverage" icon={Swords} dataKey="strategic_advantage_summary" description="Actionable Edge" />
            </div>
        </div>
    );

    const BrandProfileView = ({ prefix, isPrimary }) => {
        const sections = [
            { id: 'core', title: 'Identity', icon: Target, fields: ['Slogan', 'Industry', 'Sub Niche', 'Business Model', 'Brand Personality Traits', 'Core Values'] },
            { id: 'audience', title: 'Audience', icon: Users, fields: ['Target Audience Primary', 'Target Audience Secondary', 'Geographic Focus', 'Audience Relationship'] },
            { id: 'content', title: 'Content Engine', icon: Layers, fields: ['Content_Pillars', 'Typical Content Formats', 'Linkedin Dominant Format', 'Communication Style', 'Brand Voice Keywords'] },
            { id: 'perf', title: 'Engagement', icon: Activity, fields: ['Linkedin Month on Month Activity', 'Linkedin Estimated Consistency Score', 'Interaction Style', 'Viral Probablity'] },
        ];

        const username = report[`${prefix} Username`];
        const url = report[`${prefix} - url`];
        const address = parseData(report[`${prefix} Address`]);
        const stats = parseData(report[`${prefix} Linkedin Stats`] || {});
        const colorBase = isPrimary ? 'indigo' : 'rose';

        // Identify keys to display in "Extended" section
        const displayedFields = new Set([
            `${prefix} Username`, `${prefix} - url`, `${prefix} Address`, `${prefix} Linkedin Stats`, `${prefix} Linkedin Recent Posts`
        ]);
        sections.forEach(s => s.fields.forEach(f => displayedFields.add(`${prefix} ${f}`)));

        const extraKeys = Object.keys(report).filter(key =>
            key.startsWith(prefix) && !displayedFields.has(key) && report[key] && !key.includes('HTML')
        );

        // Specific Extraction of Recent Posts for Special Feed
        const recentPosts = parseData(report[`${prefix} Linkedin Recent Posts`]);

        return (
            <div className="max-w-6xl mx-auto space-y-6 pb-12">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0 ${isPrimary ? 'bg-indigo-600' : 'bg-rose-500'}`}>
                        {username?.charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{username}</h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500 font-medium">
                            {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                    <Globe className="w-4 h-4" />
                                    {url.replace('https://', '').replace(/\/$/, '')}
                                </a>
                            )}
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span>{address?.addressRegion || 'Headquarters'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Followers</div>
                            <div className="text-lg font-bold text-gray-900">{stats?.followers || '-'}</div>
                        </div>
                        <div className="px-5 py-2 rounded-xl bg-gray-50 border border-gray-100 text-center">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Employees</div>
                            <div className="text-lg font-bold text-gray-900">{stats?.employees || '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {sections.map(section => (
                        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                <section.icon className={`w-5 h-5 ${isPrimary ? 'text-indigo-600' : 'text-rose-500'}`} />
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{section.title}</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {section.fields.map(field => {
                                    const val = report[`${prefix} ${field}`];
                                    if (!val) return null;
                                    return (
                                        <div key={field}>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{formatLabel(field)}</div>
                                            <MetricValue value={val} align="left" theme={colorBase} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Feed Section - Dedicated */}
                {recentPosts && Array.isArray(recentPosts) && recentPosts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <MessageSquare className={`w-5 h-5 ${isPrimary ? 'text-indigo-600' : 'text-rose-500'}`} />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Recent Content Feed</h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentPosts.map((post, i) => (
                                <PostCard key={i} post={post} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Extra Details Table */}
                {extraKeys.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-gray-400" />
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Additional Intelligence</h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {extraKeys.map(key => (
                                <div key={key} className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 hover:bg-gray-50/30 transition-colors">
                                    <div className="md:col-span-4 lg:col-span-3">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            {key.replace(prefix, '').trim().replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="md:col-span-8 lg:col-span-9">
                                        <MetricValue value={report[key]} align="left" theme={colorBase} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            {/* Dynamic Backdrop */}
            <div className={`absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />

            {/* Modal Content */}
            <div className={`relative bg-[#f8fafc] w-full h-full md:h-[95vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-[1400px] transition-all duration-300 transform ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>

                {/* Navbar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between shrink-0 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                            <BarChart2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">Social Comparison</h1>
                            <p className="text-xs text-gray-500 font-medium">AI-Powered Competitive Analysis</p>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1.5 bg-gray-100 rounded-xl">
                        <button
                            onClick={() => setActiveTab('comparison')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeTab === 'comparison' ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <Scale className="w-3.5 h-3.5" />
                            Comparison
                        </button>
                        <div className="w-px bg-gray-200 my-2 mx-1"></div>
                        <button
                            onClick={() => setActiveTab('brandA')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeTab === 'brandA' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {brandAName}
                        </button>
                        <button
                            onClick={() => setActiveTab('brandB')}
                            className={`px-5 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2 ${activeTab === 'brandB' ? 'bg-rose-500 text-white shadow-md shadow-rose-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {brandBName}
                        </button>
                    </div>

                    <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Body */}
                <div id="modal-content-body" className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pt-2 pb-10 scroll-smooth bg-[#f8fafc]">
                    {activeTab === 'comparison' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <ComparisonView />
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-500">
                            <BrandProfileView
                                prefix={activeTab === 'brandA' ? 'Brand A' : 'Brand B'}
                                isPrimary={activeTab === 'brandA'}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SocialComparisonModal;
