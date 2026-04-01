import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Brain, MessageSquare, Clock, FileText, User, Building, AlertCircle, MessageCircle, MessageSquareText } from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

export function CallDetailModal({ call, onClose }) {
    const [activeTab, setActiveTab] = useState('insights');
    const [transcriptMode, setTranscriptMode] = useState('original'); // 'original' | 'english'
    const scrollRef = useRef(null);
    const [showNavigator, setShowNavigator] = useState(true);
    const lastScrollY = useRef(0);

    // Reset navigator when tab changes
    useEffect(() => {
        setShowNavigator(true);
        lastScrollY.current = 0;
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [activeTab]);

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return;

            const currentScrollY = scrollRef.current.scrollTop;
            const threshold = 10; // Minimum scroll diff to trigger change

            // Scrolling Down -> Hide
            if (currentScrollY > lastScrollY.current + threshold) {
                setShowNavigator(false);
            }
            // Scrolling Up -> Show
            else if (currentScrollY < lastScrollY.current - threshold) {
                setShowNavigator(true);
            }

            lastScrollY.current = currentScrollY;
        };

        const container = scrollRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    if (!call) return null;

    // Helper: Format labels (remove underscores, title case)
    const formatLabel = (str) => {
        if (!str || str === 'NOT_APPLICABLE' || str === 'NOT_AVAILABLE' || str === 'UNKNOWN') return 'N/A';
        return str.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    // Logic: Check for customer dialogue
    const transcription = call.transcription || ''; // Safe fallback
    const customerLines = transcription.split('\n').filter(l => l.trim().toLowerCase().startsWith('customer'));
    const actualDialogue = customerLines.length > 0;

    // Logic: Interest Status Display
    let displayStatus = formatLabel(call.interestClassification?.interest_status);
    if (call.interestClassification?.interest_status === 'VOICEMAIL' && !actualDialogue) {
        displayStatus = 'Call Not Reached';
    }

    // Helper: Check if list has valid data
    const hasData = (list) => list && list.length > 0 && !list.includes('NOT_AVAILABLE');

    // Helper: Parse Detailed Summary
    const renderDetailedSummary = (summary) => {
        if (!summary) return <p className="text-sm text-gray-500 italic">No detailed summary available.</p>;

        const sectionNames = ["Opening", "Problem Discussion", "Solution", "Pricing", "Closing"];
        // Match headers followed by : or → or -> (with optional whitespace)
        const headerPattern = new RegExp(
            `(${sectionNames.join('|')})\\s*(?::|→|->)\\s*`, 'gi'
        );

        // Check if any known section headers exist in the text
        const hasHeaders = sectionNames.some(name => new RegExp(name, 'i').test(summary));

        if (hasHeaders) {
            // Split by headers, keeping the header names as separate tokens
            const splitPattern = new RegExp(`(${sectionNames.join('|')})\\s*(?::|→|->)\\s*`, 'gi');
            const tokens = summary.split(splitPattern).map(t => t?.trim()).filter(Boolean);

            const sections = [];
            let currentHeader = null;
            let currentTexts = [];

            const flushSection = () => {
                if (currentHeader && currentTexts.length > 0) {
                    sections.push({ header: currentHeader, texts: [...currentTexts] });
                }
                currentTexts = [];
            };

            tokens.forEach(token => {
                const isHeader = sectionNames.some(n => n.toLowerCase() === token.toLowerCase());
                if (isHeader) {
                    flushSection();
                    currentHeader = token;
                } else if (currentHeader) {
                    // Split remaining text by → or -> to get individual points
                    const points = token.split(/\s*(?:→|->)\s*/).map(s => s.trim()).filter(Boolean);
                    currentTexts.push(...points);
                } else {
                    // Text before any header — split by arrows too
                    const points = token.split(/\s*(?:→|->)\s*/).map(s => s.trim()).filter(Boolean);
                    points.forEach(p => {
                        sections.push({ header: null, texts: [p] });
                    });
                }
            });
            flushSection();

            if (sections.length > 0) {
                return (
                    <div className="space-y-1">
                        {sections.map((section, index) => (
                            <div key={index} className="mb-4 last:mb-0">
                                {section.header && (
                                    <span className="font-semibold text-gray-800 block text-xs uppercase tracking-wider mb-2">
                                        {section.header}
                                    </span>
                                )}
                                {section.texts.map((text, idx) => (
                                    <p key={idx} className="text-gray-600 text-sm leading-relaxed mb-1.5 last:mb-0">{text}</p>
                                ))}
                            </div>
                        ))}
                    </div>
                );
            }
        }

        // Fallback: Handle pure → or -> separated text (no section headers)
        if (summary.includes('→') || summary.includes('->')) {
            const steps = summary.split(/\s*(?:→|->)\s*/).map(s => s.trim()).filter(Boolean);
            return (
                <div className="space-y-2">
                    {steps.map((step, index) => (
                        <p key={index} className="text-gray-600 text-sm leading-relaxed">{step}</p>
                    ))}
                </div>
            );
        }

        // Handle newlines if present
        if (summary.includes('\n')) {
            return (
                <div className="space-y-2">
                    {summary.split('\n').map((para, idx) => (
                        para.trim() ? <p key={idx} className="text-gray-600 text-sm leading-relaxed">{para.trim()}</p> : null
                    ))}
                </div>
            );
        }

        return <p className="text-gray-600 text-sm leading-relaxed">{summary}</p>;
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog">
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] md:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 bg-white shrink-0 z-20">
                    <div className="min-w-0 flex-1 mr-4">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{call.customerName}</h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none"><Building className="w-3 h-3 shrink-0" /> {call.organization}</span>
                            <span className="text-gray-300 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 shrink-0"><Phone className="w-3 h-3 shrink-0" /> {call.mobile}</span>
                            <span className="text-gray-300 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3 shrink-0" /> {new Date(String(call.dateTime).replace(/\s*(?:[+-]\d{4}|[A-Z]{2,5})\s*$/g, '').trim()).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }).toUpperCase()}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 bg-white px-4 sm:px-6">
                            <button
                                onClick={() => setActiveTab('insights')}
                                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'insights'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                <span className="hidden sm:inline">AI Insights & Summary</span>
                                <span className="sm:hidden">Insights</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('transcript')}
                                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'transcript'
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <FileText className="w-4 h-4" />
                                <span className="hidden sm:inline">Full Transcript</span>
                                <span className="sm:hidden">Transcript</span>
                            </button>
                        </div>

                        {/* Tab Panels */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>

                            {activeTab === 'insights' && (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {/* Short Summary */}
                                    {call.shortSummary && (
                                        <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-100 shadow-sm">
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                Short Summary
                                            </h3>
                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                {call.shortSummary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detailed Summary */}
                                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="font-semibold text-gray-800 mb-4 text-base sm:text-lg">Detailed Summary</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            {renderDetailedSummary(call.detailedSummary || call.shortSummary)}
                                        </div>
                                    </div>

                                    {/* Key Insights Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Pain Points */}
                                        {hasData(call.conversationInsights?.pain_points_discussed) && (
                                            <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
                                                <h4 className="font-semibold text-rose-900 mb-3 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> Pain Points
                                                </h4>
                                                <ul className="space-y-2">
                                                    {call.conversationInsights.pain_points_discussed.map((point, i) => (
                                                        <li key={i} className="text-sm text-rose-800 flex items-start gap-2">
                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                                                            {point}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Solutions */}
                                        {hasData(call.conversationInsights?.solutions_presented) && (
                                            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100">
                                                <h4 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                                                    <Brain className="w-4 h-4" /> Solutions Presented
                                                </h4>
                                                <ul className="space-y-2">
                                                    {call.conversationInsights.solutions_presented.map((solution, i) => (
                                                        <li key={i} className="text-sm text-emerald-800 flex items-start gap-2">
                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                                                            {solution}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Customer Questions */}
                                    {hasData(call.conversationInsights?.customer_questions) && (
                                        <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                                            <h4 className="font-semibold text-blue-900 mb-3">Customer Questions</h4>
                                            <ul className="space-y-2">
                                                {call.conversationInsights.customer_questions.map((q, i) => (
                                                    <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 shrink-0" />
                                                        {q}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'transcript' && (
                                <div className="space-y-6 max-w-3xl mx-auto relative px-0 sm:px-0">

                                    {/* Language Toggle */}
                                    <div className={`flex justify-center mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 transition-transform duration-300 ${showNavigator ? 'translate-y-0' : '-translate-y-[150%]'}`}>
                                        <div className="bg-gray-100 p-1 rounded-lg flex shadow-sm border border-gray-200">
                                            <button
                                                onClick={() => setTranscriptMode('original')}
                                                className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${transcriptMode === 'original'
                                                    ? 'bg-white text-gray-800 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                Original (Hindi)
                                            </button>
                                            <button
                                                onClick={() => setTranscriptMode('english')}
                                                className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${transcriptMode === 'english'
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                English (Translated)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pb-20">
                                        {(() => {
                                            const rawText = transcriptMode === 'english' ? (call.englishTranscription || '') : (call.transcription || '');
                                            // Split by lookahead for Agent:/Customer: to handle continuous text, 
                                            // or just standard newlines if formatted that way.
                                            // Then filter empty strings.
                                            const lines = rawText
                                                .split(/(?=Agent:|Customer:)/g)
                                                .map(line => line.trim())
                                                .filter(line => line.length > 0);

                                            return lines.map((line, idx) => {
                                                const trimmedLine = line.trim();
                                                const isAgent = trimmedLine.startsWith('Agent:');
                                                let content = trimmedLine;

                                                // Remove the "Agent:" or "Customer:" prefix for the bubble content
                                                if (trimmedLine.includes(':')) {
                                                    const parts = trimmedLine.split(':');
                                                    if (parts[0].trim() === 'Agent' || parts[0].trim() === 'Customer') {
                                                        content = parts.slice(1).join(':').trim();
                                                    }
                                                }

                                                if (!content) return null;

                                                return (
                                                    <div key={idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                                                        <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] ${isAgent ? 'items-start' : 'items-end'}`}>
                                                            <span className="text-[10px] sm:text-xs text-gray-400 mb-1 px-1">{isAgent ? 'Agent' : 'Customer'}</span>
                                                            <div className={`px-4 sm:px-5 py-3 sm:py-3.5 text-sm leading-relaxed shadow-sm ${isAgent
                                                                ? 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none'
                                                                : 'bg-indigo-600 text-white rounded-2xl rounded-tr-none'
                                                                }`}>
                                                                {content}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Sidebar - Metadata (Hidden on Mobile) */}
                    <div className="hidden lg:flex w-96 bg-white border-l border-gray-200 flex-col h-full overflow-y-auto shrink-0">
                        {/* Call Outcome Status */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Interest & Outcome</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Interest Status</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${call.interestClassification?.interest_status === 'INTERESTED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {displayStatus}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Interest Level</span>
                                    <span className="font-medium text-gray-800">{formatLabel(call.interestClassification?.interest_level)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">Final Decision</span>
                                    <span className="font-medium text-gray-800 text-right">{formatLabel(call.interestClassification?.final_decision)}</span>
                                </div>
                                {call.interestClassification?.reason_for_not_interested && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-xs text-gray-400 block mb-1">Reason for Rejection</span>
                                        <span className="text-sm text-gray-600 italic">"{call.interestClassification.reason_for_not_interested}"</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Items */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Next Steps</h3>
                            {(() => {
                                const actionRaw = call.callbackInfo?.recommended_follow_up_action;
                                const action = (actionRaw || '').toLowerCase();
                                const date = call.callbackInfo?.follow_back_date;
                                const time = call.callbackInfo?.follow_back_time;

                                const isInvalid = (val) => !val || ['not_applicable', 'n/a', 'unknown', 'none'].includes(val.toLowerCase());
                                const hasDate = !isInvalid(date);
                                const hasTime = !isInvalid(time);
                                const isFollowUpRequired = call.callbackInfo?.follow_up_required;

                                let Icon = MessageSquare;
                                let iconColorClass = isFollowUpRequired ? 'text-amber-600' : 'text-gray-400';

                                if (action.includes('call')) {
                                    Icon = Phone;
                                } else if (action.includes('whatsapp')) {
                                    Icon = WhatsAppIcon;
                                    iconColorClass = 'text-green-600';
                                } else if (action.includes('text') || action.includes('sms')) {
                                    Icon = MessageSquareText;
                                }

                                return (
                                    <div className={`rounded-xl p-4 border ${isFollowUpRequired ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex gap-3">
                                            <Icon className={`w-5 h-5 ${iconColorClass}`} />
                                            <div>
                                                <p className={`text-sm font-medium ${isFollowUpRequired ? 'text-amber-900' : 'text-gray-700'}`}>
                                                    {formatLabel(actionRaw) || 'No specific action'}
                                                </p>
                                                {(hasDate || hasTime) && (
                                                    <div className="mt-2 space-y-1">
                                                        {hasDate && (
                                                            <p className="text-xs text-gray-500">Date: {date}</p>
                                                        )}
                                                        {hasTime && (
                                                            <p className="text-xs text-gray-500">Time: {time}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Technical Details */}
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Call Metadata</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <span className="block text-xs text-gray-400 mb-1">Status</span>
                                        <span className="text-sm font-medium text-gray-700">{formatLabel(call.status)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400 mb-1">Customer Attended</span>
                                        <span className={`text-sm font-medium ${call.customerAttended ? 'text-green-600' : 'text-red-500'}`}>
                                            {call.customerAttended ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400 mb-1">Voicemail</span>
                                        <span className="text-sm font-medium text-gray-700">{call.voicemailDetected ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-gray-400 mb-1">Duration</span>
                                        <span className="text-sm font-medium text-gray-700">
                                            {(() => {
                                                // Strip trailing text like "Seconds", "seconds", "sec", etc.
                                                const raw = String(call.callDuration || '0').trim().replace(/\s*(seconds?|secs?|s)\s*$/i, '').trim();
                                                let totalSeconds = 0;

                                                if (raw.includes(':')) {
                                                    // Handle H:MM:SS or M:SS format (e.g. "0:02:33", "0:00:20 Seconds")
                                                    const parts = raw.split(':').map(p => parseInt(p.trim(), 10));
                                                    if (parts.length === 3 && parts.every(n => !isNaN(n))) {
                                                        totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
                                                    } else if (parts.length === 2 && parts.every(n => !isNaN(n))) {
                                                        totalSeconds = (parts[0] * 60) + parts[1];
                                                    }
                                                } else {
                                                    // Handle plain number or "145 Seconds" format
                                                    totalSeconds = parseInt(raw, 10);
                                                }

                                                if (isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
                                                const hrs = Math.floor(totalSeconds / 3600);
                                                const mins = Math.floor((totalSeconds % 3600) / 60);
                                                const secs = totalSeconds % 60;
                                                if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
                                                return `${mins}m ${secs}s`;
                                            })()}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-gray-400 mb-1">Disconnected By</span>
                                            <span className="text-sm font-medium text-gray-700">{formatLabel(call.whoDisconnected)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-gray-400 mb-1">Outcome Tag</span>
                                            <span className="text-sm font-medium text-gray-700">{formatLabel(call.outcomeTag)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
