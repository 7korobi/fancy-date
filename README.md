# fancy-date

[![Build Status](https://travis-ci.org/7korobi/fancy-date.svg?branch=master)](https://travis-ci.org/7korobi/fancy-date)

## インストール

```shell
bun add fancy-date
```

## API 利用例

```ts
import { Calendar } from 'fancy-date'

const g = Calendar.Gregorian
```

`Calendar` には、Gregorian / Julian / 定気法 / Maya / エジプト民用暦 / コプト暦などのサンプル暦が入っている。各暦は `FancyDate` インスタンスなので、同じ API で parse、format、span、add/sub を使える。

token の意味、format / find / span での使い分け、`precise` や循環 token の詳しい扱いは [docs/manual.md](docs/manual.md) にまとめている。

### parse / format

`parse()` は暦表現を UTC ミリ秒へ変換し、`format()` は UTC ミリ秒や暦オブジェクトを文字列へ戻す。

```ts
const utc = g.parse('2024年3月10日')

g.format(utc, 'Gy年MM月dd日(E)')
// '西暦2024年03月10日(日)'
```

書式は `y/M/d/H/m/s/S` のような階層 token と、`G` 元号、`E` 曜日、`a/A` 干支などの暦 token を組み合わせる。`G` を含めない古い年は、符号付き通年として出る。

```ts
const nabonassar = Calendar.Julian.parse('紀元前747年2月26日')

Calendar.Julian.format(nabonassar, 'Gy年MM月dd日')
// '紀元前747年02月26日'

Calendar.Julian.format(nabonassar, 'y年M月d日')
// '-746年2月26日'
```

### span / add / sub

`span([from, to])` は相対表現を返す。`span_obj()` は `parts`、`next_at`、`timeout` を含むオブジェクトを返す。

```ts
const from = g.parse('2024年1月1日 0時0分0秒', 'y年M月d日 H時m分s秒')
const to = g.parse('2025年3月10日 4時5分6秒', 'y年M月d日 H時m分s秒')

g.span([from, to], { precise: 'm' })
// '1年2ヶ月9日4時間5分後'

g.span([from, to], { precise: 'w' })
// '1年10週後'
```

`precise` の階層 token は `y/M/d/H/m/s/S` と `Y/w/D`。`w` は週年 `Y` と組になり、`D` は年初からの日番号として `y` と組になる。

```ts
g.add(from, '1年2ヶ月9日4時間5分後')
// 2025年3月10日 4時5分

g.sub(to, '1年2ヶ月9日4時間5分後')
// 2024年1月1日 0時0分
```

`a/b/c/f/A/B/C/E/F/V` などの循環 token は、干支・曜日・宿のような循環位相の差を表す。日時加算としては曖昧なので、`add()` / `sub()` では使わない。

### find

`find([from, to], conditions)` は範囲内で条件に合う暦境界を探す。探索 step は条件から推定される。

```ts
const between = [g.parse('2020年1月1日'), g.parse('2020年3月1日')]

g.find(between, [{ Ao: '甲子' }]).map((utc) => g.format(utc, 'yyyy年MM月dd日 Ao'))
// ['2020年01月22日 甲子']
```

`note` 条件は `note()` の表示名から探す。正規表現も使える。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年10月1日')], [{ note: /春分|秋分/ }])
```

必要なら `step` を明示できる。
無制限の範囲では `limit` を指定し、昇順なら `from`、降順なら `to` を有限値にする。

```ts
g.find([g.parse('2020年3月1日'), g.parse('2020年3月2日')], [{ H: '12' }], {
  step: 'H',
})

g.find([g.parse('2020年1月23日'), Infinity], [{ Ao: '甲子' }], { limit: 1 })
// 次の甲子日

g.find([-Infinity, g.parse('2020年3月1日')], [{ Ao: '甲子' }], {
  order: -1,
  limit: 1,
})
// 前の甲子日
```

### parse_span / format_span / labels

`parse_span()` は相対表現を `Span` にし、`format_span()` は `SpanLike` を現在の暦の表記へ整える。

```ts
const custom = g.dup().labels({ w: '週目', A: '日巡り' }).init()

custom.span([from, to], { precise: 'w' })
// '1年10週目後'

custom.parse_span('1日巡り後')
// { unit: 'day', value: -1, label: '1日巡り後', parts: [...] }

custom.format_span({ token: 'A', unit: 'day', value: -1, label: '1A' }).label
// '1日巡り後'
```

`labels()` は fallback の単位表記を差し替える。`algo()` の第3要素で token ごとの相対表現を定義している場合は、そちらが優先される。

### サンプル暦

```ts
Calendar.エジプト民用暦.format(Calendar.エジプト民用暦.parse('1年1月1日'), 'Gy年Mod日')
// 'ナボナサル紀元1年トート1日'

Calendar.コプト暦.format(Calendar.コプト暦.parse('1739年1月1日'), 'Gy年Mod日')
// 'コプト暦1739年トウト1日'
```

## 今後の検討メモ

- グレゴリオ暦、平気法、定気法、は同じ天体での暦のはずだが、干支が異なるのは違和感。サンプルの初期値定義が誤っているのではないか。
- Span: span の各 part を暦 token として内部化し、不断 token の受け入れ、span 同士の演算、parse/format の分離を検討する。同じ unit/token を複数持たないなら、配列ではなく Record 形式に寄せる余地もある。
- SpanLike: `前` / `後` のない表現を `後` として扱う文法拡張を検討する。
- リアクティブ用途: 相対 span の表示ラベルが次に変化する timestamp や timeout を取得できるようにする。
- 数値表現: 暦ごとに `number.ts` の数値辞書を設定し、日本語、英語数詞、ローマ数字などの入出力に対応する。未設定時はアラビア数字を使う。
- 性能測定: `bun run perf:core` で parse、format、to_tempos、span、add/sub、太陰太陽暦、天文現象のベンチマークを確認する。
- token 拡張: 不断 token を span に受け入れ、`precise` に不断を指定できるようにする。世紀・千年紀・マヤ長期暦のような年上位単位は、元号ではなく `G` token との関係も検討する。
- 天文モデル: 地球以外の天体向けに `src/nasa` の高精度モデルを追加し、楕円軌道、彗星、多星系の暦を検討する。
- 歴史的時刻表現: 定気法に四半刻表現を採用するか、江戸時代以前の「分」「秒」に近い時刻表現を調査する。
- 暦の拡張: 太陽暦の上位単位、マヤ長期暦、中東・インド・アフリカの暦を調査する。
- 暦外期間: ロムルス暦のように暦月だけで1年を表現し尽くさない暦は他に類例が見当たらず、`month_divs` の `null` 要素 + `Indexer.list` への `null` 混在で表現した今回の対応(暦外期間ラベル)をこれ以上汎用化する必要は薄いと思われる。

実装済みの下地:

1. `sample.ts` を `src/sample/` に分割する。
2. Span の parser/formatter を内部的に分離する。
3. Span に次回表示変化時刻・timeout を持たせる。
4. `perf:*` 系の性能測定スクリプトを追加する。
5. 暦ごとの数値辞書を使った format 出力に対応する。
6. 暦ごとの数値辞書を使った parse 入力に対応する。
7. `precise` に不断 token を指定できるようにし、SpanPart に token を持たせる。
8. 非 `precise` の span も固定時間ではなく暦の秒・分・時・日境界に基づいて判定する。
9. `src/nasa` を追加し、Mars の太陽季節モデルを試験的に導入する。
10. 地域暦の足場として、ナボナサル紀元を anchor にした365日固定のエジプト民用暦を追加する。
11. `calendar()` に閏年 offset を追加し、Alexandria 地点のコプト暦を追加する。
12. `labels()` と `parse_span()` / `format_span()` を追加し、span の表記を暦ごとに調整できるようにする。

直近の実装順:

1. エチオピア暦など、コプト暦と同系統の地域暦を検討する。
