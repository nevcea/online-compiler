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
            <main className="container pt-8 pb-12 lg:pt-6 lg:pb-10">
                <div className="max-w-[900px] mx-auto">
                           <div className="flex justify-between items-center mb-10 pb-5 border-b border-border-color md:flex-col md:items-start md:gap-4 md:mb-8">
                               <h2 className="text-2xl font-semibold mb-0 text-text-primary tracking-tight md:text-xl flex items-center gap-3">
                                   <svg className="w-6 h-6 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                   </svg>
                                   {t('settings-title')}
                               </h2>
                               <button
                                   className="group/back bg-transparent text-text-secondary border border-border-color px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 flex items-center gap-2 hover:bg-bg-tertiary hover:border-accent-primary/50 hover:text-accent-primary hover:shadow-md hover:-translate-x-1 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 relative overflow-hidden"
                                   onClick={() => setCurrentPage('compiler')}
                               >
                                   <svg className="w-4 h-4 transition-transform duration-300 group-hover/back:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                   </svg>
                                   <span className="relative z-10">{t('back')}</span>
                                   <span className="absolute inset-0 bg-accent-gradient opacity-0 group-hover/back:opacity-5 transition-opacity duration-300"></span>
                               </button>
                           </div>
                           <div className="flex flex-col gap-6">
                               <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border-color rounded-xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/10 hover:border-accent-primary/30 hover:-translate-y-1 md:p-6 relative group/section overflow-hidden">
                                   <div className="absolute inset-0 rounded-xl bg-accent-gradient opacity-0 group-hover/section:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                                   <h3 className="text-lg font-bold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-4 border-b border-border-color/50 md:text-base md:mb-5 relative z-10">
                                       <div className="relative">
                                           <div className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/50"></div>
                                           <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent-primary animate-ping-slow opacity-75"></div>
                                       </div>
                                       {t('language-settings')}
                                   </h3>
                                   <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6 relative z-10">
                                       <label className="text-[0.9375rem] font-medium text-text-primary select-none flex items-center gap-2">
                                           <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                           </svg>
                                           {t('interface-language')}
                                       </label>
                                       <select
                                           className="bg-bg-tertiary/80 backdrop-blur-xl text-text-primary border border-border-color px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-300 w-full max-w-[400px] hover:border-accent-primary/50 hover:shadow-md hover:shadow-accent-primary/10 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 md:max-w-full"
                                           value={currentLang}
                                           onChange={(e) => setCurrentLang(e.target.value)}
                                       >
                                           <option value="ko">{t('korean')}</option>
                                           <option value="en">{t('english')}</option>
                                       </select>
                                   </div>
                               </div>
                               <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border-color rounded-xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/10 hover:border-accent-primary/30 hover:-translate-y-1 md:p-6 relative group/section overflow-hidden">
                                   <div className="absolute inset-0 rounded-xl bg-accent-gradient opacity-0 group-hover/section:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                                   <h3 className="text-lg font-bold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-4 border-b border-border-color/50 md:text-base md:mb-5 relative z-10">
                                       <div className="relative">
                                           <div className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/50"></div>
                                           <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent-primary animate-ping-slow opacity-75"></div>
                                       </div>
                                       {t('theme-settings')}
                                   </h3>
                                   <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6 relative z-10">
                                       <label className="text-[0.9375rem] font-medium text-text-primary select-none flex items-center gap-2">
                                           <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                           </svg>
                                           {t('theme')}
                                       </label>
                                       <select
                                           className="bg-bg-tertiary/80 backdrop-blur-xl text-text-primary border border-border-color px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-300 w-full max-w-[400px] hover:border-accent-primary/50 hover:shadow-md hover:shadow-accent-primary/10 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 md:max-w-full"
                                           value={theme}
                                           onChange={(e) => setTheme(e.target.value)}
                                       >
                                           <option value="system">{t('system-theme')}</option>
                                           <option value="dark">{t('dark-theme')}</option>
                                           <option value="light">{t('light-theme')}</option>
                                       </select>
                                   </div>
                               </div>
                               <div className="bg-bg-secondary/80 backdrop-blur-xl border border-border-color rounded-xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-accent-primary/10 hover:border-accent-primary/30 hover:-translate-y-1 md:p-6 relative group/section overflow-hidden">
                                   <div className="absolute inset-0 rounded-xl bg-accent-gradient opacity-0 group-hover/section:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
                                   <h3 className="text-lg font-bold mb-6 text-text-primary tracking-tight flex items-center gap-3 pb-4 border-b border-border-color/50 md:text-base md:mb-5 relative z-10">
                                       <div className="relative">
                                           <div className="w-2.5 h-2.5 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/50"></div>
                                           <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-accent-primary animate-ping-slow opacity-75"></div>
                                       </div>
                                       {t('editor-settings')}
                                   </h3>
                                   <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6 relative z-10">
                                       <label className="text-[0.9375rem] font-medium text-text-primary select-none flex items-center gap-2">
                                           <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                           </svg>
                                           {t('font-family')}
                                       </label>
                                       <select
                                           className="bg-bg-tertiary/80 backdrop-blur-xl text-text-primary border border-border-color px-4 py-3 rounded-xl text-sm cursor-pointer transition-all duration-300 w-full max-w-[400px] hover:border-accent-primary/50 hover:shadow-md hover:shadow-accent-primary/10 focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 md:max-w-full"
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
                                   <div className="flex flex-col gap-3.5 mb-7 last:mb-0 md:gap-3 md:mb-6 relative z-10">
                                       <label className="text-[0.9375rem] font-medium text-text-primary select-none flex items-center gap-2">
                                           <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                           </svg>
                                           {t('font-size')}
                                       </label>
                                       <div className="flex items-center gap-4 max-w-[400px] md:max-w-full relative z-10">
                                           <input
                                               type="range"
                                               min="10"
                                               max="24"
                                               value={fontSize}
                                               onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                                               step="1"
                                               className="flex-1 h-1.5 bg-bg-tertiary rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:bg-accent-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-120 hover:[&::-webkit-slider-thumb]:bg-accent-secondary [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:bg-accent-primary [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200 hover:[&::-moz-range-thumb]:scale-120 hover:[&::-moz-range-thumb]:bg-accent-secondary"
                                           />
                                           <span className="min-w-[50px] text-right text-base text-text-primary font-medium">{fontSize}px</span>
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

