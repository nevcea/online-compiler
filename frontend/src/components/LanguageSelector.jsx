import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_CONFIG } from '../config/constants';
import Modal from './Modal';

const LanguageSelector = ({ onLanguageChange, pendingChange, onConfirmChange, onCancelChange }) => {
    const { currentLanguage, t } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const languages = Object.keys(LANGUAGE_CONFIG.names);

    return (
        <>
            <div className="flex items-center gap-4 p-5 bg-bg-secondary/80 backdrop-blur-sm border border-border-color rounded-xl relative z-[1] transition-all duration-300 shadow-md hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/20 hover:-translate-y-1 hover:bg-bg-secondary md:flex-col md:items-stretch md:gap-3 md:p-4 group/selector">
                <div className="absolute inset-0 rounded-xl bg-accent-gradient opacity-0 group-hover/selector:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                <label className="font-medium text-text-primary whitespace-nowrap text-[0.9375rem] select-none relative z-10 flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {t('programming-language')}
                </label>
                <div className="relative flex-1 max-w-[300px] z-[10001] md:max-w-full relative z-10">
                    <button
                        ref={buttonRef}
                        type="button"
                        className={`w-full flex items-center gap-3 bg-transparent text-text-primary border-none px-3.5 py-2.5 rounded-sm text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 text-left hover:bg-bg-tertiary focus:outline-none focus:bg-bg-tertiary focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 ${isOpen ? 'bg-bg-tertiary text-accent-primary' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <span className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                            <img
                                src={LANGUAGE_CONFIG.icons[currentLanguage]}
                                alt=""
                                className="w-6 h-6 object-contain block"
                            />
                        </span>
                        <span className="flex-1">{LANGUAGE_CONFIG.names[currentLanguage]}</span>
                        <span className={`text-xs transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </button>
                    {isOpen && (
                        <div ref={dropdownRef} className="absolute top-[calc(100%+12px)] left-0 right-0 bg-bg-secondary/95 backdrop-blur-2xl border border-border-color rounded-xl shadow-xl z-[10001] max-h-[300px] overflow-y-auto block mt-2 animate-[slideUp_0.2s_ease-out]">
                            {languages.map((lang) => (
                                <div
                                    key={lang}
                                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150 text-text-primary bg-transparent relative select-none hover:bg-bg-tertiary hover:pl-6 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-[-2px] focus-visible:bg-bg-tertiary ${
                                        lang === currentLanguage ? 'bg-bg-tertiary text-accent-primary font-semibold pl-6' : ''
                                    }`}
                                    onClick={() => {
                                        onLanguageChange(lang);
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent-primary transition-transform duration-150 rounded-r-sm" style={{ transform: lang === currentLanguage ? 'scaleY(1)' : 'scaleY(0)' }}></span>
                                    <span className="flex items-center justify-center w-6 h-6 flex-shrink-0">
                                        <img
                                            src={LANGUAGE_CONFIG.icons[lang]}
                                            alt=""
                                            className="w-6 h-6 object-contain block"
                                        />
                                    </span>
                                    <span>{LANGUAGE_CONFIG.names[lang]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {pendingChange && (
                <Modal
                    title={t('language-change-title')}
                    message={t('language-change-message')}
                    onConfirm={onConfirmChange}
                    onCancel={onCancelChange}
                />
            )}
        </>
    );
};

export default LanguageSelector;

