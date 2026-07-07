# 数詞ライブラリ設計案

この文書は、`src/number.ts` の `DIC`/`Numeral` 基盤を、将来 fancy-date から独立した多言語数詞ライブラリとして切り出すことを見据えた設計案をまとめる。背景の調査経緯(CLDR/スラブ語/アラビア語/スワヒリ語/日本語/韓国語の数詞一致(agreement)体系調査、appendix配線の設計変遷)は [README](../README.md) の「今後の検討メモ」に記録済み。この文書はそれらの調査結果を実装可能な形に整理したものであり、調査の生の記録は README 側を正とする。

## 1. 目的とスコープ

- fancy-date の暦トークンをテキスト化する「数値表現」の基盤(`DIC`/`Numeral`)を、暦以外の用途にも耐える標準ライブラリの顔に整えたい。
- ただし今回のスコープは**暦での実用**に閉じる。大字(壱弐参…)や巨大数の命数法(万進/万万進境界、恒河沙・阿僧祇等)は、調査の結果「日付表示には無関係(レッドヘリング)」と判明しているため、極端な年号(例: 巨大数を要する架空の暦)を除いては対象外とする。
- インターフェース(`Numeral` 型)そのものは変更しない。豊かさは「兄弟バリアントを増やす」「上に薄い合成・登録レイヤーを足す」で実現する、という既存の結論を踏襲する。

## 2. 基本契約: `Numeral` インターフェース(変更なし)

```ts
export type Numeral = {
  parse(num: number): string
  regex?: string
  to_number?(text: string): number | null
}
```

`parse` はもはや `appendix` 引数を取らない。文脈(助数詞・格・性・名詞クラス等)は呼び出し時ではなく、各言語モジュールが独自に用意する**屈折ファクトリ**で構築時に一度だけ確定する(次項)。

## 3. 屈折ファクトリの命名方針

当初 `bind(appendix): Numeral` を検討したが、`Function.prototype.bind`(引数の部分適用による `this`/引数の固定という汎用 JS 機構)を強く連想させ、実態(文脈に応じた語形変化の選択)とズレるため却下した。

`DIC` は現状**日本語専用**のエンジンである(`jpn`/`old_jpn` にしか使われておらず、`english`/`roman`/`angle` は独自実装)。屈折ファクトリは `Numeral` インターフェースの必須メソッドではなく**各言語モジュールが自分の文法用語で命名してよい非公開の実装詳細**、という結論は既に確定しているので、`DIC` には日本語の文法用語をそのまま採用する:

```ts
class DIC {
  // 内部にだけ appendix(接尾辞・助数詞相当)を取る非公開メソッドを持つ
  private _parse_with_tail(num: number, tail: string): string { /* 既存の parse() 本体 */ }

  // 公開ファクトリ: 「か」「つ」「たり」等の語尾(tail)を確定した Numeral を返す
  語尾(tail: string): Numeral {
    return {
      parse: (num: number) => this._parse_with_tail(num, tail),
      regex: this.regex,
      to_number: (text: string) => this.to_number(text),
    }
  }

  // 語尾を指定しない場合(既定 tail='')は DIC 自身がそのまま Numeral を満たす
  parse(num: number): string {
    return this._parse_with_tail(num, '')
  }
}

old_jpn.rubys.語尾('か')   // → Numeral、parse(20) === 'はつか'
```

`語尾` はコード内部の変数名 `tail` の直訳であり、既存の `.音便(fix)` のように言語学用語をメソッド名に採用してきた前例とも一貫する。将来スラブ語の格変化を実装する場合は `.格変化(case)`、アラビア語の性の極性なら `.極性(gender)`、スワヒリ語の名詞クラス一致なら `.一致(nounClass)` のように、**言語ごとに実態に即した名前を独自に選んでよい**——共有インターフェースの契約にはしない。

`english.lower`/`roman.upper` のような語尾(tail)を持たない実装は、このファクトリを持つ必要がなく、素の object literal のまま `Numeral` を満たし続ける。

## 4. 完全往復保証

`to_number(parse(num)) === num` を、屈折確定済みの各 `Numeral` について常に成り立たせることを目標とする。

現状の `ensure_number_map()` は `appendix=''` 固定で構築され `DIC` 側の共有キャッシュに乗るため、「はつか」等の逆引きが失敗するだけでなく、複数の語尾が同じ `DIC` の共有キャッシュを取り合う潜在的な事故(先に呼ばれた語尾のマップが後続を汚染する)も抱えている。

修正方針: 逆引きマップの構築・キャッシュを `DIC` から追い出し、`語尾()` が返す屈折確定済みラッパー(`InflectedNumeral`)がそれぞれ**自分自身の `parse()` を呼んで**マップを構築する。

