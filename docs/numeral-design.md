# 数詞ライブラリ設計案(実装済み)

この文書は、`src/number.ts` の `DIC`/`Numeral` 基盤を、将来 fancy-date から独立した多言語数詞ライブラリとして切り出すことを見据えた設計案をまとめる。背景の調査経緯(CLDR/スラブ語/アラビア語/スワヒリ語/日本語/韓国語の数詞一致(agreement)体系調査、appendix配線の設計変遷)は [development-notes.md](development-notes.md) に記録済み。この文書はそれらの調査結果を実装可能な形に整理したものであり、調査の生の記録は development-notes.md 側を正とする。

セルフレビューを経て、初版から次の点を修正している: `DIC.parse()` の引数分割・`InflectedNumeral` との型不整合の解消、`old_jpn.rubys` を bare 使用した際に壊れた値を返す潜在バグの発見と「例外を投げる」方式での修正、`つくも`(99)修正の簡素化、ロケール登録簿の配線例を実在の `.lang()`/`.calendar()` シグネチャに合わせる修正、`arabic`/`roman` のロケール非依存化。

**この設計は 3〜8 節・10 節の該当箇所を実装済み**(`src/number.ts`・`src/locale-registry.ts`・`src/sample/calendars.ts` の `RomanClock`・平気法・定気法、`__tests__/number-roundtrip-spec.js`・`__tests__/locale-spec.js`・`__tests__/heikihou-numeral-spec.js`)。以下、各節の本文には実装済みの箇所に「(実装済み)」を付記する。実装時に見つかった追加の修正点(`ensure_number_map()` の逆引きキャッシュを appendix に依存しない DIC 向けに残す判断、`y` 専用の `numeral_label()` の追加など)も反映済み。

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

## 3. 屈折ファクトリの命名方針とbare使用の事故防止(実装済み)

当初 `bind(appendix): Numeral` を検討したが、`Function.prototype.bind`(引数の部分適用による `this`/引数の固定という汎用 JS 機構)を強く連想させ、実態(文脈に応じた語形変化の選択)とズレるため却下した。

`DIC` は現状**日本語専用**のエンジンである(`jpn`/`old_jpn` にしか使われておらず、`english`/`roman`/`angle` は独自実装)。屈折ファクトリは `Numeral` インターフェースの必須メソッドではなく**各言語モジュールが自分の文法用語で命名してよい非公開の実装詳細**、という結論は既に確定しているので、`DIC` には日本語の文法用語をそのまま採用する。

`DIC.parse(num: number, appendix?: string): string` は appendix を省略可能な既存の2引数のままでよい(TypeScript の構造的型付けにより、2引数目が省略可能な関数は `Numeral.parse(num): string` を満たす)。appendix を渡さず bare で呼んだ場合、`DIC` 内部では `appendix` が **`undefined`** になる、という点が次のバグ修正の鍵になる。

### bare 使用の事故防止(語尾必須の強制)

セルフレビューで見つかった潜在バグ: `old_jpn.rubys` の音便コールバックは `tail = 'つ'` という既定値を持つが、これは呼び出し時に `tail` が **`undefined`** のときにしか働かない。ところが `DIC.parse(num, appendix)` の `appendix` を省略した場合に何を渡すか(空文字列 `''` にするのか `undefined` のまま渡すのか)によって挙動が変わる。もし内部で `''` にすり替えてしまうと、`old_jpn.rubys` の音便コールバックの既定値(`'つ'`)は発動せず、`old_jpn.rubys.parse(1)` のような `.語尾()` を経由しない bare 呼び出しは「ひとつ」ではなく「ひと」(末尾の「つ」が欠落した壊れた読み)を返してしまう。`jpn.漢字`/`大字`(音便コールバックが appendix を無視する)では無害だが、`old_jpn` では実際に踏むと壊れる。

これを黙って壊れた値で通すのではなく、**`old_jpn.rubys` のように「語尾の指定が必須」なインスタンスは bare 使用時に例外を投げる**。fancy-date が既に持つ「計算に入る前に例外を投げる」という防御的な設計方針(NaN/Infinity の入力値検証と同じ考え方)に合わせる。

