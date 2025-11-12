import { useApp } from '../context/AppContext';

const Header = () => {
    const { setCurrentPage, t } = useApp();

    return (
        <header className="bg-[rgba(21,21,32,0.8)] backdrop-blur-2xl border-b border-border-color/50 px-6 py-4 sticky top-0 z-[100] shadow-lg">
            <div className="container flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent-gradient animate-pulse"></div>
                    <h1 className="text-xl font-bold text-text-primary tracking-tight bg-accent-gradient bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                </div>
                <div className="flex gap-3 items-center">
                    <button
                        className="group relative bg-bg-tertiary/50 border border-border-color rounded-lg px-5 py-2.5 flex items-center justify-center cursor-pointer transition-all duration-300 text-text-secondary text-sm font-medium min-h-10 hover:bg-accent-gradient hover:border-transparent hover:text-white hover:shadow-lg hover:shadow-accent-primary/25 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 overflow-hidden"
                        onClick={() => setCurrentPage('settings')}
                        aria-label={t('settings')}
                        title={t('settings')}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t('settings')}
                        </span>
                        <span className="absolute inset-0 bg-accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

