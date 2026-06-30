type TDic = [string, string, string, string];
export type Numeral = {
    parse(num: number, appendix?: string): string;
};
export declare function mod(value: number, by: number): number;
export declare class DIC {
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
    parse(num: number, appendix: string): string;
    _calc(num: number, scale_idx: number, appendix: string): string;
}
export declare const jpn: {
    漢字: DIC;
    大字: DIC;
    rubys: DIC;
};
export declare const old_jpn: {
    rubys: DIC;
};
declare function englishize(num: number): string;
declare function romanize(num: number): string;
export declare const english: {
    lower: {
        parse: typeof englishize;
    };
    title: {
        parse: (num: number) => string;
    };
};
export declare const roman: {
    upper: {
        parse: typeof romanize;
    };
    lower: {
        parse: (num: number) => string;
    };
};
export declare const angle: {
    basic: DIC;
};
export {};
