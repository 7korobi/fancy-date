import type { Numeral } from './number';
export declare const SCRIPT_REGISTRY: {
    arabic: Numeral;
    'roman-upper': {
        parse: (num: number) => string;
        regex: string;
        to_number: (text: string) => number | null;
    };
    'roman-lower': {
        parse: (num: number) => string;
        regex: string;
        to_number: (text: string) => number | null;
    };
};
export type NumeralPurpose = string;
export type LocaleEntry = {
    tag: string;
    displayName: string;
    numerals: Partial<Record<NumeralPurpose, Numeral>>;
    defaultParseFormat: string;
    defaultFormat: string;
    labels?: Record<string, string>;
};
export declare const LOCALE_REGISTRY: Record<string, LocaleEntry>;
export declare function listLocales(): string[];
export declare function getLocale(tag: string): LocaleEntry | undefined;
