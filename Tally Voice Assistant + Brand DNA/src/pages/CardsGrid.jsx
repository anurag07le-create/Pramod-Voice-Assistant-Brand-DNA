import React, { useState, useEffect } from 'react';
import Card from '../components/dashboard/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import FlowIcon from '../assets/icons/card_flow.png';
import { LayoutGrid, List, Plus, Globe, Send, CheckCircle2, AlertCircle, Dna, FileText, Upload, X } from 'lucide-react';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { useBrands } from '../context/BrandContext';
import { useAuth } from '../context/AuthContext';
import { logAction } from '../lib/supabase';
import { WEBHOOKS } from '../config';

const extractionSteps = [
    "Initiating brand analysis...",
    "Crawling website architecture...",
    "Extracting primary & secondary colors...",
    "Identifying typography & font families...",
    "Analyzing brand voice & personality...",
    "Compiling visual repository & assets...",
    "Syncing your Brand DNA..."
];

const CardsGrid = () => {
    const navigate = useNavigate();
    const { brands, loading, refreshBrands } = useBrands();
    const { user } = useAuth(); // Get user config
    const [brandUrl, setBrandUrl] = useState('');

    // New state for upload mode
    const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'pdf'
    const [selectedFile, setSelectedFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    // Filter cards based on search query
    const { searchQuery } = useOutletContext() || { searchQuery: '' };
    const cards = brands.map(brand => ({
        title: brand.name,
        description: brand.shortDescription,
        logo: brand.logo,
        slug: brand.slug,
        url: brand.url
    }));

    const filteredCards = cards.filter(card =>
        card.title.toLowerCase().includes((searchQuery || '').toLowerCase())
    );

    const [viewMode, setViewMode] = useState('grid');
    const location = useLocation();
    const isMainAdmin = location.pathname === '/generate-dna';

    // Normalize URL for matching
    const normalizeUrl = (u) => {
        if (!u) return '';
        return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    };

    // Polling effect
    useEffect(() => {
        let pollInterval;
        let stepInterval;

        if (isSubmitting) {
            // Only simulate visual steps if we are NOT in PDF upload mode (which has its own progress)
            // OR if PDF upload is complete (100%) and we are "processing"
            const isPdfUpload = uploadMode === 'pdf';

            if (!isPdfUpload) {
                // Visual step progress for URL mode
                stepInterval = setInterval(() => {
                    setCurrentStep(prev => {
                        const next = prev + 1;
                        if (next >= extractionSteps.length) return prev;
                        return next;
                    });
                    setProgress(prev => Math.min(prev + 12, 95)); // Go up to 95%
                }, 3000);
            }

            // Sheet polling - Only poll if we are in URL mode or if we have a way to check PDF status
            // For PDF mode, we might need a different check, but for now we'll simulate success for the UI demo
            if (uploadMode === 'url') {
                pollInterval = setInterval(async () => {
                    const updatedBrands = await refreshBrands();
                    const matchedBrand = updatedBrands.find(b =>
                        normalizeUrl(b.url) === normalizeUrl(brandUrl)
                    );

                    if (matchedBrand) {
                        setProgress(100);
                        setCurrentStep(extractionSteps.length - 1);
                        setStatus({ type: 'success', message: 'Brand DNA Captured!' });

                        setTimeout(() => {
                            setIsSubmitting(false);
                            navigate(`/dna/${matchedBrand.slug}`);
                        }, 1500);
                    }
                }, 6000);
            } else {
                // Simulation for PDF upload success for now
                if (progress > 90) {
                    // In a real app, we'd poll for the processed PDF result here
                }
            }
        } else {
            setCurrentStep(0);
            setProgress(0);
        }

        return () => {
            clearInterval(pollInterval);
            clearInterval(stepInterval);
        };
    }, [isSubmitting, brandUrl, refreshBrands, navigate, uploadMode, progress]);

    const handleCardClick = (card) => {
        navigate(`/dna/${card.slug}`);
    };

    // File Handling
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        if (file.type !== 'application/pdf') {
            setStatus({ type: 'error', message: 'Please upload a PDF file only.' });
            return;
        }
        setSelectedFile(file);
        setStatus({ type: null, message: '' });
    };

    const removeFile = () => {
        setSelectedFile(null);
        // Reset file input value
        const fileInput = document.getElementById('pdf-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (uploadMode === 'url') {
            handleUrlSubmit();
        } else {
            handlePdfSubmit();
        }
    };

    const handlePdfSubmit = async () => {
        if (!selectedFile || isSubmitting) return;

        setIsSubmitting(true);
        setStatus({ type: null, message: '' });
        setCurrentStep(0);
        // Start progress at 0 for real upload tracking
        setProgress(0);

        console.log("🚀 Initiating Brand DNA Analysis from PDF:", selectedFile.name);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('filename', selectedFile.name);
        formData.append('timestamp', new Date().toISOString());
        formData.append('request_type', 'pdf_upload');

        if (user?.email) formData.append('user_email', user.email);
        if (user?.username) formData.append('username', user.username);

        // Pass User's Spreadsheet Configuration
        const spreadsheetConfig = {
            spreadsheet_id: user?.spreadsheet_id || "",
            input_url_worksheet_id: user?.input_url_worksheet_id || "",
            campaign_ideas_id: user?.campaign_ideas_id || "",
            creatives_id: user?.creatives_id || "",
            animated_creatives_id: user?.animated_creatives_id || "",
            custom_creatives_id: user?.custom_creatives_id || "",
            social_media_worksheet_id: user?.social_media_id || "",
            instagram_sheet_id: user?.instagram_sheet_id || ""
        };
        formData.append('spreadsheet_config', JSON.stringify(spreadsheetConfig));

        // Direct absolute URL as requested
        const webhookUrl = WEBHOOKS.GENERATE_DNA_PDF;

        console.log("🚀 Submitting PDF to:", webhookUrl);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                // Map upload progress to 0-95% range visually or just show raw upload info
                // If we want to show "Uploading..." distinct from "Analyzing..."
                setProgress(percentComplete);
                setStatus({ type: null, message: `Uploading: ${percentComplete}%` });
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                console.log("📡 PDF Webhook Response Status:", xhr.status);
                logAction('GENERATE_DNA_PDF', `Uploaded Brand DNA PDF: ${selectedFile.name}`, user?.username || 'system');

                setStatus({ type: 'success', message: 'PDF uploaded successfully! Processing...' });
                setProgress(100);

                // Simulation for "Processing" after upload
                // Since this is a demo/simulation of analysis after upload
                // We keep the isSubmitting true for a moment to show "100%"
                setTimeout(() => {
                    // Reset after success
                    setIsSubmitting(false);
                    setSelectedFile(null);
                    setStatus({ type: null, message: '' });
                }, 2000);

            } else {
                console.error("❌ PDF Submission Error Status:", xhr.status);
                setStatus({ type: 'error', message: `Server responded with ${xhr.status}` });
                setIsSubmitting(false);
            }
        };

        xhr.onerror = () => {
            console.error("❌ PDF Submission Network Error");
            setStatus({ type: 'error', message: 'Failed to upload PDF. Network Error.' });
            setIsSubmitting(false);
        };

        xhr.open('POST', webhookUrl);
        // Do not set Content-Type header for FormData, browser does it automatically with boundary
        xhr.send(formData);
    };

    const handleUrlSubmit = async () => {
        const rawUrl = brandUrl.trim().toLowerCase();
        if (!rawUrl || isSubmitting) return;

        // URL Validation Regex (Strict: must include http:// or https://)
        const urlPattern = /^https?:\/\/([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
        if (!urlPattern.test(rawUrl)) {
            setStatus({ type: 'error', message: 'Please enter a valid URL starting with http:// or https:// (e.g., https://example.com)' });
            return;
        }

        // Parse the URL to get the origin (https://example.com) and stripped domain
        const urlObj = new URL(rawUrl);
        const cleanUrl = urlObj.origin; // https://www.epicgames.com
        const domain = urlObj.hostname.replace(/^www\./, ''); // epicgames.com

        setIsSubmitting(true);
        setStatus({ type: null, message: '' });
        setCurrentStep(0);
        setProgress(10);

        console.log("🚀 Initiating Brand DNA Request for:", cleanUrl);

        try {
            const timestamp = new Date().getTime();
            // Send cleaned URL in both Query Params AND JSON Body
            const webhookUrl = `${WEBHOOKS.GENERATE_DNA_URL}?url=${encodeURIComponent(cleanUrl)}&domain=${encodeURIComponent(domain)}&t=${timestamp}`;

            console.log("🚀 Multi-format Submission to:", webhookUrl);

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: cleanUrl,
                    domain: domain,
                    timestamp: new Date().toISOString(),
                    request_type: "sync_build",
                    // Pass User's Spreadsheet Configuration
                    spreadsheet_config: {
                        spreadsheet_id: user?.spreadsheet_id || "",
                        input_url_worksheet_id: user?.input_url_worksheet_id || "",
                        campaign_ideas_id: user?.campaign_ideas_id || "",
                        creatives_id: user?.creatives_id || "",
                        animated_creatives_id: user?.animated_creatives_id || "",
                        custom_creatives_id: user?.custom_creatives_id || "",
                        social_media_worksheet_id: user?.social_media_id || "",
                        instagram_sheet_id: user?.instagram_sheet_id || ""
                    }
                }),
            });

            console.log("📡 Webhook Response Status:", response.status);

            // Log Action
            logAction('GENERATE_DNA', `Started Brand DNA analysis for ${domain}`, user?.username || 'system');

            if (response.status === 408) {
                console.warn("⏳ Sync request timed out (expected for long analyses). Polling is active.");
            }

        } catch (error) {
            console.error("❌ Submission Error:", error);
            setStatus({ type: 'error', message: 'Failed to initiate brand analysis. Please try again.' });
            setIsSubmitting(false);
        }
    };

    if (loading && !isSubmitting) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pucho-purple"></div>
            </div>
        );
    }

    return (
        <div className="">
            {/* View Toggle - Only show on My DNAs page/flow, hide on Generate DNA page */}
            {!isMainAdmin && (
                <div className="flex justify-end mb-6">
                    <div className="flex items-center gap-[6px]">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center justify-center w-[44px] h-[36px] rounded-full transition-all duration-200 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}`}
                        >
                            <LayoutGrid size={20} className={`transition-all ${viewMode === 'grid' ? 'stroke-white' : 'stroke-current opacity-60'}`} strokeWidth={viewMode === 'grid' ? 2 : 1.5} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center justify-center w-[44px] h-[36px] rounded-full transition-all duration-200 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-transparent text-gray-400 hover:text-black'}`}
                        >
                            <List size={24} className={`transition-all ${viewMode === 'list' ? 'stroke-white' : 'stroke-current opacity-60'}`} strokeWidth={viewMode === 'list' ? 2 : 1.5} />
                        </button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                {isMainAdmin ? (
                    <div className={`${viewMode === 'list' ? 'w-full' : 'w-full lg:col-span-3'}`}>
                        {isSubmitting ? (
                            <div className="flex flex-col items-center justify-center py-20 max-w-4xl mx-auto text-center bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(139,92,246,0.15)] h-[calc(100vh-140px)] border border-white/50 relative px-12 md:px-20 overflow-hidden">

                                {/* Subtle glowing background effects */}
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-50/80 via-white to-white pointer-events-none"></div>
                                <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[80px] pointer-events-none"></div>
                                <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[80px] pointer-events-none"></div>

                                {/* Centered Loading Content */}
                                <div className="relative z-10 flex flex-col items-center justify-center flex-1">
                                    <div className="relative w-24 h-24 mb-8">
                                        {/* Outer Ring */}
                                        <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                        {/* Spinning Gradient Ring */}
                                        <div
                                            className="absolute inset-0 rounded-full border-4 border-t-transparent border-l-transparent border-r-[#8b5cf6] border-b-[#3b82f6] animate-spin"
                                            style={{ animationDuration: '1.5s' }}
                                        ></div>
                                        {/* Inner Pulsing Icon */}
                                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                                            <Dna size={32} className="text-[#8b5cf6]" strokeWidth={1.5} />
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Capturing Brand DNA</h3>
                                </div>

                                {/* Bottom Progress Bar Section */}
                                <div className="relative z-10 w-full mt-auto mb-6">
                                    {/* Status Text Moved Here */}
                                    <p className="text-slate-500 text-lg font-medium animate-pulse mb-[30px]">{extractionSteps[currentStep]}</p>

                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-4 shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between w-full text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
                                        <span>Analysis in progress</span>
                                        <span>{Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-[calc(100vh-140px)] flex items-center justify-center">
                                {/* Main Card Container */}
                                <div className="relative w-full max-w-4xl bg-white/80 backdrop-blur-xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(139,92,246,0.15)] p-12 md:p-20 flex flex-col items-center text-center overflow-hidden border border-white/50">

                                    {/* Subtle glowing backdrop effects */}
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-50/80 via-white to-white pointer-events-none"></div>
                                    <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-purple-200/30 rounded-full blur-[80px] pointer-events-none"></div>
                                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[80px] pointer-events-none"></div>


                                    {/* Typography */}
                                    <div className="relative z-10 space-y-6 mb-12 max-w-2xl">
                                        <h2 className="text-6xl font-bold text-slate-900 tracking-tight leading-tight">
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7c3aed] via-[#8b5cf6] to-[#3b82f6] animate-gradient-x">Brand DNA</span>
                                        </h2>
                                        <p className="text-slate-500 text-xl leading-relaxed font-medium max-w-xl mx-auto">
                                            Instantly decode any brand's visual identity. Enter a URL to Fetch the brand's visual identity.
                                        </p>
                                    </div>

                                    {/* Input & Action Area */}
                                    <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-2xl">
                                        <div className="relative group transition-all duration-300 transform hover:-translate-y-1">
                                            <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                                                <Globe className="w-6 h-6 text-gray-400 group-focus-within:text-[#8b5cf6] transition-colors" />
                                            </div>

                                            <input
                                                type="text"
                                                placeholder="https://example.com or http://example.com"
                                                className="w-full h-[88px] pl-16 pr-44 bg-white border-2 border-slate-100 rounded-full focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-[#8b5cf6] transition-all font-medium text-slate-700 placeholder:text-gray-300 text-lg shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:border-slate-200"
                                                value={brandUrl}
                                                onChange={(e) => {
                                                    setBrandUrl(e.target.value);
                                                    if (status.type === 'error') setStatus({ type: null, message: '' });
                                                }}
                                            />

                                            <button
                                                type="submit"
                                                disabled={!brandUrl}
                                                className="
                                                    absolute right-3 top-3 bottom-3 px-10 rounded-full font-bold text-white
                                                    bg-gradient-to-r from-[#7c3aed] to-[#3b82f6]
                                                    shadow-[0_8px_20px_rgba(124,58,237,0.25)]
                                                    hover:shadow-[0_12px_25px_rgba(124,58,237,0.35)]
                                                    hover:scale-[1.02] active:scale-[0.98]
                                                    transition-all duration-200
                                                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
                                                    flex items-center gap-2.5 text-[16px] tracking-wide
                                                "
                                            >
                                                <span>Generate</span>
                                                <Send size={18} className="rotate-45 mb-0.5" strokeWidth={2.5} />
                                            </button>
                                        </div>

                                        {/* Status Feedback */}
                                        <div className={`
                                            absolute left-0 right-0 -bottom-14 flex justify-center
                                            transition-all duration-500 transform
                                            ${status.message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
                                        `}>
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-sm border ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                                {status.message}
                                            </div>
                                        </div>
                                    </form>

                                    {/* Footer */}
                                    <div className="absolute bottom-6 md:bottom-8 left-0 w-full text-center">
                                        <p className="text-[11px] font-bold tracking-[0.2em] text-slate-300 uppercase">
                                            Powered by Pucho AI Engine
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    filteredCards.map((card, index) => (
                        <Card
                            key={index}
                            title={card.title}
                            description={card.description}
                            logo={card.logo}
                            onClick={() => handleCardClick(card)}
                            listView={viewMode === 'list'}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default CardsGrid;