```ts
class DIC {
  private requires_tail = false

  // 「このインスタンスは語尾の明示が必須」と宣言する
  語尾必須() {
    this.requires_tail = true
    return this
  }

  // 語尾(tail)を確定した Numeral を返す公開ファクトリ
  語尾(tail: string): Numeral {
    return new InflectedNumeral(this, tail) // InflectedNumeral の実装は4節
  }

  parse(num: number, appendix?: string): string {
    if (this.requires_tail && appendix === undefined) {
      throw new Error(
        'この数詞辞書は語尾の指定が必須です。.語尾(tail) を通してから使ってください。',
      )
    }
    const tail = appendix ?? ''
    // ...tail を使って既存の _calc() を呼ぶ
  }
}

export const old_jpn = {
  rubys: new DIC(/* ... */)
    .音便((num, str, tail = 'つ') => {
      /* 既存の switch */
    })
    .語尾必須(),
}

old_jpn.rubys.語尾('か') // → Numeral、parse(20) === 'はつか'
old_jpn.rubys.parse(1) // → 例外: 語尾の指定が必須です
```

`InflectedNumeral.parse()`(4節)は常に `this.tail`(文字列)を明示的に渡すため、この例外を踏むことはない。例外が発生するのは `old_jpn.rubys` を `.語尾()` を通さず bare で `.numeral()` 等に渡してしまった場合のみ。`jpn.漢字`/`大字`/`rubys` のように appendix に依存しない DIC は `語尾必須()` を呼ばず、これまで通り bare でも安全に使える。

`語尾` はコード内部の変数名 `tail` の直訳であり、既存の `.音便(fix)` のように言語学用語をメソッド名に採用してきた前例とも一貫する。将来スラブ語の格変化を実装する場合は `.格変化(case)`、アラビア語の性の極性なら `.極性(gender)`、スワヒリ語の名詞クラス一致なら `.一致(nounClass)` のように、**言語ごとに実態に即した名前を独自に選んでよい**——共有インターフェースの契約にはしない。

`english.lower`/`roman.upper` のような語尾(tail)を持たない実装は、このファクトリを持つ必要がなく、素の object literal のまま `Numeral` を満たし続ける。

## 4. 完全往復保証(実装済み)

`to_number(parse(num)) === num` を、屈折確定済みの各 `Numeral` について常に成り立たせることを目標とする。

現状の `ensure_number_map()` は `appendix=''` 固定で構築され `DIC` 側の共有キャッシュに乗るため、「はつか」等の逆引きが失敗するだけでなく、複数の語尾が同じ `DIC` の共有キャッシュを取り合う潜在的な事故(先に呼ばれた語尾のマップが後続を汚染する)も抱えている。

修正方針: 逆引きマップの構築・キャッシュを `DIC` から追い出し、`語尾()` が返す屈折確定済みラッパー(`InflectedNumeral`)がそれぞれ**自分自身の `parse()` を呼んで**マップを構築する。`regex`/`to_number` は `DIC` から削除し、`InflectedNumeral` だけが持つ。

```ts
class InflectedNumeral implements Numeral {
  private number_map?: Map<string, number>
  private number_regex?: string
  constructor(
    private dic: DIC,
    private tail: string,
    // 既定は実用上十分な範囲。遠い未来/過去の年やユリウス日通し番号のような
    // 9999 を超えるトークンに使う場合は呼び出し側で明示的に上書きすること。
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

## 5. `つくも`(99)デッドコードの修正(実装済み)

**原因**: `DIC._calc()` は数値を桁ごとに再帰分解し、`fix()`(音便コールバック)には常に「単一桁 × 基数のべき乗」の値(0-9, 10, 20…90, 100, 200…900, …)しか渡らない。複合値である99が `fix()` に直接渡ることは構造的に無いため、`old_jpn.rubys` の `case 99: return 'つくも'` は永久に到達不能。実際に `parse(99, 'つ')` は「ここのそぢまりここのつ」(90+9の合成)を返す。

**修正方針(セルフレビューで簡素化)**: 当初は `fix()`(音便コールバック)を経由してこの値に到達させる案を検討したが、`case 99` 自体が渡された `str`/`tail` を一切参照せず `'つくも'` を無条件に返す(既存のデッドコードの挙動そのもの)ため、`fix()` を経由させる意味がない。代わりに `DIC` に「完全一致の特例表」を追加し、`parse()` の先頭(語尾必須ガードの直後)で `_calc()`/`fix()` を経由せず直接リテラル文字列を返す。既存の到達不能な `case 99` 分岐は削除して置き換える。

```ts
class DIC {
  private composites = new Map<number, string>()

