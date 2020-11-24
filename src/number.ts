type TDic = [string, string, string, string]

export class DIC {
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
  constructor(units1: number[], join_str: string, zero_str: string, ...dic: TDic) {
    this.units = units1
    this.join_str = join_str
    this.zero_str = zero_str

    let [units, items, scales, bigs] = dic.map((o) => o.split(' '))

    const unit_str = items[1]
    const scale = scales.indexOf(unit_str)
    const tail = scales.slice(-4)
    scales[scale] = ''
    bigs.forEach(() => {
      scales = [...scales, ...tail]
    })

    const item = items.length
    const big = item ** 4
    this.idxs = { item, big, scale }
    this.dic = { units, items, scales, bigs }
  }

  音便(fix: DIC['fix']) {
    this.fix = fix
    return this
  }

  fix(_num: number, str: string, _appendix?: string) {
    return str
  }

  parse(num: number, appendix: string) {
    const base = this.idxs.item
    let gap = 0
    let scale = 1
    while (num * scale !== Math.floor(num * scale)) {
      gap++
      scale *= base
    }
    return this._calc(Math.floor(num * scale), -gap, appendix)
  }

  _calc(num: number, scale_idx: number, appendix: string) {
    let { join_str } = this
    let left_str = ''
    let scale_str = this.dic.scales[scale_idx + this.idxs.scale]

    const base = this.idxs.item
    const next_num = Math.floor(num / base)

    if (next_num) {
      left_str = this._calc(next_num, scale_idx + 1, appendix)
    } else {
      join_str = ''
      left_str = ''
    }

    const n = num % base
    let n_str = this.dic.items[n]

    const big_idx = scale_idx % 4 || !(num % this.idxs.big) ? -1 : Math.floor(scale_idx / 4) - 1
    const big_str = this.dic.bigs[big_idx] || ''

    switch (n) {
      case 0:
        if (left_str) {
          n_str = ''
        }
        join_str = ''
        scale_str = ''
        break
      case 1:
        if (0 < scale_idx) {
          n_str = ''
        }
        break
    }

    if (-1 < scale_idx) {
      scale_idx %= 4
    }
    const fix = this.fix(base ** scale_idx * n, `${n_str}${scale_str}`, appendix)
    return `${left_str}${join_str}${fix}${big_str}`
  }
}

export const jpn = {
  漢字: new DIC(
    [12, 2, 2, 2, 2, 0.1],
    '',
    '余',
    '打 対 番 足 双 割',
    '〇 一 二 三 四 五 六 七 八 九',
    '清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 一 十 百 千',
    '万 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数'
  ).音便((num: number, str: string, _appendix?: string) => {
    switch (num) {
      case 20:
        return '廿'
      case 30:
        return '丗'
      case 40:
        return '卌'
      default:
        return str
    }
  }),

  大字: new DIC(
    [12, 2, 2, 2, 2, 0.1],
    '',
    '余',
    '打 対 番 足 双 割',
    '零 壱 弐 参 肆 伍 陸 漆 捌 玖',
    '清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 壱 拾 佰 阡',
    '萬 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数'
  ),

  rubys: new DIC(
    [12, 2, 2, 2, 2, 0.1],
    '',
    '',
    'だーす つい つがい そく そう わり',
    'れい いち に さん よん ご ろく なな はち きゅう',
    'せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ いち じゅう ひゃく せん',
    'まん おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう'
  ).音便((num: number, str: string, _appendix?: string) => {
    switch (num) {
      case 300:
        return 'さんびゃく'
      case 600:
        return 'ろっぴゃく'
      case 800:
        return 'はっぴゃく'
      case 3000:
        return 'さんぜん'
      case 8000:
        return 'はっせん'
      default:
        return str
    }
  }),
}

export const old_jpn = {
  rubys: new DIC(
    [12, 2, 2, 2, 2, 0.1],
    'まり',
    '',
    'だーす つい つがい そく そう わり',
    'れい ひと ふた み よ いつ む なな や ここの',
    'せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ ひと そ ほ ち',
    'よろづ おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう'
  ).音便((num: number, str: string, tail = 'つ') => {
    if (!str) return ''
    if (num < 1) return str
    if (100 < num) return str
    switch (num) {
      case 1:
        if ('か' === tail) return 'ついたち'
        break
      case 2:
        if ('か' === tail) return 'ふつか'
        break
      case 3:
        if ('か' === tail) return 'みっか'
        break
      case 4:
        if ('か' === tail) return 'よっか'
        break
      case 6:
        if ('か' === tail) return 'むいか'
        break
      case 7:
        if ('か' === tail) return 'なのか'
        break
      case 8:
        if ('か' === tail) return 'ようか'
        break
      case 10:
        switch (tail) {
          case 'つ':
            return 'とを'
          case 'たり':
            return 'とたり'
          default:
            return `とを${tail}`
        }
      case 20:
        switch (tail) {
          case 'つ':
            return 'はたち'
          case 'か':
            return 'はつか'
          default:
            return `はた${tail}`
        }
      case 30:
      case 40:
      case 50:
      case 60:
      case 70:
      case 80:
      case 90:
        if ('つ' === tail) tail = 'ぢ'
        return `${str}${tail}`
      case 99:
        return 'つくも'
      case 100:
        return 'もも'
    }
    return `${str}${tail}`
  }),
}

const _0__59 = [Array(60)].map((_, i) => i).join(' ')
export const angle = {
  basic: new DIC([], '', '', '', _0__59, '⁗ ‴ ″ ′ ° 1   ', ''),
}

/*
DOT = "・"
PLUS = "＋"
MINUS = "−"
REGEXP = /^\s*([-+])?([0-9]+)(?:\.([0-9]+))?/
WIDE_REGEXP = /^[\s　]*([-+−＋])?([0-9０１２３４５６７８９]+)(?:[\.．]([0-9０１２３４５６７８９]+))?/

*/
