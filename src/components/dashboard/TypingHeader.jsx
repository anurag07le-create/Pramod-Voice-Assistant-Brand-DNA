import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const languages = [
    "Tally Upscaling Agent Dashboard", // English
    "टैली अपस्केलिंग एजेंट डैशबोर्ड", // Hindi
    "ટેલી અપસ્કેલિંગ એજન્ટ ડેશબોર્ડ",  // Gujarati
    "टॅली अपस्केलिंग एजंट डॅशबोर्ड"   // Marathi
];

const TypingHeader = () => {
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleTyping = () => {
            const i = loopNum % languages.length;
            const fullText = languages[i];

            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 30 : 150);

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 1000); // Pause at end
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed]);

    return (
        <h1 className="text-xl font-bold text-[#111935] leading-none mb-1 h-[24px] flex items-center">
            {text}
            <span className="w-0.5 h-5 ml-1 bg-[#111935] animate-blink" style={{ animation: 'blink 1s step-end infinite' }}></span>
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>
        </h1>
    );
};

export default TypingHeader;