```ts
class InflectedNumeral implements Numeral {
  private number_map?: Map<string, number>
  private number_regex?: string
  constructor(
    private dic: DIC,
    private tail: string,
    private range = 9999,
  ) {}

  parse(num: number): string {
    return this.dic.parse(num, this.tail)
  }

  get regex(): string {
    this.ensure_number_map()
    return this.number_regex!
  }

  to_number(text: string): number | null {
    this.ensure_number_map()
    return this.number_map!.get(text) ?? null
  }

  private ensure_number_map() {
    if (this.number_map) return
    const map = new Map<string, number>()
    for (let num = 0; num <= this.range; num++) {
      const text = this.dic.parse(num, this.tail)
      if (text) map.set(text, num)
    }
    const chars = new Set([...map.keys()].join(''))
    this.number_regex = `[${[...chars].map(escape_regexp).join('')}]+`
    this.number_map = map
  }
}
```

これにより「屈折確定済みインスタンスごとに、そのインスタンスが実際に生成しうる出力だけを正しく含む完全な逆引きマップを持つ」ことが構造的に保証される。`old_jpn.rubys` の全語尾(`''`/`つ`/`か`/`たり`/`日`)について実際にコードを実行し、0〜130の範囲で衝突がないことを実証済み——**完全往復は現状のテーブルで数学的に達成可能で、これまでの失敗は設計上の抜け穴であって言語的な曖昧さではない**。

今後追加されるあらゆる屈折済みバリアントについて、機械的に検証する共通テストヘルパー(`assertRoundTrips(numeral, label, { min, max, exempt })`)を導入し、「はつか」のように個別のケースが検証から漏れる事態を、屈折確定済みインスタンス単位でのテスト網羅により構造的に防ぐ。

## 5. `つくも`(99)デッドコードの修正

**原因**: `DIC._calc()` は数値を桁ごとに再帰分解し、`fix()`(音便コールバック)には常に「単一桁 × 基数のべき乗」の値(0-9, 10, 20…90, 100, 200…900, …)しか渡らない。複合値である99が `fix()` に直接渡ることは構造的に無いため、`old_jpn.rubys` の `case 99: return 'つくも'` は永久に到達不能。実際に `parse(99, 'つ')` は「ここのそぢまりここのつ」(90+9の合成)を返す。

**修正方針**: `_calc()` の再帰そのものは変更せず、`DIC` に「完全一致の特例上書きテーブル」を追加し、`parse()` の先頭で再帰に入る前にチェックする。

```ts
class DIC {
  private composites = new Map<number, string>()

  例外(num: number, str: string) {
    this.composites.set(num, str)
    return this
  }

  parse(num: number, appendix: string): string {
    const override = this.composites.get(num)
    if (override !== undefined) {
      return this.fix(num, override, appendix)
    }
    // ...既存の _calc() 呼び出し
  }
}

old_jpn.rubys.例外(99, '')   // fix(99, '', appendix) が呼ばれ、
                              // 音便コールバックの case 99 が
                              // 初めて到達可能になり 'つくも' を返す
```

`100`(もも)は既存の桁再帰(百の位の寄与)で自然に到達できるため対象外。この例外テーブルは**完全一致のみ**を扱い、複合下二桁への一般化(199→「百つくも」等)はしない——`old_jpn` の音便コールバック自体が `if (100 < num) return str` で不規則形の対象を100以下に限定しており、99という特定の数への慣用句(付喪神の由来となった「九十九」)を再現する以上の一般化は史実的裏付けを欠くため、意図的にスコープ外とする。

`InflectedNumeral` の逆引きマップ構築(`dic.parse(num, tail)` をループで呼ぶだけ)はこの変更を自動的に反映するため、`つくも→99` の逆引きも追加コード無しで正しく成立する。

## 6. 日本語数詞パターンの整理と `number.ts` への反映

暦での実用に絞って調査した結果、日本語の数詞表現だけでも次の5パターンが識別された。それぞれの `number.ts` 上の対応を整理する。

| # | パターン | 例 | 対応 |
|---|---|---|---|
| 1 | アラビア数字表記(何もしない処理) | `13` | 新規 `export const arabic: Numeral`(桁を素通しするだけ、後述) |
| 2 | 位取り記法の漢字表記 | 十三 | 既存 `jpn.漢字`/`jpn.大字`(変更不要) |
| 3 | 桁表現文字の入る漢字表記(桁列挙) | 二〇二四 | 新規 `jpn.桁読み`(後述) |
| 4 | 日付の読み仮名 | はつか、ついたち | `old_jpn.rubys.語尾('か')` |
| 5 | 日付以外の読み仮名 | ひとつ、いち | `old_jpn.rubys.語尾('つ')` または `jpn.rubys` |

**パターン1(アラビア数字/何もしない)**: `.numeral()` を設定しない場合の `format_number()` の既定動作(ゼロ埋めした算用数字)と実質同じだが、ロケール登録簿(7節)の中で明示的に選べる項目として名前を与える価値がある。

