import { useApp } from '../context/AppContext';

const Header = () => {
    const { setCurrentPage, t } = useApp();

    return (
        <header className="bg-[rgba(26,26,26,0.85)] backdrop-blur-xl border-b border-border-color px-6 py-3 sticky top-0 z-[100]">
            <div className="container flex justify-between items-center">
                <h1 className="text-lg font-semibold text-text-primary tracking-tight bg-accent-gradient bg-clip-text text-transparent">
                    {t('title')}
                </h1>
                <div className="flex gap-3 items-center">
                    <button
                        className="bg-transparent border border-border-color rounded-sm px-4 py-2 flex items-center justify-center cursor-pointer transition-all duration-200 text-text-secondary text-sm font-medium min-h-9 hover:bg-bg-tertiary hover:border-accent-primary hover:text-text-primary hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                        onClick={() => setCurrentPage('settings')}
                        aria-label={t('settings')}
                        title={t('settings')}
                    >
                        {t('settings')}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