  例外(num: number, word: string) {
    this.composites.set(num, word)
    return this
  }

  parse(num: number, appendix?: string): string {
    if (this.requires_tail && appendix === undefined) {
      throw new Error(
        'この数詞辞書は語尾の指定が必須です。.語尾(tail) を通してから使ってください。',
      )
    }
    const composite = this.composites.get(num)
    if (composite !== undefined) return composite
    // ...既存の _calc() 呼び出し
  }
}

old_jpn.rubys.例外(99, 'つくも') // switch文の case 99 は削除してよい
```

`100`(もも)は既存の桁再帰(百の位の寄与)で自然に到達できるため対象外。この例外表は**完全一致のみ**を扱い、複合下二桁への一般化(199→「百つくも」等)はしない——`old_jpn` の音便コールバック自体が `if (100 < num) return str` で不規則形の対象を100以下に限定しており、99という特定の数への慣用句(付喪神の由来となった「九十九」)を再現する以上の一般化は史実的裏付けを欠くため、意図的にスコープ外とする。`つくも` は語尾によらず不変(既存コードの挙動を維持)——将来、語尾によって変わる複合語が必要になった場合は `例外(num, word | (tail: string) => word)` のように関数も受け付ける形へ拡張できる。

`InflectedNumeral` の逆引きマップ構築(`dic.parse(num, tail)` をループで呼ぶだけ)はこの変更を自動的に反映するため、`つくも→99` の逆引きも追加コード無しで正しく成立する。

## 6. 日本語数詞パターンの整理と `number.ts` への反映(実装済み)

暦での実用に絞って調査した結果、日本語の数詞表現だけでも次の5パターンが識別された。それぞれの `number.ts` 上の対応を整理する。

| #   | パターン                         | 例               | 対応                                                          |
| --- | -------------------------------- | ---------------- | ------------------------------------------------------------- |
| 1   | アラビア数字表記(何もしない処理) | `13`             | 新規 `export const arabic: Numeral`(桁を素通しするだけ、後述) |
| 2   | 位取り記法の漢字表記             | 十三             | 既存 `jpn.漢字`/`jpn.大字`(変更不要)                          |
| 3   | 桁表現文字の入る漢字表記(桁列挙) | 二〇二四         | 新規 `jpn.桁読み`(後述)                                       |
| 4   | 日付の読み仮名                   | はつか、ついたち | `old_jpn.rubys.語尾('か')`                                    |
| 5   | 日付以外の読み仮名               | ひとつ、いち     | `old_jpn.rubys.語尾('つ')` または `jpn.rubys`                 |

**パターン1(アラビア数字/何もしない)**: `.numeral()` を設定しない場合の `format_number()` の既定動作(ゼロ埋めした算用数字)と実質同じだが、後述する記法カタログ(8節)の中で明示的に選べる項目として名前を与える価値がある。特定言語の文法に紐づかないため、`DIC` を使わず言語非依存の対象とする。

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
  return Math.abs(num)
    .toString()
    .split('')
    .map((d) => items[Number(d)])
    .join('')
}
```

**パターン4/5**: 前節までで設計済みの `old_jpn.rubys.語尾('か' | 'つ')` をそのまま使う。

**大字・巨大数について**: 暦での利用を目的にすると、極端な年号を除いてはすぐに必要にならないと判断し、今回は現状維持(`jpn.大字` は既存のまま、命数法の万進/万万進境界や仏教超大数の実装拡張は行わない)。

## 7. 英語・ローマ数字・韓国語(ハングル)の追加/修正(実装済み)

