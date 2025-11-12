import { useApp } from '../context/AppContext';

const Header = () => {
    const { setCurrentPage, t } = useApp();

    return (
        <header className="bg-[rgba(21,21,32,0.85)] backdrop-blur-2xl border-b border-border-color/50 px-6 py-4 sticky top-0 z-[100] shadow-lg shadow-black/20">
            <div className="container flex justify-between items-center">
                <div className="flex items-center gap-3 group/logo">
                    <div className="relative w-3 h-3">
                        <div className="absolute inset-0 rounded-full bg-accent-gradient animate-pulse-slow shadow-lg shadow-accent-primary/50"></div>
                        <div className="absolute inset-0 rounded-full bg-accent-gradient animate-ping-slow opacity-75"></div>
                    </div>
                    <h1 className="text-xl font-bold text-text-primary tracking-tight relative">
                        <span className="bg-accent-gradient bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer-text_3s_ease-in-out_infinite]">
                            {t('title')}
                        </span>
                        <span className="absolute inset-0 bg-accent-gradient bg-clip-text text-transparent opacity-0 group-hover/logo:opacity-20 transition-opacity duration-300 blur-sm">
                            {t('title')}
                        </span>
                    </h1>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        className="group relative bg-bg-tertiary/50 border border-border-color rounded-lg px-4 py-2 flex items-center justify-center cursor-pointer transition-all duration-300 text-text-secondary text-sm font-medium min-h-9 hover:bg-bg-tertiary hover:border-accent-primary/50 hover:text-accent-primary hover:shadow-md hover:shadow-accent-primary/20 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 overflow-hidden"
                        onClick={() => setCurrentPage('settings')}
                        aria-label={t('settings')}
                        title={`${t('settings')} (Ctrl+Shift+/ for shortcuts)`}
                    >
                        <span className="relative z-10">
                            <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </span>
                        <span className="absolute inset-0 bg-accent-gradient opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

