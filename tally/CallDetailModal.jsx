import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Brain, MessageSquare, Clock, FileText, User, Building, AlertCircle } from 'lucide-react';

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
        if (!summary) return "No detailed summary available.";

        // Split by known keywords
        const keywords = ["Opening:", "Problem Discussion:", "Solution:", "Pricing:", "Closing:"];
        // Create a regex pattern: /(Opening:|Problem Discussion:|...)/g
        const pattern = new RegExp(`(${keywords.map(k => k.replace(':', '') + ':').join('|')})`, 'g');

        const parts = summary.split(pattern).filter(part => part.trim());

        if (parts.length <= 1) return summary; // Return as is if no keywords found

        const elements = [];
        let currentHeader = null;

        parts.forEach((part, index) => {
            if (keywords.includes(part.trim())) {
                currentHeader = part.trim();
            } else if (currentHeader) {
                elements.push(
                    <div key={index} className="mb-3 last:mb-0">
                        <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wider mb-1">{currentHeader.replace(':', '')}</span>
                        <p className="text-slate-600 text-sm leading-relaxed">{part.trim()}</p>
                    </div>
                );
                currentHeader = null;
            } else {
                // Text before any header
                elements.push(<p key={index} className="text-slate-600 text-sm leading-relaxed mb-3">{part.trim()}</p>);
            }
        });

        return <div className="space-y-1">{elements}</div>;
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" role="dialog">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            {/* Modal Content */}
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] md:h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-white shrink-0 z-20">
                    <div className="min-w-0 flex-1 mr-4">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{call.customerName}</h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none"><Building className="w-3 h-3 shrink-0" /> {call.organization}</span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 shrink-0"><Phone className="w-3 h-3 shrink-0" /> {call.mobile}</span>
                            <span className="text-slate-300 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 shrink-0"><Clock className="w-3 h-3 shrink-0" /> {new Date(call.dateTime).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
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
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6">
                            <button
                                onClick={() => setActiveTab('insights')}
                                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'insights'
                                    ? 'border-pucho-purple text-pucho-purple'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <Brain className="w-4 h-4" />
                                <span className="hidden sm:inline">AI Insights & Summary</span>
                                <span className="sm:hidden">Insights</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('transcript')}
                                className={`px-4 sm:px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'transcript'
                                    ? 'border-pucho-purple text-pucho-purple'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
                                        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
                                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                                Short Summary
                                            </h3>
                                            <p className="text-slate-600 leading-relaxed text-sm">
                                                {call.shortSummary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Detailed Summary */}
                                    <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-semibold text-slate-800 mb-4 text-base sm:text-lg">Detailed Summary</h3>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
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
                                <div className="space-y-6 max-w-3xl mx-auto relative px-0 sm:px-0"> {/* Removed explicit padding for mobile full width */}

                                    {/* Language Toggle */}
                                    <div className={`flex justify-center mb-6 sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-2 transition-transform duration-300 ${showNavigator ? 'translate-y-0' : '-translate-y-[150%]'}`}>
                                        <div className="bg-slate-100 p-1 rounded-lg flex shadow-sm border border-slate-200">
                                            <button
                                                onClick={() => setTranscriptMode('original')}
                                                className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${transcriptMode === 'original'
                                                    ? 'bg-white text-slate-800 shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                Original (Hindi)
                                            </button>
                                            <button
                                                onClick={() => setTranscriptMode('english')}
                                                className={`px-3 sm:px-4 py-1.5 text-xs font-medium rounded-md transition-all ${transcriptMode === 'english'
                                                    ? 'bg-white text-pucho-purple shadow-sm'
                                                    : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                English (Translated)
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pb-20">
                                        {(transcriptMode === 'english' && !call.englishTranscription
                                            ? []
                                            : (transcriptMode === 'english' ? (call.englishTranscription || '') : (call.transcription || '')).split('\n')
                                        ).map((line, idx) => {
                                            const trimmedLine = line.trim();
                                            if (!trimmedLine) return null;
                                            const isAgent = trimmedLine.startsWith('Agent:');
                                            let content = trimmedLine;
                                            if (trimmedLine.includes(': ')) content = trimmedLine.split(': ').slice(1).join(': ');
                                            if (!content.trim()) content = trimmedLine;
                                            if (!content) return null;

                                            return (
                                                <div key={idx} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`flex flex-col max-w-[90%] sm:max-w-[85%] ${isAgent ? 'items-start' : 'items-end'}`}>
                                                        <span className="text-[10px] sm:text-xs text-slate-400 mb-1 px-1">{isAgent ? 'Agent' : 'Customer'}</span>
                                                        <div className={`px-4 sm:px-5 py-3 sm:py-3.5 text-sm leading-relaxed shadow-sm ${isAgent
                                                            ? 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-none'
                                                            : 'bg-pucho-purple text-white rounded-2xl rounded-tr-none'
                                                            }`}>
                                                            {content}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Right Sidebar - Metadata (Hidden on Mobile, or move to bottom? Keep hidden for now as per design patterns for complex modals on mobile, but maybe user wants it accessible. For now, following logic to hide on mobile to save space, but added specific classes) */}
                    <div className="hidden lg:flex w-96 bg-white border-l border-slate-200 flex-col h-full overflow-y-auto shrink-0">
                        {/* ... Existing Sidebar Content ... */}
                        {/* Call Outcome Status */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Interest & Outcome</h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Interest Status</span>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${call.interestClassification?.interest_status === 'INTERESTED'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {displayStatus}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Interest Level</span>
                                    <span className="font-medium text-slate-800">{formatLabel(call.interestClassification?.interest_level)}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Final Decision</span>
                                    <span className="font-medium text-slate-800 text-right">{formatLabel(call.interestClassification?.final_decision)}</span>
                                </div>
                                {call.interestClassification?.reason_for_not_interested && (
                                    <div className="pt-2 border-t border-slate-100">
                                        <span className="text-xs text-slate-400 block mb-1">Reason for Rejection</span>
                                        <span className="text-sm text-slate-600 italic">"{call.interestClassification.reason_for_not_interested}"</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Items */}
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Next Steps</h3>
                            <div className={`rounded-xl p-4 border ${call.callbackInfo?.follow_up_required ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'
                                }`}>
                                <div className="flex gap-3">
                                    <MessageSquare className={`w-5 h-5 ${call.callbackInfo?.follow_up_required ? 'text-amber-600' : 'text-slate-400'}`} />
                                    <div>
                                        <p className={`text-sm font-medium ${call.callbackInfo?.follow_up_required ? 'text-amber-900' : 'text-slate-700'}`}>
                                            {formatLabel(call.callbackInfo?.recommended_follow_up_action) || 'No specific action'}
                                        </p>
                                        <div className="mt-2 space-y-1">
                                            {call.callbackInfo?.follow_back_date !== 'NOT_APPLICABLE' && (
                                                <p className="text-xs text-slate-500">Date: {call.callbackInfo?.follow_back_date}</p>
                                            )}
                                            {call.callbackInfo?.follow_back_time !== 'NOT_APPLICABLE' && (
                                                <p className="text-xs text-slate-500">Time: {call.callbackInfo?.follow_back_time}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Technical Details */}
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Call Metadata</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">

                                    <div>
                                        <span className="block text-xs text-slate-400 mb-1">Status</span>
                                        <span className="text-sm font-medium text-slate-700">{formatLabel(call.status)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-400 mb-1">Customer Attended</span>
                                        <span className={`text-sm font-medium ${call.customerAttended ? 'text-green-600' : 'text-red-500'}`}>
                                            {call.customerAttended ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-xs text-slate-400 mb-1">Voicemail</span>
                                        <span className="text-sm font-medium text-slate-700">{call.voicemailDetected ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Disconnected By</span>
                                            <span className="text-sm font-medium text-slate-700">{formatLabel(call.whoDisconnected)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-slate-400 mb-1">Outcome Tag</span>
                                            <span className="text-sm font-medium text-slate-700">{formatLabel(call.outcomeTag)}</span>
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