- **英語**: `english.lower`/`english.title` に完全往復保証のテスト(`assertRoundTrips`)を後追いで追加する。アーキテクチャ変更は不要(元々語尾を持たない実装のため)。
- **ローマ数字**: 時計の文字盤はローマ数字表示の定番用途なので、`roman.upper` を時トークンに割り当てるサンプル(既存の「Romulus暦に `roman.upper` を割り当てる」提案とは別に、12時間制の時トークンをローマ数字で表示するクロックフェース的なサンプル)を実装候補として追加する。ローマ数字は英語固有ではなくラテン文字圏で広く使われる記法なので、8節で述べる言語非依存カタログに置く。
- **韓国語(ハングル)は「わりと固定的で対応しやすい」という見立てが妥当**: 調査結果(README「多言語数詞の一致体系の調査」参照)によれば、
  - **漢語系数詞**(일/이/삼…)は日本語の `jpn.漢字` と同型の万進再帰構造を持つため、**既存の `DIC` エンジンをそのまま再利用**でき、辞書(単位/桁/位)をハングルの語彙に差し替えるだけで済む。新しいメカニズムは不要。
  - **固有数詞**(하나/둘/셋…)は助数詞の前で縮約形(하나→한、둘→두、셋→세、넷→네、스물→스무)になる現象を持つが、これは `old_jpn` の音便コールバックと同型の「`fix(num, str, tail)` で特定の数値だけ特殊形を返す」仕組みでそのまま表現できる。**むしろ日本語の音便より単純**——日本語は助数詞の頭子音(ハ行/カ行/サ行等)によって変化のパターン自体が分岐する(いっぽん/いっかい/いっさつ)のに対し、調査した範囲では韓国語の縮約はどの助数詞が続くかによらず数詞側の形が一律に決まるため、`tail` の値ごとの分岐(音便で言う「か」「つ」相当)自体が不要で、「助数詞の有無」の二値で足りる可能性が高い。
  - どちらの体系を使うかは**トークン単位で固定**(時=固有数詞、分=漢語数詞、日付=常に漢語数詞)であることは既に確認済みで、呼び出しごとに切り替える必要はない。
  - 結論: **新規アーキテクチャは一切不要**。2つの `DIC` インスタンス(漢語系・固有系)を追加し、ロケール登録簿(次節)の `ko` エントリへトークンごとに割り当てるだけで実装できる見込み。

## 8. ロケール登録簿(Locale Registry)のフォーマット(実装済み、`src/locale-registry.ts`)

言語表現が変わると数詞だけでなく、年月日時分秒の**既定パース書式・既定表示書式**も変わるべき、という指摘に基づき、数詞と書式既定値をまとめて発見できる登録簿を設計する。

### 設計方針

- 登録簿が持つのは「その言語・地域で使える数詞の選択肢と、書式の既定値」という**カタログ**であり、「どの暦トークンにどの数詞を割り当てるか」という配線は暦定義側(呼び出し側)の責務として明確に分離する(2つの層を混ぜない、という既存の結論を踏襲)。
- 数詞は「日付用の読み」「桁列挙用」のような**意味役割(purpose)**をキーにして引けるようにする。役割名は固定の enum ではなく緩やかな慣習(文字列)とするが、**表記ゆれを避けるため下記の推奨語彙を基本とする**: `cardinal`(基本の位取り数詞)、`cardinal-digit`(桁列挙数詞)、`ordinal`(序数)、`date-reading`(日付専用の読み)、`count-reading`(日付以外の計数読み)。アラビア語の性別ごと・スワヒリ語の名詞クラスごとのように、この語彙で足りない役割は言語ごとに追加してよい(例: `cardinal-masculine`/`concord-class7`)——閉じた enum にはしない。
- **`arabic`(算用数字パススルー)や `roman`(ローマ数字)のような、特定言語の文法に紐づかない記法は `LOCALE_REGISTRY` に含めない**。ロケールごとに重複登録すると同じものが何度も現れて冗長になるため、言語非依存の `SCRIPT_REGISTRY` に一度だけ登録し、暦定義側がどちらのカタログからでも参照できるようにする。
- タグは BCP-47 に緩く着想を得るが、厳密な準拠は求めない(`ja`、`ja-old`、`en`、`ko`、`ar` 等の軽量なタグで十分)。

