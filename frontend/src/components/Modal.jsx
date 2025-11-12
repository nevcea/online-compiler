import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const Modal = ({ title, message, onConfirm, onCancel }) => {
    const { t } = useApp();

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onCancel]);

    return (
        <div className="fixed z-[2000] left-0 top-0 w-full h-full bg-[rgba(0,0,0,0.75)] backdrop-blur-lg animate-[fadeIn_0.2s_ease] flex items-center justify-center">
            <div className="bg-bg-secondary border border-border-color rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-[500px] w-[90%] max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)] flex flex-col md:w-[95%] md:m-4">
                <div className="p-6 border-b border-border-color bg-bg-tertiary md:p-4">
                    <h3 className="m-0 text-text-primary text-xl font-semibold">{title}</h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto md:p-4">
                    <p className="m-0 mb-3 text-text-primary leading-relaxed">{message}</p>
                    <p className="m-0 text-text-muted">{t('continue-question')}</p>
                </div>
                <div className="p-4 px-6 border-t border-border-color bg-bg-tertiary flex gap-3 justify-end md:p-4 md:flex-col">
                    <button 
                        className="bg-bg-tertiary text-text-primary border border-border-color px-6 py-2.5 rounded-sm text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm min-w-[80px] m-0 hover:bg-bg-secondary hover:border-border-hover focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full" 
                        onClick={onCancel}
                    >
                        {t('cancel')}
                    </button>
                    <button 
                        className="bg-accent-primary text-white border-none px-6 py-2.5 rounded-sm text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm min-w-[80px] m-0 hover:bg-accent-hover hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.98] active:shadow-sm focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full" 
                        onClick={onConfirm}
                    >
                        {t('confirm')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

