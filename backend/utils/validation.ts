import { ALLOWED_LANGUAGES, ALLOWED_IMAGES, DANGEROUS_PATTERNS, CONFIG } from '../config';
import { JAVA_CLASS_REGEX, JAVA_FILE_REGEX, ERROR_MESSAGES } from './constants';

const ALLOWED_LANGUAGES_SET = new Set(ALLOWED_LANGUAGES.map((lang) => lang.toLowerCase()));
const ALLOWED_IMAGES_SET = new Set(ALLOWED_IMAGES);
const DANGEROUS_PATTERNS_LENGTH = DANGEROUS_PATTERNS.length;

export const Validator = {
    language(language: unknown): language is string {
        return typeof language === 'string' && ALLOWED_LANGUAGES_SET.has(language.toLowerCase());
    },

    image(image: unknown): image is string {
        return typeof image === 'string' && ALLOWED_IMAGES_SET.has(image);
    },

    sanitizeCode(code: unknown): void {
        if (typeof code !== 'string') {
            throw new Error(ERROR_MESSAGES.CODE_MUST_BE_STRING);
        }
        const codeLen = code.length;
        if (codeLen > CONFIG.MAX_CODE_LENGTH) {
            throw new Error(`코드가 너무 깁니다. 최대 ${CONFIG.MAX_CODE_LENGTH}자까지 허용됩니다.`);
        }
        if (codeLen === 0) {
            throw new Error(ERROR_MESSAGES.CODE_CANNOT_BE_EMPTY);
        }

        if (code.trim().length === 0) {
            throw new Error(ERROR_MESSAGES.CODE_CANNOT_BE_EMPTY);
        }

        for (let i = 0; i < DANGEROUS_PATTERNS_LENGTH; i++) {
            if (DANGEROUS_PATTERNS[i].test(code)) {
                throw new Error(ERROR_MESSAGES.CODE_CONTAINS_DANGEROUS_PATTERN);
            }
        }
    },

    javaClass(code: string): void {
        if (typeof code !== 'string') {
            throw new Error(ERROR_MESSAGES.INVALID_CODE_FORMAT);
        }
        const classMatch = JAVA_CLASS_REGEX.exec(code);
        if (!classMatch) {
            throw new Error(ERROR_MESSAGES.JAVA_PUBLIC_CLASS_REQUIRED);
        }
        const className = classMatch[1];
        const fileNameMatch = JAVA_FILE_REGEX.exec(code);
        if (fileNameMatch && fileNameMatch[1] !== `${className}.java`) {
            throw new Error(ERROR_MESSAGES.JAVA_CLASS_FILE_NAME_MISMATCH);
        }
    }
};

export const validateLanguage = Validator.language;
export const validateImage = Validator.image;
export const sanitizeCode = Validator.sanitizeCode;
export const validateJavaClass = Validator.javaClass;
export { validatePath } from './pathUtils';
