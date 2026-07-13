import { arabic, roman } from '../number'

// 言語非依存の記法カタログ(ロケールに重複登録しない)。算用数字パス
// スルーやローマ数字のように、特定言語の文法に紐づかない記法はここに
// 一度だけ登録し、暦定義側がどのロケールからでも直接参照できるように
// する(LOCALE_REGISTRY の全エントリへ重複登録すると冗長になるため)。
export const SCRIPT_REGISTRY = {
  arabic,
  'roman-upper': roman.upper,
  'roman-lower': roman.lower,
}
