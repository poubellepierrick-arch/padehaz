import { MAX_PROG_EMBED_LENGTH } from '../config/constants';

export interface ParsedProgEmbed {
    isEmpty: boolean;
    isValid: boolean;
    srcUrl: string;
    title: string;
    errorMessage: string | null;
}

function decodeBasicHtmlEntities(value: string): string {
    return value
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');
}

export function parseProgEmbedInput(rawInput: string | null | undefined): ParsedProgEmbed {
    const trimmed = (rawInput || '').trim();
    if (!trimmed) {
        return {
            isEmpty: true,
            isValid: false,
            srcUrl: '',
            title: 'Programme',
            errorMessage: null
        };
    }

    if (trimmed.length > MAX_PROG_EMBED_LENGTH) {
        return {
            isEmpty: false,
            isValid: false,
            srcUrl: '',
            title: 'Programme',
            errorMessage: `Le contenu dépasse la limite de ${MAX_PROG_EMBED_LENGTH} caractères.`
        };
    }

    let candidateUrl = trimmed;
    let extractedTitle = 'Programme';

    if (/<iframe\b/i.test(trimmed)) {
        const srcMatch =
            trimmed.match(/\bsrc\s*=\s*"([^"]+)"/i) ||
            trimmed.match(/\bsrc\s*=\s*'([^']+)'/i) ||
            trimmed.match(/\bsrc\s*=\s*([^\s>]+)/i);

        if (!srcMatch || !srcMatch[1]) {
            return {
                isEmpty: false,
                isValid: false,
                srcUrl: '',
                title: 'Programme',
                errorMessage: 'Code iframe détecté, mais attribut src="..." introuvable.'
            };
        }

        candidateUrl = decodeBasicHtmlEntities(srcMatch[1].trim());

        const titleMatch =
            trimmed.match(/\btitle\s*=\s*"([^"]+)"/i) ||
            trimmed.match(/\btitle\s*=\s*'([^']+)'/i);
        if (titleMatch && titleMatch[1]) {
            extractedTitle = decodeBasicHtmlEntities(titleMatch[1].trim()) || 'Programme';
        }
    } else if (trimmed.startsWith('<')) {
        return {
            isEmpty: false,
            isValid: false,
            srcUrl: '',
            title: 'Programme',
            errorMessage: 'Seule une URL ou une balise <iframe> est acceptée.'
        };
    } else if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) && /^[^\s<>"']+\.[^\s<>"']+/.test(trimmed)) {
        candidateUrl = `https://${trimmed}`;
    }

    try {
        const parsedUrl = new URL(candidateUrl);
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
            return {
                isEmpty: false,
                isValid: false,
                srcUrl: '',
                title: extractedTitle,
                errorMessage: 'Le lien doit utiliser le protocole https:// ou http://.'
            };
        }

        return {
            isEmpty: false,
            isValid: true,
            srcUrl: parsedUrl.toString(),
            title: extractedTitle,
            errorMessage: null
        };
    } catch {
        return {
            isEmpty: false,
            isValid: false,
            srcUrl: '',
            title: extractedTitle,
            errorMessage: 'URL invalide. Collez un lien https://... ou un code <iframe> valide.'
        };
    }
}
