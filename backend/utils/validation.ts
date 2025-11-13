import { ALLOWED_LANGUAGES, ALLOWED_IMAGES, DANGEROUS_PATTERNS } from '../config';
import { validatePath } from './pathUtils';

const ALLOWED_LANGUAGES_SET = new Set(ALLOWED_LANGUAGES.map((lang) => lang.toLowerCase()));
const ALLOWED_IMAGES_SET = new Set(ALLOWED_IMAGES);

export function validateLanguage(language: unknown): language is string {
    return typeof language === 'string' && ALLOWED_LANGUAGES_SET.has(language.toLowerCase());
}

export function validateImage(image: unknown): image is string {
    return typeof image === 'string' && ALLOWED_IMAGES_SET.has(image);
}

export function sanitizeCode(code: unknown): void {
    if (typeof code !== 'string') {
        throw new Error('Code must be a string');
    }
    if (code.length > 100000) {
        throw new Error('Code is too long');
    }
    if (code.trim().length === 0) {
        throw new Error('Code cannot be empty');
    }
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(code)) {
            throw new Error('Code contains dangerous patterns');
        }
    }
}

export function validateJavaClass(code: string): void {
    if (typeof code !== 'string') {
        throw new Error('Invalid code format');
    }
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    if (!classMatch) {
        throw new Error('Java code must contain a public class');
    }
    const className = classMatch[1];
    const fileNameMatch = code.match(/\/\/\s*File:\s*(\w+\.java)/);
    if (fileNameMatch && fileNameMatch[1] !== `${className}.java`) {
        throw new Error('Class name must match file name');
    }
}

export { validatePath };