```ts
// 言語非依存の記法カタログ(ロケールに重複登録しない)
export const SCRIPT_REGISTRY = {
  arabic,
  'roman-upper': roman.upper,
  'roman-lower': roman.lower,
}

type NumeralPurpose = string // 推奨語彙: 'cardinal' | 'cardinal-digit' | 'ordinal' | 'date-reading' | 'count-reading' など。閉じた enum にはしない

type LocaleEntry = {
  tag: string // 例: 'ja', 'ja-old', 'en', 'ko', 'ar'
  displayName: string // 人間向け表示名
  numerals: Partial<Record<NumeralPurpose, Numeral>>
  defaultParseFormat: string // 例: 'y年M月d日'(.lang() の第1引数に対応)
  defaultFormat: string // 例: 'Gy年M月d日(E)H時m分s秒'(.lang() の第2引数に対応)
  labels?: Record<string, string> // span の fallback 単位表記の既定値(.labels() 相当)
}

export const LOCALE_REGISTRY: Record<string, LocaleEntry> = {
  ja: {
    tag: 'ja',
    displayName: '日本語',
    numerals: {
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
      cardinal: english.lower,
      ordinal: english.ordinal, // 未実装。将来追加
    },
    defaultParseFormat: 'y/M/d H:m:s',
    defaultFormat: 'Gy/M/d(E) H:m:s',
  },
  ko: {
    tag: 'ko',
    displayName: '한국어',
    numerals: {
      'cardinal-sino': kor.漢語系, // 既存 DIC エンジンの辞書差し替えで実装済み
      'cardinal-native': kor.固有系.基本, // 助数詞なしの素の計数(実装済み)
      'count-reading-native': kor.固有系.助数詞前, // 助数詞直前の縮約形(実装済み)
    },
    defaultParseFormat: 'y년 M월 d일',
    defaultFormat: 'Gy년 M월 d일(E)',
  },
}
```

`roman.upper` を時計盤スタイルで使いたい場合は、ロケールに関係なく `SCRIPT_REGISTRY['roman-upper']` をどの暦トークンにも直接割り当てられる。

### アンカー(暦の基準文字列)との関係

`.calendar(start, leaps, month_divs)`(`src/fancy-date.ts:574`)の `start`(`[anchorString, formatString, epoch]`)は、その暦を較正するための具体的な日付例であり、既定のパース/表示書式そのものを設定する場所ではない。既定書式は `.lang(parse, format)`(`src/fancy-date.ts:562`、2つの位置引数を取るメソッドでオブジェクトは取らない)が担う。登録簿には別フィールドを設けず、`defaultParseFormat`/`defaultFormat` を一貫して選べば、アンカー文字列は「その暦の既定書式で書かれた1つの具体例」として自然に整合する。

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
  .calendar(['2024年1月1日', locale.defaultParseFormat, 0])
  .lang(locale.defaultParseFormat, locale.defaultFormat)
  .numeral({
    d: locale.numerals['date-reading'],
    y: locale.numerals['cardinal'],
  })
  .labels(locale.labels ?? {})
  .init()
