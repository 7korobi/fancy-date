# Mo / Mr の月表記

`M` は従来どおり数値の月 token です。月名は `Mo`、月名の ruby 表記は `Mr`
を使います。`MM` のゼロ埋め幅にも影響しません。

## 暦ごとの出力形式

`.monthNotation()` で `Mo` と `Mr` の formatter を独立して指定できます。第1引数は
`.notation({ M: [...] })` の月名・ruby、または既存の数値 fallback です。第2引数の
`month` は 1 始まりの月番号、`is_leap` は閏月かどうかを表します。

```ts
const calendar = new FancyDate(Calendar.平気法)
  .monthNotation({
    Mo: (label, { is_leap }) => (is_leap ? `${label}閏` : label),
    Mr: (label, { is_leap }) => (is_leap ? `うるう${label}` : label),
  })
  .init()

calendar.format(at, 'Gy年Mo月d日')
calendar.format(at, 'Gy年Mr月d日')
```

formatter が省略された token は既定形式を使います。既定の閏 marker は `Mo` が
`閏`、`Mr` が `うるう` です。formatter は月名の前後どちらにも文字列を追加できます。
parse regex も構築するため、formatter は同じ入力に対して常に同じ文字列を返すように
してください。

`monthNotation()` は `notation()` で月の構成を決めた後に指定し、最後に `init()` を
呼びます。alias の月番号は `M` の長さを超えられません。

## 明示的な parse alias

canonical spelling 以外に受理する綴りは `aliases` に登録します。alias は `Mo` または
`Mr` の token 全体に対応する完全一致の文字列です。`month` は 1 始まり、
`is_leap` は必須です。`Mo` と `Mr` の alias は別々に解釈されます。

```ts
const calendar = new FancyDate(Calendar.平気法)
  .monthNotation({
    Mo: (label, { is_leap }) => (is_leap ? `${label}閏` : label),
    Mr: (label, { is_leap }) => (is_leap ? `${label}・うるう` : label),
    aliases: [
      { token: 'Mo', text: '閏二月', month: 2, is_leap: true },
      { token: 'Mo', text: '旧二月', month: 2, is_leap: true },
      { token: 'Mr', text: 'うるうきさらぎ', month: 2, is_leap: true },
    ],
  })
  .init()

const at = calendar.parse('令和2年閏二月1日', 'Gy年Mo月d日')
calendar.format(at, 'Gy年Mo月d日') // calendar の canonical spelling
```

alias に `.*` などの regex 記号が含まれていても文字どおりに扱います。同じ token の
canonical spelling / alias が異なる月番号または通常月・閏月を指す場合、数値 fallback
と意味が衝突する場合は、設定時または `init()` に曖昧さを `Error` として通知します。
空文字列や範囲外の月番号、閏月を持たない暦への閏月 alias も受け付けません。長い候補
から照合し、format token の境界を保ちます。

parse は token に対応する canonical spelling と登録 alias のみを月名として解釈します。
alias で parse した日時を同じ format で再 format すると、alias ではなく暦の canonical
spelling を返します。
既存互換のため、月名を持たない `Mo` の数値 fallback と `Mr` の数値 fallback も引き続き
受理します。

```ts
const parsed = calendar.parse(inputWithAlias, 'Gy年Mr月d日')
calendar.format(parsed, 'Gy年Mr月d日') // canonical spelling
```
