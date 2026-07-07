type TDic = [string, string, string, string];
export type Numeral = {
    parse(num: number): string;
    regex?: string;
    to_number?(text: string): number | null;
};
export declare function mod(value: number, by: number): number;
export declare class DIC {
    private number_map?;
    private number_regex?;
    private requires_tail;
    private composites;
    units: number[];
    join_str: string;
    zero_str: string;
    idxs: {
        item: number;
        big: number;
        scale: number;
    };
    dic: {
        units: string[];
        items: string[];
        scales: string[];
        bigs: string[];
    };
    constructor(units1: number[], join_str: string, zero_str: string, ...dic: TDic);
    音便(fix: DIC['fix']): this;
    fix(_num: number, str: string, _appendix?: string): string;
    語尾必須(): this;
    例外(num: number, word: string): this;
    語尾(tail: string): Numeral;
    parse(num: number, appendix?: string): string;
    get regex(): string;
    to_number(text: string): number | null;
    private ensure_number_map;
    _calc(num: number, scale_idx: number, appendix: string): string;
}
export declare const arabic: Numeral;
export declare const jpn: {
    漢字: DIC;
    大字: DIC;
    rubys: DIC;
    桁読み: Numeral;
};
export declare const old_jpn: {
    rubys: DIC;
};
declare function sino_korean(num: number): string;
export declare const kor: {
    漢語系: {
        parse: typeof sino_korean;
    };
    固有系: {
        基本: {
            parse: (num: number) => string;
        };
        助数詞前: {
            parse: (num: number) => string;
        };
    };
};
declare function englishize(num: number): string;
declare function english_to_number(text: string): number | null;
declare function romanize(num: number): string;
declare function roman_to_number(text: string): number | null;
export declare const english: {
    lower: {
        parse: typeof englishize;
        regex: string;
        to_number: typeof english_to_number;
    };
    title: {
        parse: (num: number) => string;
        regex: string;
        to_number: typeof english_to_number;
    };
};
export declare const roman: {
    upper: {
        parse: typeof romanize;
        regex: string;
        to_number: typeof roman_to_number;
    };
    lower: {
        parse: (num: number) => string;
        regex: string;
        to_number: typeof roman_to_number;
    };
};
export declare const angle: {
    basic: DIC;
};
export {};
