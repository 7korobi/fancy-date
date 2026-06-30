# fancy-date

[![Build Status](https://travis-ci.org/7korobi/fancy-date.svg?branch=master)](https://travis-ci.org/7korobi/fancy-date)

## インストール

```shell
bun add fancy-date
```

## 今後の検討メモ

- Span: span の各 part を暦 token として内部化し、不断 token の受け入れ、span 同士の演算、parse/format の分離を検討する。同じ unit/token を複数持たないなら、配列ではなく Record 形式に寄せる余地もある。
- SpanLike: `前` / `後` のない表現を `後` として扱う文法拡張を検討する。
- リアクティブ用途: 相対 span の表示ラベルが次に変化する timestamp や timeout を取得できるようにする。
- 数値表現: 暦ごとに `number.ts` の数値辞書を設定し、日本語、英語数詞、ローマ数字などの入出力に対応する。未設定時はアラビア数字を使う。
- 性能測定: `bun run perf:core` で parse、format、to_tempos、span、add/sub、太陰太陽暦、天文現象のベンチマークを確認する。
- token 拡張: 不断 token を span に受け入れ、`precise` に不断を指定できるようにする。世紀・千年紀・マヤ長期暦のような年上位単位は、元号ではなく `G` token との関係も検討する。
- 天文モデル: 地球以外の天体向けに `src/nasa` の高精度モデルを追加し、楕円軌道、彗星、多星系の暦を検討する。
- 歴史的時刻表現: 定気法に四半刻表現を採用するか、江戸時代以前の「分」「秒」に近い時刻表現を調査する。
- 暦の拡張: 太陽暦の上位単位、マヤ長期暦、中東・インド・アフリカの暦を調査する。

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

直近の実装順:

1. エチオピア暦など、コプト暦と同系統の地域暦を検討する。
