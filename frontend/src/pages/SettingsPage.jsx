import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { FONT_CONFIG } from '../config/constants';

const SettingsPage = () => {
    const {
        theme,
        setTheme,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        currentLang,
        setCurrentLang,
        setCurrentPage,
        t
    } = useApp();

    return (
        <>
            <Header />
            <main className="container">
                <div className="max-w-[900px] mx-auto py-8 md:py-6">
                    <div className="flex justify-between items-center mb-10 pb-5 border-b border-border-color md:flex-col md:items-start md:gap-4 md:mb-8">
                        <h2 className="text-2xl font-semibold mb-0 text-text-primary tracking-tight md:text-xl">{t('settings-title')}</h2>
                        <button 
                            className="bg-transparent text-text-secondary border border-border-color px-4 py-2 rounded-sm text-sm font-medium cursor-pointer transition-all duration-200 flex items-center gap-2 hover:bg-bg-tertiary hover:border-accent-primary hover:text-text-primary hover:-translate-x-0.5 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2" 
                            onClick={() => setCurrentPage('compiler')}
                        >
                            {t('back')}
                        </button>
                    </div>
                    <div className="flex flex-col gap-6">
                        <div className="bg-bg-secondary border border-border-color rounded-md p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border-hover md:p-5">
                            <h3 className="text-base font-semibold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-3 border-b border-border-color before:content-[''] before:w-0.5 before:h-4 before:bg-accent-gradient before:rounded-sm md:text-[0.9375rem] md:mb-5">
                                {t('language-settings')}
                            </h3>
                            <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6">
                                <label className="text-[0.9375rem] font-medium text-text-primary select-none">{t('interface-language')}</label>
                                <select
                                    className="bg-bg-tertiary text-text-primary border border-border-color px-3 py-2.5 rounded-md text-sm cursor-pointer transition-all duration-200 w-full max-w-[400px] hover:border-accent-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] md:max-w-full"
                                    value={currentLang}
                                    onChange={(e) => setCurrentLang(e.target.value)}
                                >
                                    <option value="ko">{t('korean')}</option>
                                    <option value="en">{t('english')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="bg-bg-secondary border border-border-color rounded-md p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border-hover md:p-5">
                            <h3 className="text-base font-semibold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-3 border-b border-border-color before:content-[''] before:w-0.5 before:h-4 before:bg-accent-gradient before:rounded-sm md:text-[0.9375rem] md:mb-5">
                                {t('theme-settings')}
                            </h3>
                            <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6">
                                <label className="text-[0.9375rem] font-medium text-text-primary select-none">{t('theme')}</label>
                                <select 
                                    className="bg-bg-tertiary text-text-primary border border-border-color px-3 py-2.5 rounded-md text-sm cursor-pointer transition-all duration-200 w-full max-w-[400px] hover:border-accent-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] md:max-w-full"
                                    value={theme} 
                                    onChange={(e) => setTheme(e.target.value)}
                                >
                                    <option value="system">{t('system-theme')}</option>
                                    <option value="dark">{t('dark-theme')}</option>
                                    <option value="light">{t('light-theme')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="bg-bg-secondary border border-border-color rounded-md p-7 shadow-sm transition-all duration-200 hover:shadow-md hover:border-border-hover md:p-5">
                            <h3 className="text-base font-semibold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-3 border-b border-border-color before:content-[''] before:w-0.5 before:h-4 before:bg-accent-gradient before:rounded-sm md:text-[0.9375rem] md:mb-5">
                                {t('editor-settings')}
                            </h3>
                            <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6">
                                <label className="text-[0.9375rem] font-medium text-text-primary select-none">{t('font-family')}</label>
                                <select
                                    className="bg-bg-tertiary text-text-primary border border-border-color px-3 py-2.5 rounded-md text-sm cursor-pointer transition-all duration-200 w-full max-w-[400px] hover:border-accent-primary focus:outline-none focus:border-accent-primary focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] md:max-w-full"
                                    value={fontFamily}
                                    onChange={(e) => setFontFamily(e.target.value)}
                                >
                                    {Object.entries(FONT_CONFIG.families).map(([value, name]) => (
                                        <option key={value} value={value}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6">
                                <label className="text-[0.9375rem] font-medium text-text-primary select-none">{t('font-size')}</label>
                                <div className="flex items-center gap-4 max-w-[400px] md:max-w-full">
                                    <input
                                        type="range"
                                        min="10"
                                        max="24"
                                        value={fontSize}
                                        onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                        step="1"
                                        className="flex-1 h-1.5 bg-bg-tertiary rounded-sm outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-120 hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:bg-accent-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 hover:[&::-moz-range-thumb]:scale-120 hover:[&::-moz-range-thumb]:bg-accent-secondary"
                                    />
                                    <span className="min-w-[50px] text-right text-sm text-text-primary font-medium">{fontSize}px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default SettingsPage;

