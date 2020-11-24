declare type TDic = [string, string, string, string]
export declare class DIC {
  units: number[]
  join_str: string
  zero_str: string
  idxs: {
    item: number
    big: number
    scale: number
  }
  dic: {
    units: string[]
    items: string[]
    scales: string[]
    bigs: string[]
  }
  constructor(units1: number[], join_str: string, zero_str: string, ...dic: TDic)
  音便(fix: DIC['fix']): this
  fix(_num: number, str: string, _appendix?: string): string
  parse(num: number, appendix: string): string
  _calc(num: number, scale_idx: number, appendix: string): string
}
export declare const jpn: {
  漢字: DIC
  大字: DIC
  rubys: DIC
}
export declare const old_jpn: {
  rubys: DIC
}
export declare const angle: {
  basic: DIC
}
export {}
