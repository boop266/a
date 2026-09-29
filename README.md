# 八つ枠のカバン

持ち帰り型のローグライク。`index.html` 一枚で動きます（ブラウザで開くだけ）。

## テスト

Playwright（Chromium）で動かします。

```sh
# 見つかったバグを一つずつ狙って再現する回帰テスト
node tests/regress.js

# 自動で遊び続けて、JSエラーと操作不能を探すボット
node tests/bot.js [回数=4] [1回あたりの手数=600] [幅x高さ=390x844]
```

ボットの環境変数:

| 変数 | 意味 |
|---|---|
| `START=49` | その階（0始まり）から潜る |
| `GOD=1` | 倒れないようにして奥まで見る |
| `QS=zone=ship` | テスト用URLパラメータ（`zone=grave` `zone=nest` `zone=pond` `ship=1` `blight=2` など） |
| `BOT_OUT=dir` | 操作不能のスクショの保存先（既定は `tests/out`） |

ボットはテストのときだけ、ゲーム内で `catch(e){}` に握りつぶされている例外も記録します。
