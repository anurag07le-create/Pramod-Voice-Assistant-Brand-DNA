import React, { useState } from 'react';
import { X, Phone, CheckCircle, Loader2, User } from 'lucide-react';

export function ManualCallModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        fullName: '',
        mobileNumber: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');

        try {
            const response = await fetch('https://studio.pucho.ai/api/v1/webhooks/z665A2sUY2PfBJMzt7UHC', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "Full Name": formData.fullName,
                    "Mobile No": formData.mobileNumber
                }),
            });

            if (response.ok) {
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error initiating call:', error);
            setStatus('error');
        }
    };

    const handleClose = () => {
        if (status === 'success') {
            setStatus('idle');
            setFormData({ fullName: '', mobileNumber: '' });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-pucho-purple" />
                        Manual Call Initiation
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {status === 'success' ? (
                        <div className="flex flex-col items-center text-center py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Request Submitted!</h3>
                            <p className="text-slate-600 mb-6 max-w-xs mx-auto">
                                The call will be initiated shortly. The analysis will be visible on the dashboard once the call is completed.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                        placeholder="Enter customer name"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 focus:border-pucho-purple transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                    Mobile Number
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="tel"
                                        required
                                        value={formData.mobileNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                                        placeholder="e.g. 9876543210"
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pucho-purple/20 focus:border-pucho-purple transition-all"
                                    />
                                </div>
                            </div>


                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                                    Failed to submit request. Please try again.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'submitting'}
                                className="w-full mt-2 bg-pucho-purple text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {status === 'submitting' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Initiating Call...
                                    </>
                                ) : (
                                    <>
                                        Is everything correct? Call Now
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
