"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.angle = exports.roman = exports.english = exports.kor = exports.old_jpn = exports.jpn = exports.arabic = exports.DIC = void 0;
exports.mod = mod;
const TAIL_REQUIRED_MESSAGE = 'この数詞辞書は語尾の指定が必須です。.語尾(tail) を通してから使ってください。';
function mod(value, by) {
    return ((value % by) + by) % by;
}
class DIC {
    constructor(units1, join_str, zero_str, ...dic) {
        this.requires_tail = false;
        this.composites = new Map();
        this.units = units1;
        this.join_str = join_str;
        this.zero_str = zero_str;
        let [units, items, scales, bigs] = dic.map((o) => o.split(' '));
        const unit_str = items[1];
        const scale = scales.indexOf(unit_str);
        const tail = scales.slice(-4);
        scales[scale] = '';
        bigs.forEach(() => {
            scales = [...scales, ...tail];
        });
        const item = items.length;
        const big = item ** 4;
        this.idxs = { item, big, scale };
        this.dic = { units, items, scales, bigs };
    }
    音便(fix) {
        this.fix = fix;
        return this;
    }
    fix(_num, str, _appendix) {
        return str;
    }
    // このインスタンスは語尾(appendix)の明示が必須、と宣言する。
    // old_jpn のように音便コールバックが appendix に依存する DIC は、
    // これを呼んでおくことで .語尾() を経由しない bare 使用(appendix が
    // undefined のまま parse される)を即座に例外にできる。appendix に
    // 依存しない DIC(jpn.漢字/大字/rubys 等)はこれを呼ぶ必要がない。
    語尾必須() {
        this.requires_tail = true;
        return this;
    }
    // num にちょうど一致する完全一致の特例(慣用句的な不規則形)を登録する。
    // _calc() の桁ごとの再帰分解を経由せず、parse() の入口で直接返す。
    例外(num, word) {
        this.composites.set(num, word);
        return this;
    }
    // 語尾(tail)を確定した Numeral を返す公開ファクトリ。
    語尾(tail) {
        return new InflectedNumeral(this, tail);
    }
    parse(num, appendix) {
        if (this.requires_tail && appendix === undefined) {
            throw new Error(TAIL_REQUIRED_MESSAGE);
        }
        const tail = appendix ?? '';
        const composite = this.composites.get(num);
        if (composite !== undefined)
            return composite;
        const base = this.idxs.item;
        let gap = 0;
        let scale = 1;
        while (num * scale !== Math.floor(num * scale)) {
            gap++;
            scale *= base;
        }
        return this._calc(Math.floor(num * scale), -gap, tail);
    }
    get regex() {
        this.ensure_number_map();
        return this.number_regex;
    }
    to_number(text) {
        this.ensure_number_map();
        return this.number_map.get(text) ?? null;
    }
    ensure_number_map() {
        if (this.number_map)
            return;
        if (this.requires_tail) {
            throw new Error(TAIL_REQUIRED_MESSAGE);
        }
        const map = new Map();
        for (let num = 0; num <= 9999; num++) {
            const text = this.parse(num);
            if (text)
                map.set(text, num);
        }
        const chars = new Set([...map.keys()].join(''));
        this.number_regex = `[${[...chars].map(escape_regexp).join('')}]+`;
        this.number_map = map;
    }
    _calc(num, scale_idx, appendix) {
        let { join_str } = this;
        let left_str = '';
        let scale_str = this.dic.scales[scale_idx + this.idxs.scale];
        const base = this.idxs.item;
        const next_num = Math.floor(num / base);
        if (next_num) {
            left_str = this._calc(next_num, scale_idx + 1, appendix);
        }
        else {
            join_str = '';
            left_str = '';
        }
        const n = num % base;
        let n_str = this.dic.items[n];
        const big_idx = scale_idx % 4 || !(num % this.idxs.big) ? -1 : Math.floor(scale_idx / 4) - 1;
        const big_str = this.dic.bigs[big_idx] || '';
        switch (n) {
            case 0:
                if (left_str) {
                    n_str = '';
                }
                join_str = '';
                scale_str = '';
                break;
            case 1:
                if (0 < scale_idx) {
                    n_str = '';
                }
                break;
        }
        if (-1 < scale_idx) {
            scale_idx %= 4;
        }
        const fix = this.fix(base ** scale_idx * n, `${n_str}${scale_str}`, appendix);
        return `${left_str}${join_str}${fix}${big_str}`;
    }
}
exports.DIC = DIC;
function escape_regexp(text) {
    return text.replace(/[\^$.*+?()[\]{}|\-]/g, '\\$&');
}
// DIC.語尾(tail) が返す、屈折(語尾)を確定済みの Numeral。
// 逆引きマップ(regex/to_number)を DIC 本体の共有キャッシュとは独立に、
// この束縛済みインスタンス自身の parse() 呼び出しから構築する。これにより
// 「このインスタンスが実際に生成しうる出力だけを正しく含む」完全な逆引き
// マップが tail ごとに独立して持てる(複数の tail が1つの共有キャッシュを
// 取り合って汚染し合う事故を避ける)。
class InflectedNumeral {
    constructor(dic, tail, 
    // 既定は実用上十分な範囲。遠い未来/過去の年やユリウス日通し番号のような
    // 9999 を超えるトークンに使う場合は呼び出し側で明示的に上書きすること。
    range = 9999) {
        this.dic = dic;
        this.tail = tail;
        this.range = range;
    }
    parse(num) {
        return this.dic.parse(num, this.tail);
    }
    get regex() {
        this.ensure_number_map();
        return this.number_regex;
    }
    to_number(text) {
        this.ensure_number_map();
        return this.number_map.get(text) ?? null;
    }
    ensure_number_map() {
        if (this.number_map)
            return;
        const map = new Map();
        for (let num = 0; num <= this.range; num++) {
            const text = this.dic.parse(num, this.tail);
            if (text)
                map.set(text, num);
        }
        const chars = new Set([...map.keys()].join(''));
        this.number_regex = `[${[...chars].map(escape_regexp).join('')}]+`;
        this.number_map = map;
    }
}
// アラビア数字パススルー(何もしない処理)。特定言語の文法に紐づかない
// ため DIC を使わず、桁を素通しするだけの薄い Numeral にする。
exports.arabic = {
    parse: (num) => `${num}`,
    regex: '[0-9]+',
    to_number: (text) => {
        const n = Number(text);
        return Number.isFinite(n) ? n : null;
    },
};
// 桁表現文字の入る漢字表記(桁列挙、例: 2024→二〇二四)。位取り記法
// (十三、DIC._calc() の再帰)とは別のアルゴリズムで、西暦の4桁年のように
// 桁を独立に読み下し位取りしない表記。english/roman と同様 DIC を
// 継承しない薄い実装にする。
function digitwise(items) {
    const to_digit = new Map(items.map((ch, idx) => [ch, idx]));
    return {
        parse(num) {
            if (!Number.isFinite(num) || num !== Math.floor(num))
                return `${num}`;
            return Math.abs(num)
                .toString()
                .split('')
                .map((d) => items[Number(d)])
                .join('');
        },
        regex: `[${items.map(escape_regexp).join('')}]+`,
        to_number(text) {
            let digits = '';
            for (const ch of text) {
                const digit = to_digit.get(ch);
                if (digit === undefined)
                    return null;
                digits += digit;
            }
            return digits ? Number(digits) : null;
        },
    };
}
exports.jpn = {
    漢字: new DIC([12, 2, 2, 2, 2, 0.1], '', '余', '打 対 番 足 双 割', '〇 一 二 三 四 五 六 七 八 九', '清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 一 十 百 千', '万 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数').音便((num, str, _appendix) => {
        switch (num) {
            case 20:
                return '廿';
            case 30:
                return '丗';
            case 40:
                return '卌';
            default:
                return str;
        }
    }),
    大字: new DIC([12, 2, 2, 2, 2, 0.1], '', '余', '打 対 番 足 双 割', '零 壱 弐 参 肆 伍 陸 漆 捌 玖', '清浄 虚空 六徳 刹那 弾指 瞬息 須臾 逡巡 模糊 漠 渺 埃 塵 沙 繊 微 忽 糸 毛 厘 分 壱 拾 佰 阡', '萬 億 兆 京 垓 𥝱 穣 溝 澗 正 載 極 恒河沙 阿僧祇 那由他 不可思議 無量大数'),
    rubys: new DIC([12, 2, 2, 2, 2, 0.1], '', '', 'だーす つい つがい そく そう わり', 'れい いち に さん よん ご ろく なな はち きゅう', 'せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ いち じゅう ひゃく せん', 'まん おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう').音便((num, str, _appendix) => {
        switch (num) {
            case 300:
                return 'さんびゃく';
            case 600:
                return 'ろっぴゃく';
            case 800:
                return 'はっぴゃく';
            case 3000:
                return 'さんぜん';
            case 8000:
                return 'はっせん';
            default:
                return str;
        }
    }),
    桁読み: digitwise('〇 一 二 三 四 五 六 七 八 九'.split(' ')),
};
exports.old_jpn = {
    rubys: new DIC([12, 2, 2, 2, 2, 0.1], 'まり', '', 'だーす つい つがい そく そう わり', 'れい ひと ふた み よ いつ む なな や ここの', 'せいじょう こくう りっとく せつな だんし しゅんそく しゅゆ しゅんじゅん もこ ばく びょう あい じん しゃ せん び こつ し もう りん ぶ ひと そ ほ ち', 'よろづ おく ちょう けい がい じょ じょう こう かん せい さい ごく ごうがしゃ あそうぎ なゆた ふかしぎ むりょうたいすう')
        .音便((num, str, tail = 'つ') => {
        if (!str)
            return '';
        if (num < 1)
            return str;
        if (100 < num)
            return str;
        switch (num) {
            case 1:
                if ('か' === tail)
                    return 'ついたち';
                break;
            case 2:
                if ('か' === tail)
                    return 'ふつか';
                break;
            case 3:
                if ('か' === tail)
                    return 'みっか';
                break;
            case 4:
                if ('か' === tail)
                    return 'よっか';
                break;
            case 6:
                if ('か' === tail)
                    return 'むいか';
                break;
            case 7:
                if ('か' === tail)
                    return 'なのか';
                break;
            case 8:
                if ('か' === tail)
                    return 'ようか';
                break;
            case 10:
                switch (tail) {
                    case 'つ':
                        return 'とを';
                    case 'たり':
                        return 'とたり';
                    default:
                        return `とを${tail}`;
                }
            case 20:
                switch (tail) {
                    case 'つ':
                        return 'はたち';
                    case 'か':
                        return 'はつか';
                    default:
                        return `はた${tail}`;
                }
            case 30:
            case 40:
            case 50:
            case 60:
            case 70:
            case 80:
            case 90:
                if ('つ' === tail)
                    tail = 'ぢ';
                return `${str}${tail}`;
            case 100:
                return 'もも';
        }
        return `${str}${tail}`;
    })
        // 99(つくも、付喪神の由来)は _calc() が数値を桁ごとに再帰分解する
        // 構造上、複合値である99が fix() に直接渡ることが無く、音便コールバック
        // の case として書いても永久に到達不能だった。完全一致の例外として
        // 登録し、parse() の入口で _calc()/fix() を経由せず直接返す。
        .例外(99, 'つくも')
        // old_jpn の音便は appendix(語尾)によって出力が変わる(「か」なら
        // 日付読み、既定は「つ」相当の汎用計数読み)。appendix を省略すると
        // 音便コールバック自身の既定値(tail='つ')は発動せず(呼び出し時に
        // undefined ではなく '' が渡ると想定した既存の抜け穴)、「ひとつ」の
        // はずが「ひと」のような欠落した読みになる。bare 使用を黙って通す
        // のではなく、.語尾() を経由しない呼び出しを例外にする。
        .語尾必須(),
};
// 韓国語の数詞は漢語系(일이삼…)と固有系(하나둘셋…)の2系統が並立し、
// どちらを使うかは文脈(語)で固定される(時=固有系、分/日付=漢語系等)。
// 漢語系は日本語の jpn.漢字 と同型の万進位取り構造を持つが、DIC の
// scales/bigs には(暦用途では使わない)分厘毛糸等の細かい端数の
// 固有語彙まで正確に埋める必要があり、そこを誤って実装するリスクが
// あるため、暦での実用範囲(0〜9999)に絞った薄い専用実装にする。
// 固有系は 20 までの語根が不規則(二十=스물のように十の倍数を掛け算では
// 作れない)なため、そもそも DIC の再帰エンジンに乗らない。
// いずれも regex/to_number(逆引き)は未実装(format 方向のみ)。
const KOREAN_SINO_DIGITS = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
const KOREAN_SINO_SCALES = ['', '십', '백', '천'];
function sino_korean(num) {
    if (!Number.isFinite(num) || num !== Math.floor(num))
        return `${num}`;
    if (num === 0)
        return '영';
    if (num < 0 || 9999 < num)
        return `${num}`;
    const digits = String(num).padStart(4, '0').split('').map(Number);
    let result = '';
    for (let i = 0; i < 4; i++) {
        const digit = digits[i];
        const place = 3 - i;
        if (!digit)
            continue;
        const digit_str = digit === 1 && 0 < place ? '' : KOREAN_SINO_DIGITS[digit];
        result += digit_str + KOREAN_SINO_SCALES[place];
    }
    return result;
}
const KOREAN_NATIVE_ONES = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'];
const KOREAN_NATIVE_ONES_COUNTED = [
    '',
    '한',
    '두',
    '세',
    '네',
    '다섯',
    '여섯',
    '일곱',
    '여덟',
    '아홉',
];
const KOREAN_NATIVE_TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
const KOREAN_NATIVE_TENS_COUNTED = [
    '',
    '열',
    '스무',
    '서른',
    '마흔',
    '쉰',
    '예순',
    '일흔',
    '여든',
    '아흔',
];
// counted: 助数詞(개/명/시 等)の直前で使う縮約形。조사한 範囲では
// 하나→한/둘→두/셋→세/넷→네/스물→스무 の5語だけが縮約し、他の十の位
// (서른/마흔/쉰/예순/일흔/여든/아흔)は縮約しない。縮約するのは常に
// 「助数詞の直前に来る最後の語」(一の位が非ゼロならその語、ゼロなら
// 十の位の語)。
function native_korean(num, counted) {
    if (!Number.isFinite(num) || num !== Math.floor(num))
        return `${num}`;
    if (num === 0)
        return '영';
    if (num < 0 || 99 < num)
        return `${num}`;
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    if (!ones) {
        return counted ? KOREAN_NATIVE_TENS_COUNTED[tens] : KOREAN_NATIVE_TENS[tens];
    }
    const tens_str = tens ? KOREAN_NATIVE_TENS[tens] : '';
    const ones_str = counted ? KOREAN_NATIVE_ONES_COUNTED[ones] : KOREAN_NATIVE_ONES[ones];
    return tens_str + ones_str;
}
exports.kor = {
    漢語系: { parse: sino_korean },
    固有系: {
        // 助数詞を伴わない素の計数(例: 番号として1,2,3…と数える)
        基本: { parse: (num) => native_korean(num, false) },
        // 助数詞の直前で使う縮約形(例: 한 개, 두 명, 스무 살)
        助数詞前: { parse: (num) => native_korean(num, true) },
    },
};
const ENGLISH_ONES = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
];
const ENGLISH_TENS = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
];
function englishize(num) {
    if (!Number.isFinite(num) || num !== Math.floor(num))
        return `${num}`;
    if (num < 0 || 999999 < num)
        return `${num}`;
    const underThousand = (value) => {
        if (value < 20)
            return ENGLISH_ONES[value];
        if (value < 100) {
            const tail = value % 10;
            return tail
                ? `${ENGLISH_TENS[Math.floor(value / 10)]}-${ENGLISH_ONES[tail]}`
                : ENGLISH_TENS[value / 10];
        }
        const tail = value % 100;
        return tail
            ? `${ENGLISH_ONES[Math.floor(value / 100)]} hundred ${underThousand(tail)}`
            : `${ENGLISH_ONES[value / 100]} hundred`;
    };
    if (num < 1000)
        return underThousand(num);
    const tail = num % 1000;
    const head = `${underThousand(Math.floor(num / 1000))} thousand`;
    return tail ? `${head} ${underThousand(tail)}` : head;
}
function english_to_number(text) {
    const words = text
        .toLowerCase()
        .split(/[\s-]+/)
        .filter(Boolean);
    if (!words.length)
        return null;
    const ones = new Map(ENGLISH_ONES.map((word, index) => [word, index]));
    const tens = new Map(ENGLISH_TENS.flatMap((word, index) => word ? [[word, index * 10]] : []));
    let total = 0;
    let current = 0;
    for (const word of words) {
        if (ones.has(word)) {
            current += ones.get(word);
            continue;
        }
        if (tens.has(word)) {
            current += tens.get(word);
            continue;
        }
        if (word === 'hundred') {
            current *= 100;
            continue;
        }
        if (word === 'thousand') {
            total += current * 1000;
            current = 0;
            continue;
        }
        return null;
    }
    return total + current;
}
const ROMAN_TABLE = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
];
function romanize(num) {
    if (!Number.isFinite(num) || num < 1 || num !== Math.floor(num))
        return `${num}`;
    let rest = num;
    let text = '';
    for (const [value, glyph] of ROMAN_TABLE) {
        while (value <= rest) {
            text += glyph;
            rest -= value;
        }
    }
    return text;
}
function roman_to_number(text) {
    if (!/^[ivxlcdm]+$/i.test(text))
        return null;
    let rest = text.toUpperCase();
    let total = 0;
    for (const [value, glyph] of ROMAN_TABLE) {
        while (rest.startsWith(glyph)) {
            total += value;
            rest = rest.slice(glyph.length);
        }
    }
    return rest ? null : total;
}
// 数詞語彙だけに一致する正規表現を作る(以前は [A-Za-z]+ で英字列を
// 無条件に飲み込んでいたため、同じ format 文字列内の元号名・曜日名等
// 他の英字トークンと衝突しうる不具合があった)。先頭文字だけ大小両対応に
// する(englishize()/title 版はいずれも先頭大文字化のみで、2文字目以降は
// 変化しないため)。'seven' が 'seventeen' の接頭辞になるなど、短い語が
// 長い語の一部になるケースがあるため、長い語から順に試すよう長さ降順で
// 並べる(alternation は左から順に最初に一致したものを採用するため)。
function case_insensitive_head(word) {
    return `[${word[0].toUpperCase()}${word[0].toLowerCase()}]${word.slice(1)}`;
}
const ENGLISH_WORD_PATTERN = [...ENGLISH_ONES, ...ENGLISH_TENS, 'hundred', 'thousand']
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(case_insensitive_head)
    .join('|');
