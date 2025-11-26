import type { Language } from '../types';

export type TranslationKey =
    | 'title'
    | 'cancel'
    | 'confirm'
    | 'close'
    | 'back'
    | 'settings'
    | 'settings-title'
    | 'code-editor'
    | 'code-placeholder'
    | 'search-language'
    | 'run'
    | 'running'
    | 'executing'
    | 'execution-result'
    | 'execution-timeout'
    | 'execution-error'
    | 'output-placeholder'
    | 'no-output'
    | 'clear-output'
    | 'console-input-placeholder'
    | 'no-code-error'
    | 'connection-error'
    | 'request-error'
    | 'cannot-connect-server'
    | 'request-timeout'
    | 'request-timeout-retry'
    | 'network-error-detail'
    | 'unexpected-error'
    | 'bad-request'
    | 'server-error'
    | 'docker-not-running'
    | 'docker-not-installed'
    | 'docker-image-not-found'
    | 'docker-permission-error'
    | 'docker-invalid-format'
    | 'language-change-title'
    | 'language-change-message'
    | 'language-settings'
    | 'interface-language'
    | 'korean'
    | 'english'
    | 'clear'
    | 'clear-confirm-message'
    | 'clear-output-confirm-message'
    | 'continue-question'
    | 'editor-settings'
    | 'theme-settings'
    | 'font-family'
    | 'font-size'
    | 'search-font'
    | 'theme'
    | 'system-theme'
    | 'dark-theme'
    | 'light-theme'
    | 'keyboard-shortcuts'
    | 'shortcut-run-code'
    | 'shortcut-show-help'
    | 'shortcut-clear'
    | 'shortcut-close-modal';

type TranslationData = Record<TranslationKey, string>;

export const translations: Record<Language, TranslationData> = {
    ko: {
        title: '온라인 컴파일러',
        cancel: '취소',
        confirm: '확인',
        close: '닫기',
        back: '뒤로',
        settings: '설정',
        'settings-title': '설정',
        'code-editor': '코드 에디터',
        'code-placeholder': '코드를 입력하세요',
        'search-language': '언어 검색...',
        run: '실행',
        running: '실행 중...',
        executing: '코드를 실행하고 있습니다...',
        'execution-result': '실행 결과',
        'execution-timeout': '실행 시간이 초과되었습니다.',
        'execution-error': '실행 중 오류가 발생했습니다.',
        'output-placeholder': '실행 결과가 여기에 표시됩니다.',
        'no-output': '출력이 없습니다.',
        'clear-output': '지우기',
        'console-input-placeholder': '프로그램 입력',
        'no-code-error': '실행할 코드가 없습니다.',
        'connection-error': '연결 오류',
        'request-error': '요청 처리 중 오류가 발생했습니다.',
        'cannot-connect-server': '서버에 연결할 수 없습니다.',
        'request-timeout': '요청 시간이 초과되었습니다.',
        'request-timeout-retry': '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        'network-error-detail': '네트워크 오류: 서버에 연결할 수 없습니다. 연결을 확인해주세요.',
        'unexpected-error': '예상치 못한 오류가 발생했습니다.',
        'bad-request': '잘못된 요청입니다.',
        'server-error': '서버 오류가 발생했습니다.',
        'docker-not-running': 'Docker가 실행되지 않았습니다. Docker Desktop을 시작한 후 다시 시도해주세요.',
        'docker-not-installed': 'Docker가 설치되지 않았습니다. Docker를 설치한 후 다시 시도해주세요.',
        'docker-image-not-found':
            'Docker 이미지를 찾을 수 없습니다. 필요한 이미지를 다운로드 중입니다. 잠시 후 다시 시도해주세요.',
        'docker-permission-error': 'Docker 권한 오류가 발생했습니다. Docker 권한을 확인해주세요.',
        'docker-invalid-format': 'Docker 명령어 형식 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'language-change-title': '언어 변경 확인',
        'language-change-message': '언어를 변경하면 현재 코드가 기본 템플릿으로 교체됩니다.',
        'language-settings': '언어 설정',
        'interface-language': '인터페이스 언어:',
        korean: '한국어',
        english: 'English',
        clear: '초기화',
        'clear-confirm-message': '코드를 초기화합니다.',
        'clear-output-confirm-message': '실행 결과를 지웁니다.',
        'continue-question': '계속하시겠습니까?',
        'editor-settings': '에디터 설정',
        'theme-settings': '테마 설정',
        'font-family': '폰트:',
        'font-size': '폰트 크기:',
        'search-font': '폰트 검색...',
        theme: '테마:',
        'system-theme': '시스템 기본값',
        'dark-theme': '다크 모드',
        'light-theme': '라이트 모드',
        'keyboard-shortcuts': '키보드 단축키',
        'shortcut-run-code': '코드 실행',
        'shortcut-show-help': '도움말 표시',
        'shortcut-clear': '에디터 초기화',
        'shortcut-close-modal': '모달 닫기'
    },
    en: {
        title: 'Online Compiler',
        cancel: 'Cancel',
        confirm: 'Confirm',
        close: 'Close',
        back: 'Back',
        settings: 'Settings',
        'settings-title': 'Settings',
        'code-editor': 'Code Editor',
        'code-placeholder': 'Enter your code here',
        'search-language': 'Search language...',
        run: 'Run',
        running: 'Running...',
        executing: 'Executing code...',
        'execution-result': 'Execution Result',
        'execution-timeout': 'Execution timeout exceeded.',
        'execution-error': 'An error occurred during execution.',
        'output-placeholder': 'Execution results will be displayed here.',
        'no-output': 'No output.',
        'clear-output': 'Clear',
        'console-input-placeholder': 'Program input',
        'no-code-error': 'No code to execute.',
        'connection-error': 'Connection error',
        'request-error': 'An error occurred while processing the request.',
        'cannot-connect-server': 'Cannot connect to server.',
        'request-timeout': 'Request timeout exceeded.',
        'request-timeout-retry': 'Request timeout exceeded. Please try again in a moment.',
        'network-error-detail': 'Network error: Cannot connect to server. Please check your connection.',
        'unexpected-error': 'An unexpected error occurred.',
        'bad-request': 'Bad request.',
        'server-error': 'Server error occurred.',
        'docker-not-running': 'Docker is not running. Please start Docker Desktop and try again.',
        'docker-not-installed': 'Docker is not installed. Please install Docker and try again.',
        'docker-image-not-found': 'Docker image not found. Downloading required image. Please try again in a moment.',
        'docker-permission-error': 'Docker permission error occurred. Please check Docker permissions.',
        'docker-invalid-format': 'Docker command format error occurred. Please try again in a moment.',
        'language-change-title': 'Language Change Confirmation',
        'language-change-message': 'Changing the language will replace the current code with the default template.',
        'language-settings': 'Language Settings',
        'interface-language': 'Interface Language:',
        korean: 'Korean',
        english: 'English',
        clear: 'Clear',
        'clear-confirm-message': 'This will clear the code.',
        'clear-output-confirm-message': 'This will clear the execution result.',
        'continue-question': 'Do you want to continue?',
        'editor-settings': 'Editor Settings',
        'theme-settings': 'Theme Settings',
        'font-family': 'Font:',
        'font-size': 'Font Size:',
        'search-font': 'Search font...',
        theme: 'Theme:',
        'system-theme': 'System Default',
        'dark-theme': 'Dark Mode',
        'light-theme': 'Light Mode',
        'keyboard-shortcuts': 'Keyboard Shortcuts',
        'shortcut-run-code': 'Run code',
        'shortcut-show-help': 'Show keyboard shortcuts',
        'shortcut-clear': 'Clear editor',
        'shortcut-close-modal': 'Close modal/dropdown'
    }
};

