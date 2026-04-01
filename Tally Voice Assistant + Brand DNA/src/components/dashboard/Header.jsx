import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import MenuIcon from '../../assets/icons/menu.svg';
// import SearchIcon from '../../assets/icons/search.svg';
import TypingHeader from './TypingHeader';
import { Menu, Phone, FileSpreadsheet } from 'lucide-react';
import { ManualCallModal } from '../tally/ManualCallModal';


const Header = ({ onMenuClick, searchQuery, setSearchQuery }) => {
    const [isFocused, setIsFocused] = useState(false);
    const location = useLocation();
    const currentPath = location.pathname;

    // Tally Specific Constants & State
    const TALLY_TITLES = [
        "Pucho Upscalling Agent Dashboard",
        "પૂછો ટેલી અપસ્કેલિંગ એનાલિસિસ",
        "पूछो टैली अपस्केलिंग एनालिसिस",
        "पूछो टॅली अपस्केलिंग विश्लेषण"
    ];
    const [tallyDisplayText, setTallyDisplayText] = useState("");
    const [tallyTitleIndex, setTallyTitleIndex] = useState(0);
    const [isTallyDeleting, setIsTallyDeleting] = useState(false);
    const [isManualCallModalOpen, setIsManualCallModalOpen] = useState(false);

    // Tally Typewriter Effect
    useEffect(() => {
        if (currentPath !== '/tally-agent') return;

        const currentTitle = TALLY_TITLES[tallyTitleIndex];
        const typeSpeed = isTallyDeleting ? 50 : 100;

        const timer = setTimeout(() => {
            if (!isTallyDeleting && tallyDisplayText === currentTitle) {
                setTimeout(() => setIsTallyDeleting(true), 2000);
            } else if (isTallyDeleting && tallyDisplayText === "") {
                setIsTallyDeleting(false);
                setTallyTitleIndex((prev) => (prev + 1) % TALLY_TITLES.length);
            } else {
                const nextText = isTallyDeleting
                    ? currentTitle.substring(0, tallyDisplayText.length - 1)
                    : currentTitle.substring(0, tallyDisplayText.length + 1);
                setTallyDisplayText(nextText);
            }
        }, typeSpeed);

        return () => clearTimeout(timer);
    }, [tallyDisplayText, isTallyDeleting, tallyTitleIndex, currentPath]);


    // Page Metadata for Standard Header
    // Page Metadata for Standard Header
    const pageMetadata = {
        '/generate-dna': { title: 'New Brand DNA', description: 'Create and manage your brand identities' },
        '/campaign-ideas': { title: 'Select a Brand', description: 'Choose a brand to generate campaign ideas for.' },
        '/generate-creatives': { title: 'Generate Creatives', description: 'Design and generate visual assets' },
        '/my-dnas': { title: 'My DNAs', description: 'View and manage your saved brand identities' },
        '/history': { title: 'Activity Logs', description: 'Recent platform activity' },
        '/mcp': { title: 'MCP Controls', description: 'Manage MCP integrations' },
        '/knowledge': { title: 'Knowledge Base', description: 'Manage brand documents and data' },
        '/tools': { title: 'System Tools', description: 'Advanced platform tools' },
        '/marketplace': { title: 'Marketplace', description: 'Third-party integrations' },
        '/market-intelligence': { title: 'Market Intelligence', description: 'Strategic insights & comprehensive brief generation' },
        '/market-intelligence-reports': { title: 'Market Intelligence Reports', description: 'View and manage generated strategy reports' },
        '/competitor-analysis': { title: 'Competitor Analysis', description: 'Track and analyze your market competition' },
        '/audio-transcription': { title: 'Audio Transcription Summary', description: 'Transcribe and summarize audio files' },
        '/instagram-dna': { title: 'Instagram DNA', description: 'Deep dive into Instagram analytics and audience insights' },
    };

    let { title, description } = pageMetadata[currentPath] || { title: 'Dashboard', description: 'Welcome to Pucho Dashboard' };

    if (currentPath.startsWith('/dna/')) {
        title = 'Brand DNA Details';
        description = 'Comprehensive identity and strategy matrix';
    }

    // --- RENDER CONDITIONS ---

    // 1. Tally Agent Header
    if (currentPath === '/tally-agent') {
        return (
            <>
                <header className="h-16 md:h-20 px-4 md:px-8 border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={onMenuClick}
                            className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>



                        {/* Typing Title */}
                        <h1 className="text-sm md:text-xl font-bold tracking-tight flex items-center whitespace-nowrap overflow-hidden text-ellipsis text-pucho-dark">
                            <span>{tallyDisplayText.split(" ")[0]}</span>
                            &nbsp;
                            <span className="text-pucho-purple">{tallyDisplayText.split(" ").slice(1).join(" ")}</span>
                            <span className="animate-pulse ml-0.5 text-pucho-purple">|</span>
                        </h1>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <a
                            href="https://docs.google.com/spreadsheets/d/1s1bWdUikqWCFXte618VXaxr5NBnmZG_igd_YZXAfSUY/edit?gid=1698019161#gid=1698019161"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all border border-gray-100 hover:border-green-200 shadow-sm"
                            title="Open Google Sheet"
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                        </a>

                        <button
                            onClick={() => setIsManualCallModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-pucho-purple text-white rounded-xl font-medium text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                        >
                            <Phone className="w-4 h-4" />
                            <span className="hidden sm:inline">Manual Call</span>
                        </button>
                    </div>
                </header>

                <ManualCallModal
                    isOpen={isManualCallModalOpen}
                    onClose={() => setIsManualCallModalOpen(false)}
                />
            </>
        );
    }

    // 2. Standard Header for other pages
    return (
        <header className="sticky top-0 z-20 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between pl-5 py-4 pr-8">
            {/* Left Side: Menu Toggle + Dynamic Title */}
            <div className="flex items-center gap-4 h-[44px]">
                {/* Mobile Menu Toggle */}
                <button onClick={onMenuClick} className="lg:hidden p-1 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors">
                    <img src={MenuIcon} alt="Menu" className="w-6 h-6 opacity-60" />
                </button>

                {/* Dynamic Title & Description */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-xl font-bold text-[#111935] leading-none mb-1">{title}</h1>
                    <p className="text-sm text-gray-500 font-medium leading-none">{description}</p>
                </div>
            </div>

            {/* Actions (Right) */}

        </header>
    );
};

export default Header;