```ts
export const arabic: Numeral = {
  parse: (num) => `${num}`,
  regex: '[0-9]+',
  to_number: (text) => {
    const n = Number(text)
    return Number.isFinite(n) ? n : null
  },
}
```

**パターン3(桁列挙、二〇二四)**: 「軸C: 位取り表記 vs 桁列挙表記」(README参照)で識別済みの最優先実装候補。`DIC._calc()` の位取り再帰は再利用できないため、`english`/`roman` と同様に `DIC` を継承しない、桁ごとに `jpn.漢字` の `items` 辞書を引くだけの薄い実装にする。

```ts
function digitwise(num: number, items: readonly string[]): string {
  if (!Number.isFinite(num) || num !== Math.floor(num)) return `${num}`
  return Math.abs(num).toString().split('').map((d) => items[Number(d)]).join('')
}
```

**パターン4/5**: 前節までで設計済みの `old_jpn.rubys.語尾('か' | 'つ')` をそのまま使う。

**大字・巨大数について**: 暦での利用を目的にすると、極端な年号を除いてはすぐに必要にならないと判断し、今回は現状維持(`jpn.大字` は既存のまま、命数法の万進/万万進境界や仏教超大数の実装拡張は行わない)。

## 7. 英語・ローマ数字・韓国語(ハングル)の追加/修正

- **英語**: `english.lower`/`english.title` に完全往復保証のテスト(`assertRoundTrips`)を後追いで追加する。アーキテクチャ変更は不要(元々語尾を持たない実装のため)。
- **ローマ数字**: 時計の文字盤はローマ数字表示の定番用途なので、`roman.upper` を時トークンに割り当てるサンプル(既存の「Romulus暦に `roman.upper` を割り当てる」提案とは別に、12時間制の時トークンをローマ数字で表示するクロックフェース的なサンプル)を実装候補として追加する。
- **韓国語(ハングル)は「わりと固定的で対応しやすい」という見立てが妥当**: 調査結果(README「多言語数詞の一致体系の調査」参照)によれば、
  - **漢語系数詞**(일/이/삼…)は日本語の `jpn.漢字` と同型の万進再帰構造を持つため、**既存の `DIC` エンジンをそのまま再利用**でき、辞書(単位/桁/位)をハングルの語彙に差し替えるだけで済む。新しいメカニズムは不要。
  - **固有数詞**(하나/둘/셋…)は助数詞の前で縮約形(하나→한、둘→두、셋→세、넷→네、스물→스무)になる現象を持つが、これは `old_jpn` の音便コールバックと同型の「`fix(num, str, tail)` で特定の数値だけ特殊形を返す」仕組みでそのまま表現できる。
  - どちらの体系を使うかは**トークン単位で固定**(時=固有数詞、分=漢語数詞、日付=常に漢語数詞)であることは既に確認済みで、呼び出しごとに切り替える必要はない。
  - 結論: **新規アーキテクチャは一切不要**。2つの `DIC` インスタンス(漢語系・固有系)を追加し、ロケール登録簿(次節)の `ko` エントリへトークンごとに割り当てるだけで実装できる見込み。

## 8. ロケール登録簿(Locale Registry)のフォーマット

言語表現が変わると数詞だけでなく、年月日時分秒の**既定パース書式・既定表示書式**も変わるべき、という指摘に基づき、数詞と書式既定値をまとめて発見できる登録簿を設計する。

### 設計方針

- 登録簿が持つのは「その言語・地域で使える数詞の選択肢と、書式の既定値」という**カタログ**であり、「どの暦トークンにどの数詞を割り当てるか」という配線は暦定義側(呼び出し側)の責務として明確に分離する(2つの層を混ぜない、という既存の結論を踏襲)。
- 数詞は「日付用の読み」「桁列挙用」のような**意味役割(purpose)**をキーにして引けるようにする。役割名は固定の enum ではなく緩やかな慣習(文字列)とし、言語ごとに必要な役割を自由に追加できるようにする(アラビア語なら性別ごと、スワヒリ語なら名詞クラスごとに役割が増えることが調査で分かっているため、閉じた enum にすると窮屈になる)。
- タグは BCP-47 に緩く着想を得るが、厳密な準拠は求めない(`ja`、`ja-old`、`en`、`ko`、`ar` 等の軽量なタグで十分)。