const ENGLISH_REGEX = `(?:${ENGLISH_WORD_PATTERN})(?:[- ](?:${ENGLISH_WORD_PATTERN}))*`;
exports.english = {
    lower: { parse: englishize, regex: ENGLISH_REGEX, to_number: english_to_number },
    title: {
        parse: (num) => englishize(num).replace(/\b\w/g, (char) => char.toUpperCase()),
        regex: ENGLISH_REGEX,
        to_number: english_to_number,
    },
};
exports.roman = {
    upper: { parse: romanize, regex: '[IVXLCDM]+', to_number: roman_to_number },
    lower: {
        parse: (num) => romanize(num).toLowerCase(),
        regex: '[ivxlcdm]+',
        to_number: roman_to_number,
    },
};
const _0__59 = [Array(60)].map((_, i) => i).join(' ');
exports.angle = {
    basic: new DIC([], '', '', '', _0__59, '⁗ ‴ ″ ′ ° 1   ', ''),
};
/*
DOT = "・"
PLUS = "＋"
MINUS = "−"
REGEXP = /^\s*([-+])?([0-9]+)(?:\.([0-9]+))?/
WIDE_REGEXP = /^[\s　]*([-+−＋])?([0-9０１２３４５６７８９]+)(?:[\.．]([0-9０１２３４５６７８９]+))?/

*/
//# sourceMappingURL=number.js.map