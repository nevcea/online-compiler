import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LANGUAGE_CONFIG } from '../config/constants';
import Modal from './Modal';
import './LanguageSelector.css';

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
            <div className="language-selector">
                <label>{t('programming-language')}</label>
                <div className="custom-select-wrapper">
                    <button
                        ref={buttonRef}
                        type="button"
                        className={`custom-select-button ${isOpen ? 'active' : ''}`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="language-icon">
                            <img
                                src={LANGUAGE_CONFIG.icons[currentLanguage]}
                                alt=""
                                className="language-icon-img"
                            />
                        </div>
                        <span className="language-name">{LANGUAGE_CONFIG.names[currentLanguage]}</span>
                        <svg className="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div ref={dropdownRef} className={`custom-select-dropdown ${isOpen ? 'show' : ''}`}>
                        {languages.map((lang) => (
                            <div
                                key={lang}
                                className={`select-option ${lang === currentLanguage ? 'selected' : ''}`}
                                onClick={() => {
                                    onLanguageChange(lang);
                                    setIsOpen(false);
                                }}
                            >
                                <div className="language-icon">
                                    <img
                                        src={LANGUAGE_CONFIG.icons[lang]}
                                        alt=""
                                        className="language-icon-img"
                                    />
                                </div>
                                <span className="language-name">{LANGUAGE_CONFIG.names[lang]}</span>
                            </div>
                        ))}
                    </div>
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

