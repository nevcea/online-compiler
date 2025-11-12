import { useApp } from '../context/AppContext';
import { CONFIG } from '../config/constants';

const OutputPanel = ({ input, setInput, output, error }) => {
    const { t, setOutput } = useApp();

    const handleClear = () => {
        setOutput('');
    };

    const outputText = typeof output === 'object' && output.text ? output.text : output;
    const images = typeof output === 'object' && output.images ? output.images : [];
    const hasContent = outputText || error || images.length > 0;

    return (
        <div className="flex flex-col bg-bg-secondary border border-border-color rounded-md overflow-hidden min-h-[400px] h-full shadow-sm transition-all duration-200 relative hover:shadow-md hover:border-border-hover before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-0.5 before:bg-accent-gradient before:opacity-0 before:transition-opacity before:duration-200 hover:before:opacity-100 md:min-h-[300px]" style={{ gridArea: 'output' }}>
            <div className="bg-bg-tertiary px-5 py-3 border-b border-border-color flex justify-between items-center min-h-[44px] md:px-4 md:min-h-[48px] md:flex-wrap md:gap-2">
                <span className="font-semibold text-text-secondary text-xs uppercase tracking-wider font-variant-small-caps flex items-center gap-2 flex-1 after:content-[''] after:flex-1 after:h-px after:bg-border-color after:ml-2 md:text-[0.8rem]">
                    {t('execution-result')}
                </span>
                {hasContent && (
                    <button 
                        className="flex items-center gap-2 bg-transparent text-text-secondary border border-transparent px-3.5 py-2 rounded-sm text-[0.8125rem] font-medium cursor-pointer transition-all duration-200 hover:bg-bg-secondary hover:text-text-primary hover:border-border-color active:scale-[0.98] active:bg-bg-tertiary focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 md:text-[0.8rem] md:px-2.5 md:py-1.5" 
                        onClick={handleClear} 
                        title={t('clear-output')}
                    >
                        <span>{t('clear-output')}</span>
                    </button>
                )}
            </div>
            <div id="output" className="flex-1 flex flex-col min-h-[120px]">
                <div className="flex-1 p-5 font-mono text-sm leading-[1.7] whitespace-pre-wrap break-words overflow-y-auto text-text-primary min-h-[100px] max-h-[500px] bg-bg-primary relative md:p-4 md:text-[13px] md:max-h-[400px]">
                    {!hasContent ? (
                        <p className="m-0 p-0 text-text-muted font-mono text-sm leading-[1.7] relative top-0 left-0 w-auto h-auto md:text-[13px]">{t('output-placeholder')}</p>
                    ) : (
                        <>
                            {images.map((img, index) => (
                                <div key={index} className="my-2 break-words py-0.5">
                                    <img
                                        src={img.data}
                                        alt={img.name}
                                        className="block max-w-full h-auto mt-2 rounded"
                                    />
                                </div>
                            ))}
                            {outputText && (
                                <pre className="whitespace-pre-line m-0 p-0 bg-transparent border-none font-inherit text-inherit leading-inherit">
                                    {outputText}
                                </pre>
                            )}
                            {error && (
                                <pre className="m-0 p-0 bg-transparent border-none font-inherit text-error whitespace-pre-wrap break-words">
                                    {error}
                                </pre>
                            )}
                            {!outputText && !error && images.length === 0 && (
                                <p className="m-0 p-0 text-text-muted font-mono text-sm leading-[1.7] relative top-0 left-0 w-auto h-auto md:text-[13px]">{t('no-output')}</p>
                            )}
                        </>
                    )}
                </div>
                <div className="flex items-center px-4 py-3 bg-bg-tertiary border-t border-border-color gap-2 focus-within:bg-bg-secondary md:px-4 md:py-3.5 md:gap-2">
                    <span className="text-accent-primary font-semibold font-mono text-sm flex-shrink-0 select-none md:text-[13px]">&gt;</span>
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none text-text-primary font-mono text-sm py-1 outline-none transition-opacity duration-200 placeholder:text-text-muted placeholder:opacity-80 focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 focus-visible:rounded disabled:opacity-60 disabled:cursor-not-allowed md:text-[13px]"
                        placeholder={t('console-input-placeholder')}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoComplete="off"
                    />
                </div>
            </div>
        </div>
    );
};

export default OutputPanel;