```

「どのトークンにどの役割の数詞を割り当てるか」は暦定義側が明示的に選ぶ——登録簿はあくまでカタログであり、勝手にトークンへ配線しない。

## 9. 引き続き対象外・据え置きの項目

- スラブ語の格変化・アラビア語の性の極性・スワヒリ語の名詞クラス一致は、**アーキテクチャ(構築時に文脈を確定する屈折ファクトリ方式)が対応可能であることは調査で実証済み**だが、具体的な語彙・文法テーブルの実装は今回のスコープ外(需要が出た時点で着手する)。
- 大字・命数法の万進/万万進境界・仏教超大数は、暦用途では優先度が低いと判断し、現状維持のまま据え置く。
- `english.ordinal`(three→third)は本文書中で参照のみ行い、実装はまだ行っていない。
- (実装済み)`kor.漢語系`(既存 DIC エンジン流用)/`kor.固有系.基本`・`kor.固有系.助数詞前`(音便より単純な縮約規則)を実装した。ただし逆引き(`regex`/`to_number`)は format 方向のみのため未実装のまま(暦分野で往復保証が要る場面が出た時点で着手する)。

## 10. 実装順序の目安(すべて完了)

1. (完了)`DIC` に `語尾()`/`語尾必須()`/`例外()` を追加し、`old_jpn.rubys` の bare 使用を例外化しつつ `つくも` の到達可能性を修正(3・5節)。
2. (完了)`InflectedNumeral` ラッパーと `assertRoundTrips` テストヘルパーを追加し、`old_jpn.rubys` の全語尾で完全往復を検証(4節)。
3. (完了)`arabic`/`jpn.桁読み` を追加(6節)。
4. (完了)`SCRIPT_REGISTRY`/`LOCALE_REGISTRY`(`ja`/`en`/`ko`)を `src/locale-registry.ts` に追加した。既存サンプル暦の書き換えは行っていない(`.numeral()` はまだ暦全体で1つの Numeral しか受け付けず、per-token map 拡張は未実装のため——次点の課題として残す)。
5. (完了)`RomanClock`(`src/sample/calendars.ts`)としてローマ数字クロックフェース・サンプルを追加した。
6. (完了)韓国語(`kor.漢語系`/`kor.固有系.基本`/`kor.固有系.助数詞前`)と `LOCALE_REGISTRY.ko` を追加した(逆引きは未実装)。
7. (完了)平気法・定気法(`src/sample/calendars.ts`)へ実際に適用した。

- `d`(日): `notation({ d: [和暦日付漢字, 和暦日付ふりがな, '日'] })` で `jpn.漢字`/`old_jpn.rubys.語尾('か')` を静的な30要素配列に事前展開し、既存の `list`/`rubys` 機構(`H:[時鐘,時鐘かな,'刻']` と同じ形)にそのまま乗せた。`do`(漢字)/`dr`(日付ふりがな)が機能するようになり、bare の `d`(算用数字)は変更していない。
- `y`(年): `list`/`rubys` の静的配列が無界の年には使えないため、新規メソッド `FancyDate.numeral_label(numeral, ruby)` を追加した。当初 `.numeral(numeral, ruby)` 自体を拡張する案を検討したが、`format_number()` は `y` だけでなく `H`/`m`/`s`/`S`/`u`、`d`/`D`/`Q`/`p`/`w` とも共有されており、`y` を狙って `.numeral()` を設定すると bare の `d`/`H`/`m`/`s` まで意図せず変わってしまう(既存のスナップショットを壊す)ため、`y` 専用の独立した状態(`dic.numeral_label`/`numeral_label_ruby`)を持つ形に設計を変更した。あわせて `def_to_label()` で `y` を `to_label`/`to_ruby` に配線し、tokenizer の正規表現(`reg_token`)にも `y` を `[or]` サフィックス対象として追加した(既存の format 文字列に `"yo"`/`"yr"` という並びは無いことを確認済みで後方互換)。平気法・定気法には `.numeral_label(jpn.漢字, jpn.rubys)` を設定し、`yo`(漢字)/`yr`(日付以外のふりがな、和語の old_jpn ではなく漢語の jpn.rubys——年のような3〜4桁の数は和語の数え方の対象外のため)が使えるようになった。
- この過程で、`定気法.parse('...年M月d日', 'Gy年M月d日')` が誤った日付を返す既存の潜在バグを発見した(平気法では発生しない、`d` の list/rubys 変更とは無関係——詳細は development-notes.md 参照)。今回の変更範囲外として修正はしていない。

**次点の課題(未着手)**: `.numeral()`/`.numeral_label()` を他の暦(Julian・Romulus 等)や英語・ローマ数字ロケールへ横展開すること、`LOCALE_REGISTRY` 自体を暦定義に直接配線する仕組み化(今回は平気法/定気法に直接 `jpn.漢字`/`jpn.rubys`/`old_jpn.rubys` を割り当てており、レジストリ経由の配線ではない)、韓国語数詞の逆引き(`regex`/`to_number`)、定気法の parse 不具合の修正。
