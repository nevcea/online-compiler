import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CodeEditor from '../components/CodeEditor';
import LanguageSelector from '../components/LanguageSelector';
import OutputPanel from '../components/OutputPanel';
import Header from '../components/Header';
import { executeCode as apiExecuteCode } from '../services/api';
import { CONFIG, LANGUAGE_CONFIG } from '../config/constants';
import { formatOutput, formatError } from '../utils/outputFormatter';

const CompilerPage = () => {
    const {
        code,
        setCode,
        input,
        setInput,
        output,
        setOutput,
        error,
        setError,
        isRunning,
        setIsRunning,
        currentLanguage,
        setCurrentLanguage,
        t
    } = useApp();
    const [pendingLanguageChange, setPendingLanguageChange] = useState(null);

    const handleRun = async () => {
        if (!code || !code.trim()) {
            setOutput(t('no-code-error'));
            return;
        }

        setIsRunning(true);
        setOutput('');
        setError('');

        try {
            const result = await apiExecuteCode(code, currentLanguage, input);
            const formattedOutput = formatOutput(result.output || '');
            const formattedError = formatError(result.error || '');
            
            if (result.images && result.images.length > 0) {
                setOutput({
                    text: formattedOutput,
                    images: result.images
                });
            } else {
                setOutput(formattedOutput);
            }
            setError(formattedError);
        } catch (err) {
            let userMessage = t('connection-error');
            if (err.message) {
                const msg = err.message.toLowerCase();
                if (msg.includes('failed to fetch') || msg.includes('network')) {
                    userMessage = t('cannot-connect-server');
                } else if (msg.includes('timeout')) {
                    userMessage = t('request-timeout');
                } else if (msg.includes('400')) {
                    userMessage = t('bad-request');
                } else if (msg.includes('500')) {
                    userMessage = t('server-error');
                } else {
                    const match = err.message.match(/HTTP \d+: (.+)/);
                    if (match && match[1]) {
                        userMessage = match[1];
                    }
                }
            }
            setError(userMessage);
        } finally {
            setIsRunning(false);
        }
    };

    const handleClear = () => {
        const template = LANGUAGE_CONFIG.templates[currentLanguage] || '';
        setCode(template);
        localStorage.removeItem(`code_${currentLanguage}`);
        setOutput('');
        setError('');
    };

    const handleLanguageChange = (lang) => {
        if (code && code.trim() && code !== LANGUAGE_CONFIG.templates[currentLanguage]) {
            setPendingLanguageChange(lang);
        } else {
            setCurrentLanguage(lang);
        }
    };

    const confirmLanguageChange = () => {
        if (pendingLanguageChange) {
            setCurrentLanguage(pendingLanguageChange);
            setPendingLanguageChange(null);
        }
    };

    return (
        <>
            <Header />
            <main className="container">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[calc(100vh-180px)] items-start xl:gap-8 xl:min-h-[calc(100vh-200px)]" style={{ gridTemplateRows: 'auto 1fr auto', gridTemplateAreas: "'language language' 'editor output' 'actions actions'" }}>
                    <div className="[grid-area:language] md:[grid-area:language]">
                        <LanguageSelector
                            onLanguageChange={handleLanguageChange}
                            pendingChange={pendingLanguageChange}
                            onConfirmChange={confirmLanguageChange}
                            onCancelChange={() => setPendingLanguageChange(null)}
                        />
                    </div>
                    <div className="flex flex-col bg-bg-secondary border border-border-color rounded-md overflow-hidden h-full min-h-[400px] shadow-sm transition-all duration-200 relative hover:shadow-md hover:border-border-hover md:min-h-[350px]" style={{ gridArea: 'editor' }}>
                        <div className="relative before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-accent-gradient before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100">
                            <div className="bg-bg-tertiary px-5 py-3 border-b border-border-color flex items-center min-h-[44px]">
                                <span className="font-semibold text-text-secondary text-xs uppercase tracking-wider font-variant-small-caps flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-border-color after:ml-2">
                                    {t('code-editor')}
                                </span>
                            </div>
                            <div className="flex relative min-h-[350px] flex-1 md:min-h-[300px]">
                                <CodeEditor onRun={handleRun} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3.5 justify-end items-center py-4 flex-wrap border-t border-border-color mt-2 pt-5 md:flex-col md:w-full md:gap-3 md:py-2" style={{ gridArea: 'actions' }}>
                        <button
                            type="button"
                            className="bg-accent-primary text-white border-none px-6 py-2.5 rounded-sm text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm min-w-[100px] hover:bg-accent-hover hover:shadow-md hover:-translate-y-px active:translate-y-0 active:scale-[0.98] active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none md:w-full md:justify-center"
                            onClick={handleRun}
                            disabled={isRunning}
                        >
                            {isRunning ? t('running') : t('run')}
                        </button>
                        <button 
                            type="button" 
                            className="bg-bg-tertiary text-text-primary border border-border-color px-6 py-2.5 rounded-sm text-sm font-semibold cursor-pointer transition-all duration-200 shadow-sm hover:bg-bg-secondary hover:border-border-hover focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:w-full md:justify-center"
                            onClick={handleClear}
                        >
                            {t('clear')}
                        </button>
                    </div>
                    <div className="[grid-area:output]">
                        <OutputPanel input={input} setInput={setInput} output={output} error={error} />
                    </div>
                </div>
            </main>
        </>
    );
};

export default CompilerPage;