export const getTranslation = (key: TranslationKey, lang: Language = 'ko'): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
};

export const mapServerErrorMessage = (errorMessage: string): TranslationKey | null => {
    const errorLower = errorMessage.toLowerCase();

    if (errorMessage.includes('Docker가 실행되지 않았습니다') || errorMessage.includes('Docker Desktop을 시작한 후')) {
        return 'docker-not-running';
    }
    if (errorMessage.includes('Docker가 설치되지 않았습니다') || errorMessage.includes('Docker를 설치한 후')) {
        return 'docker-not-installed';
    }
    if (
        errorMessage.includes('Docker 이미지를 찾을 수 없습니다') ||
        errorMessage.includes('이미지를 다운로드 중입니다')
    ) {
        return 'docker-image-not-found';
    }
    if (errorMessage.includes('Docker 권한 오류가 발생했습니다')) {
        return 'docker-permission-error';
    }
    if (errorMessage.includes('Docker 명령어 형식 오류가 발생했습니다')) {
        return 'docker-invalid-format';
    }
    if (errorMessage.includes('실행 시간이 초과되었습니다')) {
        return 'execution-timeout';
    }
    if (errorMessage.includes('실행 중 오류가 발생했습니다')) {
        return 'execution-error';
    }

    if (
        errorLower.includes('docker is not running') ||
        (errorLower.includes('docker daemon') && errorLower.includes('not running'))
    ) {
        return 'docker-not-running';
    }
    if (errorLower.includes('docker is not installed') || errorLower.includes('docker: command not found')) {
        return 'docker-not-installed';
    }
    if (errorLower.includes('docker image not found') || errorLower.includes('no such image')) {
        return 'docker-image-not-found';
    }
    if (
        errorLower.includes('docker permission') ||
        (errorLower.includes('permission denied') && errorLower.includes('docker'))
    ) {
        return 'docker-permission-error';
    }
    if (errorLower.includes('execution timeout') || errorLower.includes('timeout exceeded')) {
        return 'execution-timeout';
    }
    if (errorLower.includes('error occurred during execution')) {
        return 'execution-error';
    }

    return null;
};
