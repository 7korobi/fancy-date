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

## 開発者向け情報

今後の検討メモ・調査結果・実装ログは [docs/development-notes.md](docs/development-notes.md) に、数詞ライブラリの設計案は [docs/numeral-design.md](docs/numeral-design.md) にまとめている。