```ts
type NumeralPurpose = string   // 慣習的な役割名。例: 'cardinal' | 'cardinal-digit' | 'date-reading' | 'count-reading' | 'passthrough' | 'ordinal' など

type LocaleEntry = {
  tag: string                              // 例: 'ja', 'ja-old', 'en', 'ko', 'ar'
  displayName: string                      // 人間向け表示名
  numerals: Partial<Record<NumeralPurpose, Numeral>>
  defaultParseFormat: string               // 例: 'y年M月d日 H時m分s秒'
  defaultFormat: string                    // 例: 'Gy年M月d日(E)H時m分s秒'
  labels?: Record<string, string>          // span の fallback 単位表記の既定値(.labels() 相当)
}

export const LOCALE_REGISTRY: Record<string, LocaleEntry> = {
  ja: {
    tag: 'ja',
    displayName: '日本語',
    numerals: {
      passthrough: arabic,
      cardinal: jpn.漢字,
      'cardinal-digit': jpn.桁読み,
      'date-reading': old_jpn.rubys.語尾('か'),
      'count-reading': old_jpn.rubys.語尾('つ'),
    },
    defaultParseFormat: 'y年M月d日',
    defaultFormat: 'Gy年M月d日(E)',
  },
  en: {
    tag: 'en',
    displayName: 'English',
    numerals: {
      passthrough: arabic,
      cardinal: english.lower,
      ordinal: english.ordinal,   // 未実装。将来追加
      roman: roman.upper,          // 言語というよりスクリプト寄りだが、
                                    // 参照の便宜上 en エントリにも載せる
    },
    defaultParseFormat: 'y/M/d H:m:s',
    defaultFormat: 'Gy/M/d(E) H:m:s',
  },
  ko: {
    tag: 'ko',
    displayName: '한국어',
    numerals: {
      passthrough: arabic,
      'cardinal-sino': kor.漢語系,   // 未実装。既存 DIC エンジンの辞書差し替えで実現見込み
      'cardinal-native': kor.固有系, // 未実装。音便同型の縮約規則で実現見込み
    },
    defaultParseFormat: 'y년 M월 d일',
    defaultFormat: 'Gy년 M월 d일(E)',
  },
}
```

### アンカー(暦の基準文字列)との関係

`.calendar([anchorString, formatString, epoch])` の `anchorString` は、その暦が使う数詞・書式と一致していなければ解釈できない。これは登録簿に**別フィールドを設けるのではなく**、`defaultParseFormat`/`defaultFormat` を一貫して選べば自然に解決する——アンカー文字列は「その暦の既定書式で書かれた1つの具体例」に過ぎないため、書式の既定値さえロケールごとに正しく持てば、アンカー文字列側で特別な配慮は不要という整理にした。

### 発見可能性(ロケール登録の探索)

```ts
export function listLocales(): string[] {
  return Object.keys(LOCALE_REGISTRY)
}
export function getLocale(tag: string): LocaleEntry | undefined {
  return LOCALE_REGISTRY[tag]
}
```

`Object.keys`/専用ヘルパーのどちらでも列挙できる、`export *` のtslibバンドル非互換性(README既述)を踏まえて named export ベースで設計する。

### 暦側の配線例(イメージ)

```ts
const locale = getLocale('ja')!
new FancyDate()
  .calendar([locale.defaultParseFormat, ...])
  .numeral({
    d: locale.numerals['date-reading'],
    y: locale.numerals['cardinal'],
  })
  .labels(locale.labels ?? {})
  .init()
```

「どのトークンにどの役割の数詞を割り当てるか」は暦定義側が明示的に選ぶ——登録簿はあくまでカタログであり、勝手にトークンへ配線しない。

## 9. 引き続き対象外・据え置きの項目

- スラブ語の格変化・アラビア語の性の極性・スワヒリ語の名詞クラス一致は、**アーキテクチャ(bind-time方式・語尾ファクトリ)が対応可能であることは調査で実証済み**だが、具体的な語彙・文法テーブルの実装は今回のスコープ外(需要が出た時点で着手する)。
- 大字・命数法の万進/万万進境界・仏教超大数は、暦用途では優先度が低いと判断し、現状維持のまま据え置く。
- `english.ordinal`(three→third)は本文書中で参照のみ行い、実装はまだ行っていない。
- `kor.漢語系`/`kor.固有系` は設計方針のみで、DICインスタンスの実装自体はまだ行っていない。

## 10. 実装順序の目安

1. `DIC` に `語尾()`/`例外()` を追加し、`つくも` の到達可能性を修正(5節)。
2. `InflectedNumeral` ラッパーと `assertRoundTrips` テストヘルパーを追加し、`old_jpn.rubys` の全語尾で完全往復を検証(4節)。
3. `arabic`/`jpn.桁読み` を追加(6節)。
4. `LOCALE_REGISTRY`(`ja`/`en` のみ、まず2言語)を追加し、既存サンプル暦を `.numeral()` の per-token map 経由で書き換える。
5. ローマ数字クロックフェース・サンプルを追加。
6. 韓国語(`kor.漢語系`/`kor.固有系`)と `LOCALE_REGISTRY.ko` を追加。
