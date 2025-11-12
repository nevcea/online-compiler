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
        <div className="fixed z-[2000] left-0 top-0 w-full h-full bg-[rgba(0,0,0,0.85)] backdrop-blur-xl animate-[fadeIn_0.2s_ease] flex items-center justify-center p-4">
            <div className="bg-bg-secondary/95 backdrop-blur-2xl border border-border-color/50 rounded-2xl shadow-2xl shadow-black/50 max-w-[500px] w-full max-h-[90vh] overflow-hidden animate-[slideUp_0.3s_cubic-bezier(0.4,0,0.2,1)] flex flex-col md:w-full relative">
                <div className="absolute inset-0 rounded-2xl bg-accent-gradient opacity-5 pointer-events-none"></div>
                <div className="p-6 border-b border-border-color/50 bg-gradient-to-r from-bg-tertiary via-bg-tertiary/60 to-bg-tertiary/50 md:p-5 relative">
                    <h3 className="m-0 text-text-primary text-xl font-bold flex items-center gap-3">
                        <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/50"></div>
                            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent-primary animate-ping-slow opacity-75"></div>
                        </div>
                        {title}
                    </h3>
                </div>
                <div className="p-6 flex-1 overflow-y-auto md:p-5 relative z-10">
                    <p className="m-0 mb-4 text-text-primary leading-relaxed text-base">{message}</p>
                    <p className="m-0 text-text-muted text-sm">{t('continue-question')}</p>
                </div>
                <div className="p-5 border-t border-border-color/50 bg-bg-tertiary/30 flex gap-3 justify-end md:p-4 md:flex-col relative">
                    <button
                        className="group/cancel bg-bg-tertiary/80 backdrop-blur-xl text-text-primary border border-border-color px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 shadow-md min-w-[100px] m-0 hover:bg-bg-secondary hover:border-accent-primary/50 hover:shadow-lg hover:shadow-accent-primary/10 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full relative overflow-hidden"
                        onClick={onCancel}
                    >
                        <span className="relative z-10">{t('cancel')}</span>
                        <span className="absolute inset-0 bg-accent-gradient opacity-0 group-hover/cancel:opacity-5 transition-opacity duration-300"></span>
                    </button>
                    <button
                        className="group/confirm bg-accent-gradient text-white border-none px-6 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all duration-300 shadow-lg shadow-accent-primary/30 min-w-[100px] m-0 hover:shadow-xl hover:shadow-accent-primary/50 hover:-translate-y-1 hover:scale-105 active:translate-y-0 active:scale-100 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full relative overflow-hidden"
                        onClick={onConfirm}
                    >
                        <span className="relative z-10">{t('confirm')}</span>
                        <span className="absolute inset-0 bg-white/20 opacity-0 group-hover/confirm:opacity-100 transition-opacity duration-300"></span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

