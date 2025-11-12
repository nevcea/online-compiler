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
            <div className="flex items-center gap-4 p-4 bg-bg-secondary border border-border-color rounded-md relative z-[1] transition-all duration-200 shadow-sm hover:border-accent-primary hover:shadow-md hover:-translate-y-px md:flex-col md:items-stretch md:gap-3 md:p-4">
                <label className="font-medium text-text-primary whitespace-nowrap text-[0.9375rem] select-none">{t('programming-language')}</label>
                <div className="relative flex-1 max-w-[300px] z-[10001] md:max-w-full">
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
                        <div ref={dropdownRef} className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[rgba(26,26,26,0.98)] backdrop-blur-2xl border border-border-color rounded-md shadow-lg z-[10001] max-h-[300px] overflow-y-auto block mt-1">
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

