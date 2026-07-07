"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOCALE_REGISTRY = exports.SCRIPT_REGISTRY = void 0;
exports.listLocales = listLocales;
exports.getLocale = getLocale;
const number_1 = require("./number");
// 言語非依存の記法カタログ(ロケールに重複登録しない)。算用数字パス
// スルーやローマ数字のように、特定言語の文法に紐づかない記法はここに
// 一度だけ登録し、暦定義側がどのロケールからでも直接参照できるように
// する(LOCALE_REGISTRY の全エントリへ重複登録すると冗長になるため)。
exports.SCRIPT_REGISTRY = {
    arabic: number_1.arabic,
    'roman-upper': number_1.roman.upper,
    'roman-lower': number_1.roman.lower,
};
exports.LOCALE_REGISTRY = {
    ja: {
        tag: 'ja',
        displayName: '日本語',
        numerals: {
            cardinal: number_1.jpn.漢字,
            'cardinal-digit': number_1.jpn.桁読み,
            'date-reading': number_1.old_jpn.rubys.語尾('か'),
            'count-reading': number_1.old_jpn.rubys.語尾('つ'),
        },
        defaultParseFormat: 'y年M月d日',
        defaultFormat: 'Gy年M月d日(E)',
    },
    en: {
        tag: 'en',
        displayName: 'English',
        numerals: {
            cardinal: number_1.english.lower,
        },
        defaultParseFormat: 'y/M/d H:m:s',
        defaultFormat: 'Gy/M/d(E) H:m:s',
    },
    ko: {
        tag: 'ko',
        displayName: '한국어',
        numerals: {
            'cardinal-sino': number_1.kor.漢語系,
            'cardinal-native': number_1.kor.固有系.基本,
            'count-reading-native': number_1.kor.固有系.助数詞前,
        },
        defaultParseFormat: 'y년 M월 d일',
        defaultFormat: 'Gy년 M월 d일(E)',
    },
};
function listLocales() {
    return Object.keys(exports.LOCALE_REGISTRY);
}
function getLocale(tag) {
    return exports.LOCALE_REGISTRY[tag];
}
//# sourceMappingURL=locale-registry.js.map