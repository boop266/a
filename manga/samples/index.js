/* manga/samples/index.js — 漫画工房に同梱する見本の作品
   1冊目『うちの物干しに雲がいる』（全16ページ＝表紙＋本文15ページ）。
   ・script     … 完成稿（manga/index.html の第3稿）を schema v4 に移したもの
   ・nameScript … 第1稿（git の「漫画: 第1稿『うちの物干しに雲がいる』（編集チェック前）」の manga/index.html）を同じ形に移したもの
   ・extras     … manga/extras/author.md（作者）と editor.md（編集者）から
   ・meeting    … この作品は、企画会議の工程ができる前に作られました。会議の記録はないので null にしています（作り話の会議は入れない）。
   2冊目『本日も大行列』・3冊目『これは父です』… samples/ の同名 .json（企画・脚本担当）をそのまま埋め込み。無い項目は null。
   このファイルは scratchpad の port/build.js から書き出しています。 */
window.MangaSamples = [
 {
  "id": "monohoshi",
  "createdAt": "2026-10-06T06:42:00Z",
  "script": {
   "v": 1,
   "title": "うちの物干しに雲がいる",
   "genre": "ほのぼの日常ファンタジー",
   "logline": "晴れた日曜日、お母さんの洗濯物にだけ雨を降らせる小さな雨雲モクがいた。迷子のモクを家族のいる空へ帰すため、ハルとお母さんは「笑うとふくらむ」雲を思いきり笑わせる。",
   "ending": "end",
   "episode": 1,
   "seriesTitle": "",
   "characters": [
    {
     "id": "haru",
     "name": "ハル",
     "role": "主人公・小学2年生",
     "desc": "黒いおかっぱに髪どめ、水玉のTシャツに黒い半ズボン",
     "species": "human",
     "age": "child",
     "body": "normal",
     "hair": "bob",
     "hairColor": "black",
     "eyes": "round",
     "outfit": "tshirt",
     "pattern": "dots",
     "items": [
      "hairbutton"
     ]
    },
    {
     "id": "mom",
     "name": "お母さん",
     "role": "ハルのお母さん",
     "desc": "網点の髪をおだんごにまとめ、白いエプロンに黒い長いスカート",
     "species": "human",
     "age": "adult",
     "body": "normal",
     "hair": "bun",
     "hairColor": "tone",
     "eyes": "round",
     "outfit": "apron",
     "pattern": "tone",
     "items": []
    },
    {
     "id": "moku",
     "name": "モク",
     "role": "迷子のちいさな雨雲",
     "desc": "悲しいと灰色になって雨を降らせ、笑うと白くふくらむ",
     "species": "cloud",
     "age": "child",
     "color": "white",
     "eyes": "round",
     "size": 0.85,
     "items": []
    },
    {
     "id": "papa",
     "name": "雲のパパ",
     "role": "モクのお父さん",
     "desc": "太い眉とひげの大きな雲",
     "species": "cloud",
     "age": "adult",
     "color": "white",
     "eyes": "narrow",
     "size": 1.5,
     "items": [
      "mustache"
     ]
    },
    {
     "id": "mama",
     "name": "雲のママ",
     "role": "モクのお母さん",
     "desc": "まつげの大きな雲",
     "species": "cloud",
     "age": "adult",
     "color": "white",
     "eyes": "sparkle",
     "size": 1.3,
     "items": []
    }
   ],
   "art": {
    "headRatio": 3,
    "deform": 0.65,
    "eyeSize": 0.55,
    "eyeStyle": "simple",
    "line": {
     "weight": 0.6,
     "taper": 0.25,
     "jitter": 0.05,
     "roughness": 0.05
    },
    "hatching": 0,
    "crossHatch": 0,
    "black": 0.35,
    "tone": 0.3,
    "toneKind": "dot",
    "detail": 0.25,
    "perspective": 0.15,
    "dynamism": 0.35,
    "sparkle": 0.35,
    "softness": 0.65,
    "grain": 0,
    "panelFrame": "clean",
    "aim": "白黒の網点で、まるくやさしく描く絵本のような日曜日",
    "direction": "2〜3頭身のまるいデフォルメ。太めで均一な線、ベタは控えめ、気持ちは雲の網点（灰色＝悲しい／白＝うれしい）で見せる。",
    "reason": "元の原稿（全16ページ）の絵柄に寄せた。子どもからお母さん世代まで読めるよう、線は太く、描き込みは少なめにしている。"
   },
   "cover": {
    "bg": "yard",
    "laundry": [
     "towel",
     "shirt",
     "towel",
     "shirt",
     "socks"
    ],
    "time": "day",
    "weather": "clear",
    "catch": "洗濯物にだけ、\n雨がふる。",
    "cast": [
     {
      "id": "mom",
      "pose": "hold",
      "hold": "basket",
      "expr": "shock",
      "face": "left",
      "look": "up"
     },
     {
      "id": "moku",
      "pose": "float",
      "expr": "sad",
      "color": "gray",
      "rain": 2
     },
     {
      "id": "haru",
      "pose": "point",
      "expr": "surprised",
      "face": "right",
      "look": "up"
     }
    ]
   },
   "pages": [
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "shirt"
        },
        {
         "id": "haru",
         "x": 0.2,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "洗濯日和ね！"
        }
       ],
       "laundry": [
        "towel",
        "shirt",
        "towel"
       ],
       "narr": "日曜日。\n朝から\nいい天気。"
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.42,
         "expr": "happy",
         "pose": "hold",
         "face": "right",
         "hold": "socks"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "これも\n干す？"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.58,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ありがと、\nハル"
        }
       ]
      },
      {
       "shot": "bg",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
       "laundry": [
        "towel",
        "shirt",
        "shirt",
        "towel",
        "socks"
       ],
       "sfx": [
        {
         "text": "スッ…",
         "size": "m"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "yard",
       "time": "day",
       "weather": "cloudy",
       "cast": [
        {
         "id": "haru",
         "x": 0.52,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "あれ？"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 3
        }
       ],
       "say": [],
       "laundry": [
        "towel",
        "shirt",
        "shirt",
        "towel",
        "socks"
       ],
       "sfx": [
        {
         "text": "ザーー",
         "size": "l"
        },
        {
         "text": "ポツ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.45,
         "expr": "shock",
         "pose": "stand",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "うそ\nでしょ！？"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.58,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "ちっちゃい\n雲だ！"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 2
        },
        {
         "id": "mom",
         "x": 0.86,
         "expr": "nervous",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.14,
         "expr": "surprised",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "うちの\n洗濯物だけ…"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "ピンポイント\nだね"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      3
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.74,
         "expr": "angry",
         "pose": "fight",
         "face": "left",
         "hold": "beater"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "こらーっ！"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.58,
         "expr": "shock",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ひゃっ"
        }
       ],
       "sfx": [
        {
         "text": "ブンッ",
         "size": "m"
        }
       ],
       "fx": [
        "speed"
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.2,
         "expr": "cry",
         "pose": "float",
         "color": "gray",
         "rain": 3
        },
        {
         "id": "mom",
         "x": 0.57,
         "expr": "angry",
         "pose": "run",
         "face": "left",
         "hold": "beater"
        },
        {
         "id": "haru",
         "x": 0.9,
         "expr": "shock",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "どきなさーい！"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel"
       ],
       "sfx": [
        {
         "text": "ザザアッ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.24,
         "expr": "shock",
         "pose": "cheer",
         "face": "right",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.6,
         "expr": "worried",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "待って！"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "cry",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "ぽろぽろ",
         "size": "s"
        }
       ],
       "fx": [
        "gloom"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.58,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "この子、\n泣いてる"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 1
        },
        {
         "id": "haru",
         "x": 0.62,
         "expr": "normal",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "どうしたの？"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "…はぐれたの"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "towel",
        "shirt"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "cry",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "風が\nはやくて"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "みんなに\nおいてかれた"
        }
       ],
       "fx": [
        "gloom"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.56,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "まいご\nなんだ…"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.55,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "beater"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "……はぁ"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.15,
         "expr": "happy",
         "pose": "jump",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "雨がやむまで\nだからね"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "やった！"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.62,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "わたし、ハル"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "きみは？"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "normal",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "…モク"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.4,
         "expr": "puff",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.88,
         "expr": "shock",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "にらめっこ\nしよう"
        },
        {
         "who": "haru",
         "type": "shout",
         "text": "あっぷっぷ"
        }
       ],
       "fx": [
        "focus",
        "impact"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ぷふっ"
        }
       ],
       "sfx": [
        {
         "text": "ふわっ",
         "size": "m"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      },
      {
       "shot": "bust",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.48,
         "expr": "shock",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "雨が\nやんだ！"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.7,
         "expr": "happy",
         "pose": "jump",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "笑うと\n晴れるんだ！"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "えへへ"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel",
        "shirt"
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "determined",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ハル"
        }
       ],
       "fx": [
        "sparkle",
        "dark"
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.65,
         "expr": "determined",
         "pose": "point",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "その子を\n笑わせ続けて！"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.76,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.3,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "こちょこちょ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.62,
         "expr": "laugh",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.14,
         "expr": "surprised",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "ふくらんだ？"
        }
       ],
       "sfx": [
        {
         "text": "ぷくっ",
         "size": "m"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.7,
         "expr": "nervous",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.48,
         "expr": "worried",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.18,
         "expr": "normal",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あっつい\nわねぇ"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "お花が\nしおれてる"
        }
       ],
       "narr": "お昼すぎ"
      },
      {
       "shot": "full",
       "bg": "flowers",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.6,
         "expr": "think",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "お花、\nのどが\nかわいてる？"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "flowers",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "smile",
         "pose": "float",
         "rain": 2
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "サァァ…",
         "size": "s"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.3,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "mom",
         "x": 0.68,
         "expr": "smile",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あら、\nすずしい"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.54,
         "expr": "happy",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.15,
         "expr": "nervous",
         "pose": "stand",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あんた、\n便利ねぇ"
        },
        {
         "who": "haru",
         "type": "whisper",
         "text": "お母さん…"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        },
        {
         "id": "moku",
         "x": 0.32,
         "expr": "happy",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ありがとね、\nモク"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "えへへ"
        }
       ],
       "narr": "夕方"
      },
      {
       "shot": "full",
       "bg": "sky",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.28,
         "expr": "normal",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.62,
         "expr": "normal",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.55,
         "expr": "think",
         "pose": "float",
         "look": "up"
        }
       ],
       "say": []
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.4,
         "expr": "sad",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "think",
         "text": "…みんな"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.3,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 1
        },
        {
         "id": "haru",
         "x": 0.7,
         "expr": "worried",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "モク…？"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.26,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        },
        {
         "id": "haru",
         "x": 0.62,
         "expr": "normal",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "おうちに\n帰りたい？"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "…うん"
        }
       ],
       "props": [
        "bucket"
       ],
       "narr": "その夜"
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "でも\nぼく\n小さいから"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "cry",
         "pose": "float",
         "color": "gray",
         "rain": 1
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "高く\nとべないの"
        }
       ],
       "props": [
        "bucket"
       ],
       "sfx": [
        {
         "text": "ポタ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.77,
         "expr": "think",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.3,
         "expr": "sad",
         "pose": "stand",
         "face": "right",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.14,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "think",
         "text": "高く、\nねぇ…"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      2,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "pose": "float",
         "expr": "worried"
        },
        {
         "id": "mama",
         "pose": "float",
         "expr": "worried"
        }
       ],
       "say": [
        {
         "who": "papa",
         "type": "whisper",
         "text": "モクー"
        },
        {
         "who": "mama",
         "type": "whisper",
         "text": "どこー？"
        }
       ],
       "narr": "次の朝"
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "determined",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "shout",
         "text": "みんなだ！"
        },
        {
         "who": "moku",
         "type": "speech",
         "text": "えいっ"
        }
       ],
       "sfx": [
        {
         "text": "ぴょん",
         "size": "m"
        }
       ],
       "fx": [
        "speedv"
       ]
      },
      {
       "shot": "up",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "cry",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "とどかない…"
        }
       ],
       "sfx": [
        {
         "text": "ぽふっ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "そうだ！"
        }
       ],
       "fx": [
        "exclaim"
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.22,
         "expr": "happy",
         "pose": "point",
         "face": "right",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.88,
         "expr": "shock",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "うんと笑えば\nふくらむよ！"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "ふくらめば\nとべるかも！"
        }
       ],
       "fx": [
        "focus"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      2,
      1
     ],
     "panels": [
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.45,
         "expr": "puff",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "あっぷっぷ",
         "size": "s"
        }
       ],
       "fx": [
        "focus",
        "impact"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "worried",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "…ふ"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "nervous",
         "pose": "jump",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "くねくね",
         "size": "m"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ごめん…\n笑えないよ"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.72,
         "expr": "cry",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.3,
         "expr": "determined",
         "pose": "hips",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "行っちゃう！"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "どいて、\nハル"
        }
       ],
       "sfx": [
        {
         "text": "ゴォォ",
         "size": "m"
        }
       ],
       "fx": [
        "wind"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      2
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "normal",
         "pose": "hips",
         "face": "back",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "笑いが\n足りないのよ"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "black",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.42,
         "expr": "determined",
         "pose": "stand",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "お母さんの\n本気、\n見せてあげる"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "funny2",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "べろべろ\nばあ〜っ！"
        }
       ],
       "sfx": [
        {
         "text": "ドーン",
         "size": "l"
        }
       ],
       "fx": [
        "focus",
        "shake",
        "impact"
       ],
       "art": {
        "deform": 1,
        "eyeSize": 0.9,
        "dynamism": 1,
        "note": "お母さんの本気の変顔。ここだけ思いきり崩す"
       }
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.57,
         "expr": "shock",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "shout",
         "text": "ぶはっ"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.48,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "あはは\nははっ！"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      }
     ]
    },
    {
     "rows": [
      3,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "ぷく",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "ぷくぷく",
         "size": "m"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "ぷくーっ",
         "size": "m"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      },
      {
       "shot": "long",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float",
         "float": 0.9
        },
        {
         "id": "haru",
         "x": 0.8,
         "expr": "shock",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.2,
         "expr": "happy",
         "pose": "cheer",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "うかんだ！"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "その調子！"
        }
       ],
       "sfx": [
        {
         "text": "ふわぁっ",
         "size": "l"
        }
       ],
       "fx": [
        "sparkle"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mama",
         "pose": "float",
         "expr": "happy"
        },
        {
         "id": "moku",
         "pose": "float",
         "expr": "laugh"
        },
        {
         "id": "papa",
         "pose": "float",
         "expr": "happy"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "とどいた！"
        },
        {
         "who": "off",
         "type": "shout",
         "text": "いけーっ！"
        }
       ],
       "sfx": [
        {
         "text": "ふわっ",
         "size": "l"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "full",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mama",
         "x": 0.7,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.25,
         "expr": "happy",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mama",
         "type": "speech",
         "text": "モク！"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "ありがとー！"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "rainbow",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.38,
         "expr": "normal",
         "pose": "stand",
         "face": "back",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.56,
         "expr": "normal",
         "pose": "stand",
         "face": "back",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "にじだ…"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "うれし泣き\nかしらね"
        }
       ],
       "fx": [
        "sparkle"
       ],
       "big": true
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.42,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "towel"
        },
        {
         "id": "haru",
         "x": 0.16,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "今日も\nいい天気！"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel",
        "socks"
       ],
       "narr": "それから"
      },
      {
       "shot": "bg",
       "bg": "yard",
       "time": "day",
       "weather": "rain",
       "cast": [],
       "say": [],
       "sfx": [
        {
         "text": "サァ…",
         "size": "s"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "surprised",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "あっ！"
        }
       ]
      },
      {
       "shot": "long",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mama",
         "pose": "float",
         "expr": "happy"
        },
        {
         "id": "moku",
         "pose": "float",
         "expr": "happy"
        },
        {
         "id": "papa",
         "pose": "float",
         "expr": "happy"
        }
       ],
       "say": [
        {
         "who": "off",
         "type": "speech",
         "text": "モクー！"
        },
        {
         "who": "off",
         "type": "speech",
         "text": "洗濯物には\n降らないでよー！"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "はーい"
        }
       ],
       "fx": [
        "sparkle"
       ]
      }
     ]
    }
   ]
  },
  "nameScript": {
   "v": 1,
   "title": "うちの物干しに雲がいる",
   "genre": "ほのぼの日常ファンタジー",
   "logline": "晴れた日曜日、お母さんの洗濯物にだけ雨を降らせる小さな雨雲モクがいた。迷子のモクを家族のいる空へ帰すため、ハルとお母さんは「笑うとふくらむ」雲を思いきり笑わせる。",
   "ending": "end",
   "episode": 1,
   "seriesTitle": "",
   "characters": [
    {
     "id": "haru",
     "name": "ハル",
     "role": "主人公・小学2年生",
     "desc": "黒いおかっぱに髪どめ、水玉のTシャツに黒い半ズボン",
     "species": "human",
     "age": "child",
     "body": "normal",
     "hair": "bob",
     "hairColor": "black",
     "eyes": "round",
     "outfit": "tshirt",
     "pattern": "dots",
     "items": [
      "hairbutton"
     ]
    },
    {
     "id": "mom",
     "name": "お母さん",
     "role": "ハルのお母さん",
     "desc": "網点の髪をおだんごにまとめ、白いエプロンに黒い長いスカート",
     "species": "human",
     "age": "adult",
     "body": "normal",
     "hair": "bun",
     "hairColor": "tone",
     "eyes": "round",
     "outfit": "apron",
     "pattern": "tone",
     "items": []
    },
    {
     "id": "moku",
     "name": "モク",
     "role": "迷子のちいさな雨雲",
     "desc": "悲しいと灰色になって雨を降らせ、笑うと白くふくらむ",
     "species": "cloud",
     "age": "child",
     "color": "white",
     "eyes": "round",
     "size": 0.85,
     "items": []
    },
    {
     "id": "papa",
     "name": "雲のパパ",
     "role": "モクのお父さん",
     "desc": "太い眉とひげの大きな雲",
     "species": "cloud",
     "age": "adult",
     "color": "white",
     "eyes": "narrow",
     "size": 1.5,
     "items": [
      "mustache"
     ]
    },
    {
     "id": "mama",
     "name": "雲のママ",
     "role": "モクのお母さん",
     "desc": "まつげの大きな雲",
     "species": "cloud",
     "age": "adult",
     "color": "white",
     "eyes": "sparkle",
     "size": 1.3,
     "items": []
    }
   ],
   "art": {
    "headRatio": 3,
    "deform": 0.65,
    "eyeSize": 0.55,
    "eyeStyle": "simple",
    "line": {
     "weight": 0.6,
     "taper": 0.25,
     "jitter": 0.05,
     "roughness": 0.05
    },
    "hatching": 0,
    "crossHatch": 0,
    "black": 0.35,
    "tone": 0.3,
    "toneKind": "dot",
    "detail": 0.25,
    "perspective": 0.15,
    "dynamism": 0.35,
    "sparkle": 0.35,
    "softness": 0.65,
    "grain": 0,
    "panelFrame": "clean"
   },
   "cover": {
    "bg": "yard",
    "laundry": [
     "towel",
     "shirt",
     "towel",
     "shirt",
     "socks"
    ],
    "time": "day",
    "weather": "clear",
    "catch": "洗濯物にだけ、\n雨がふる。",
    "cast": [
     {
      "id": "mom",
      "pose": "hold",
      "hold": "basket",
      "expr": "shock",
      "face": "left",
      "look": "up"
     },
     {
      "id": "moku",
      "pose": "float",
      "expr": "sad",
      "color": "gray",
      "rain": 2
     },
     {
      "id": "haru",
      "pose": "point",
      "expr": "surprised",
      "face": "right",
      "look": "up"
     }
    ]
   },
   "pages": [
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "shirt"
        },
        {
         "id": "haru",
         "x": 0.2,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "洗濯日和ね！"
        }
       ],
       "laundry": [
        "towel",
        "shirt",
        "towel"
       ],
       "narr": "日曜日。\n朝から\nいい天気。"
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.42,
         "expr": "happy",
         "pose": "hold",
         "face": "right",
         "hold": "socks"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "これも\n干す？"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.58,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ありがと、\nハル"
        }
       ]
      },
      {
       "shot": "bg",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
       "laundry": [
        "towel",
        "shirt",
        "shirt",
        "towel",
        "socks"
       ],
       "sfx": [
        {
         "text": "スッ…",
         "size": "m"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.52,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "あれ？"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 3
        }
       ],
       "say": [],
       "laundry": [
        "towel",
        "shirt",
        "shirt",
        "towel",
        "socks"
       ],
       "sfx": [
        {
         "text": "ザーー",
         "size": "l"
        },
        {
         "text": "ポツ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.45,
         "expr": "shock",
         "pose": "stand",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "うそ\nでしょ！？"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.58,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "ちっちゃい\n雲だ！"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 2
        },
        {
         "id": "mom",
         "x": 0.86,
         "expr": "nervous",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.14,
         "expr": "surprised",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "うちの\n洗濯物だけ…"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "ピンポイント\nだね"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      2
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.6,
         "expr": "angry",
         "pose": "fight",
         "face": "left",
         "hold": "beater"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "こらーっ！"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.58,
         "expr": "shock",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ひゃっ"
        }
       ],
       "sfx": [
        {
         "text": "ブンッ",
         "size": "m"
        }
       ],
       "fx": [
        "speed"
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.2,
         "expr": "cry",
         "pose": "float",
         "color": "gray",
         "rain": 3
        },
        {
         "id": "mom",
         "x": 0.55,
         "expr": "angry",
         "pose": "run",
         "face": "left",
         "hold": "beater"
        },
        {
         "id": "haru",
         "x": 0.9,
         "expr": "shock",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "どきなさーい！"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel"
       ],
       "sfx": [
        {
         "text": "ザザーッ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.3,
         "expr": "shock",
         "pose": "fight",
         "face": "right",
         "hold": "beater"
        },
        {
         "id": "haru",
         "x": 0.68,
         "expr": "worried",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "待って！"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.6,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "この子、\n泣いてる"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 1
        },
        {
         "id": "haru",
         "x": 0.62,
         "expr": "normal",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "どうしたの？"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "…はぐれたの"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "towel",
        "shirt"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "cry",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "風が\nはやくて"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "みんなに\nおいてかれた"
        }
       ],
       "fx": [
        "gloom"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.56,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "まいご\nなんだ…"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "beater"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "……はぁ"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.15,
         "expr": "happy",
         "pose": "jump",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "雨がやむまで\nだからね"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "やった！"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.62,
         "expr": "smile",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "わたし、ハル"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "きみは？"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "normal",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "…モク"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.4,
         "expr": "puff",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.86,
         "expr": "shock",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "にらめっこ\nしよう"
        },
        {
         "who": "haru",
         "type": "shout",
         "text": "あっぷっぷ"
        }
       ],
       "fx": [
        "focus",
        "impact"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ぷふっ"
        }
       ],
       "sfx": [
        {
         "text": "ふわっ",
         "size": "m"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      },
      {
       "shot": "bust",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.38,
         "expr": "shock",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "beater"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "雨が\nやんだ！"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      3
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.7,
         "expr": "happy",
         "pose": "jump",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "笑うと\n晴れるんだ！"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "えへへ"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel",
        "shirt"
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "determined",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ハル"
        }
       ],
       "fx": [
        "sparkle",
        "dark"
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.65,
         "expr": "determined",
         "pose": "point",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "その子を\n笑わせ続けて！"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.72,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.32,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "こちょこちょ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "laugh",
         "pose": "jump",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "くねくね",
         "size": "s"
        }
       ]
      },
      {
       "shot": "bg",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
       "laundry": [
        "shirt",
        "towel",
        "shirt"
       ],
       "sfx": [
        {
         "text": "ポカポカ",
         "size": "s"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.7,
         "expr": "nervous",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.48,
         "expr": "worried",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.18,
         "expr": "normal",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あっつい\nわねぇ"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "お花が\nしおれてる"
        }
       ],
       "narr": "お昼すぎ"
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.6,
         "expr": "think",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "お花、\nのどが\nかわいてる？"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "smile",
         "pose": "float",
         "rain": 2
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "サァァ…",
         "size": "s"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.42,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "mom",
         "x": 0.42,
         "expr": "smile",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あら、\nすずしい"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.6,
         "expr": "happy",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.15,
         "expr": "nervous",
         "pose": "stand",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "あんた、\n便利ねぇ"
        },
        {
         "who": "haru",
         "type": "whisper",
         "text": "お母さん…"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        },
        {
         "id": "moku",
         "x": 0.32,
         "expr": "happy",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "ありがとね、\nモク"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "えへへ"
        }
       ],
       "narr": "夕方"
      },
      {
       "shot": "full",
       "bg": "sky",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "think",
         "pose": "float",
         "look": "up"
        }
       ],
       "say": []
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.4,
         "expr": "sad",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "think",
         "text": "…みんな"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.3,
         "expr": "sad",
         "pose": "float",
         "color": "gray",
         "rain": 1
        },
        {
         "id": "haru",
         "x": 0.7,
         "expr": "worried",
         "pose": "stand",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "モク…？"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.26,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        },
        {
         "id": "haru",
         "x": 0.62,
         "expr": "normal",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "おうちに\n帰りたい？"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "…うん"
        }
       ],
       "props": [
        "bucket"
       ],
       "narr": "その夜"
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.38,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "でも\nぼく\n小さいから"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "cry",
         "pose": "float",
         "color": "gray",
         "rain": 1
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "高く\nとべないの"
        }
       ],
       "props": [
        "bucket"
       ],
       "sfx": [
        {
         "text": "ポタ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "room",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.77,
         "expr": "think",
         "pose": "think",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.3,
         "expr": "sad",
         "pose": "stand",
         "face": "right",
         "hold": "none"
        },
        {
         "id": "moku",
         "x": 0.14,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "think",
         "text": "高く、\nねぇ…"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.32,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.66,
         "expr": "worried",
         "pose": "float",
         "look": "down"
        },
        {
         "id": "moku",
         "x": 0.5,
         "expr": "shock",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "papa",
         "type": "whisper",
         "text": "モクー"
        },
        {
         "who": "mama",
         "type": "whisper",
         "text": "どこー？"
        },
        {
         "who": "moku",
         "type": "shout",
         "text": "みんなだ！"
        }
       ],
       "narr": "次の朝"
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "determined",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "えいっ"
        }
       ],
       "sfx": [
        {
         "text": "ぴょん",
         "size": "m"
        }
       ],
       "fx": [
        "speedv"
       ]
      },
      {
       "shot": "up",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "cry",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "とどかない…"
        }
       ],
       "sfx": [
        {
         "text": "ぽふっ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "surprised",
         "pose": "stand",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "そうだ！"
        }
       ],
       "fx": [
        "exclaim"
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.3,
         "expr": "happy",
         "pose": "point",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "うんと笑えば\nふくらむよ！"
        },
        {
         "who": "haru",
         "type": "speech",
         "text": "とべる\nかも！"
        }
       ],
       "fx": [
        "focus"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      2,
      1
     ],
     "panels": [
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.45,
         "expr": "puff",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "あっぷっぷ",
         "size": "s"
        }
       ],
       "fx": [
        "focus",
        "impact"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "smile",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ふふ…"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "nervous",
         "pose": "jump",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [],
       "sfx": [
        {
         "text": "くねくね",
         "size": "s"
        },
        {
         "text": "くねっ",
         "size": "s"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "tone",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "sad",
         "pose": "float",
         "color": "gray"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "whisper",
         "text": "ごめん…\n笑えないよ"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.14,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.32,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.47,
         "expr": "cry",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.82,
         "expr": "determined",
         "pose": "hips",
         "face": "left",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "行っちゃう！"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "どいて、\nハル"
        }
       ],
       "sfx": [
        {
         "text": "ゴォォ",
         "size": "m"
        }
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1,
      2
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "normal",
         "pose": "stand",
         "face": "back",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "お母さんの\n本気を"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "black",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "determined",
         "pose": "stand",
         "face": "front",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "見せて\nあげる"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "bust",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "funny",
         "pose": "surprise",
         "face": "front",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.1,
         "expr": "shock",
         "pose": "stand",
         "face": "right",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "shout",
         "text": "べろべろ\nばあ〜っ！"
        }
       ],
       "sfx": [
        {
         "text": "ドーン",
         "size": "l"
        }
       ],
       "fx": [
        "focus",
        "impact"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.57,
         "expr": "shock",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "shout",
         "text": "ぶはっ"
        }
       ],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.48,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "あはは\nははっ！"
        }
       ],
       "fx": [
        "focus",
        "sparkle"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.45,
         "expr": "laugh",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.2,
         "expr": "happy",
         "pose": "wave",
         "face": "right",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.78,
         "expr": "laugh",
         "pose": "cheer",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "とんでる！"
        },
        {
         "who": "haru",
         "type": "shout",
         "text": "いけーっ！"
        }
       ],
       "sfx": [
        {
         "text": "ぶわっ",
         "size": "l"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "full",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mama",
         "x": 0.7,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.25,
         "expr": "happy",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "mama",
         "type": "speech",
         "text": "モク！"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "sky",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.55,
         "expr": "laugh",
         "pose": "float"
        }
       ],
       "say": [
        {
         "who": "moku",
         "type": "speech",
         "text": "ありがとー！"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "rainbow",
       "time": "day",
       "weather": "rain",
       "cast": [
        {
         "id": "haru",
         "x": 0.38,
         "expr": "normal",
         "pose": "stand",
         "face": "back",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.56,
         "expr": "normal",
         "pose": "stand",
         "face": "back",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "にじだ…"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "うれし泣き\nかしらね"
        }
       ],
       "fx": [
        "sparkle"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.42,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "towel"
        },
        {
         "id": "haru",
         "x": 0.16,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "basket"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "今日も\nいい天気！"
        }
       ],
       "laundry": [
        "shirt",
        "towel",
        "shirt",
        "towel",
        "socks"
       ],
       "narr": "それから"
      },
      {
       "shot": "bg",
       "bg": "yard",
       "time": "day",
       "weather": "rain",
       "cast": [],
       "say": [],
       "sfx": [
        {
         "text": "サァ…",
         "size": "s"
        }
       ]
      },
      {
       "shot": "up",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "haru",
         "x": 0.5,
         "expr": "surprised",
         "pose": "stand",
         "face": "right",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "あっ！"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "yard",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.4,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.6,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.75,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.53,
         "expr": "happy",
         "pose": "wave",
         "face": "right",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.73,
         "expr": "smile",
         "pose": "hips",
         "face": "left",
         "look": "up",
         "hold": "none"
        }
       ],
       "say": [
        {
         "who": "haru",
         "type": "speech",
         "text": "モクー！"
        },
        {
         "who": "mom",
         "type": "speech",
         "text": "洗濯物には\n降らないでよー！"
        },
        {
         "who": "moku",
         "type": "whisper",
         "text": "はーい"
        }
       ],
       "laundry": [
        "shirt",
        "towel"
       ]
      }
     ]
    }
   ]
  },
  "profile": {
   "axes": {
    "humor": 0.7,
    "warmth": 0.9,
    "tension": 0.25,
    "tempo": 0.55,
    "dark": 0.05,
    "fantasy": 0.55,
    "romance": 0,
    "action": 0.2,
    "mystery": 0.1,
    "tearjerk": 0.35,
    "absurd": 0.4,
    "charDriven": 0.6,
    "talky": 0.3,
    "growth": 0.45,
    "everyday": 0.75,
    "scale": 0.1,
    "twist": 0.2,
    "afterglow": 0.3,
    "cute": 0.85,
    "smart": 0.2
   },
   "tags": {
    "genre": [
     "ほのぼの",
     "日常ファンタジー",
     "ホームコメディ"
    ],
    "setting": [
     "家の庭",
     "住宅街",
     "空"
    ],
    "protagonist": [
     "女の子",
     "雲の子"
    ],
    "age": [
     "子ども",
     "親子"
    ],
    "relation": [
     "親子",
     "友だち",
     "家族"
    ],
    "ending": [
     "ハッピーエンド",
     "大団円"
    ],
    "humor": [
     "変顔",
     "ちゃっかり",
     "ツッコミ"
    ],
    "motif": [
     "雲",
     "洗濯物",
     "虹",
     "笑顔"
    ]
   },
   "source": "editor"
  },
  "extras": {
   "characters": [
    {
     "id": "haru",
     "name": "ハル",
     "profile": "小学2年生、7さい。お母さんと二人で、物干しのある庭つきの家に住んでいる。口ぐせは「そうだ！」で、思いついたら考えるより先に口に出る。好きなものはにらめっことボタン集め（髪どめのボタンがいちばんのお気に入り）。苦手なものはかみなりの音。",
     "past": "去年、自分も遊園地で迷子になったことがある。",
     "secret": "迷子のこわさを知っているので、灰色で泣いているモクをほうっておけなかった。「まいごなんだ…」（p5）は、そのときを思い出した顔のつもりで描いている。",
     "designNote": "白黒の画面で遠くからでも一目で分かるよう、黒いおかっぱ・顔の付いたボタンの髪どめ・水玉のシャツを目印にした。第1稿ではしましまのシャツだったが、第1回の編集チェックで「有名な作品の少女キャラと雰囲気が少し近い」と言われ（直すかは任意）、念のため水玉に変えた。",
     "trivia": [
      "口ぐせは「そうだ！」（p11）",
      "髪どめを星形にする案もあったが、ありふれた形なのでボタンにした",
      "かみなりが苦手なので、モクが大きな雨雲にならなくてほっとしている"
     ]
    },
    {
     "id": "mom",
     "name": "お母さん",
     "profile": "30代なかば。家のことを一人で切り盛りしている。晴れた日曜に洗濯物を全部干すのが何よりの楽しみ。口ぐせは「〜わよ」「〜わねぇ」で、「あんた、便利ねぇ」（p8）のように思ったことがそのまま口に出る。好きなものは快晴、布団たたきの音、取り込んだ洗濯物のにおい。苦手なものは急な雨。",
     "past": "子どものころ、近所のにらめっこ大会で負けたことのない「変顔の名人」だった。大人になってからは封印していた。",
     "secret": "p13 の「お母さんの本気」は、何十年ぶりかの封印解除。ハルが驚いているのは、変顔そのものより「お母さんがこんな顔をできたなんて」の方が大きい。",
     "designNote": "髪をトーン（網点）にしたのは、ハルの黒髪と並んだとき髪の色だけで見分けられるようにするため。おだんご頭・白いエプロン・黒い長いスカートで、全身のシルエットもハルと変えた。目は第1回の編集チェックで、まつげのない目にそろえた。持ち物は第1稿ではほうきのつもりだったが、何を振り回しているか分からないと言われ、うずまき形の布団たたきにした。",
     "trivia": [
      "物語の最初の日に、苦手な「急な雨」がちょうど起きる",
      "最初は布団たたきで雲を追い払い、最後は同じ雲のために本気を出す"
     ]
    },
    {
     "id": "moku",
     "name": "モク",
     "profile": "ちいさな雨雲の子ども。生まれてまだ一年たっていない（雲として）。口ぐせは「えへへ」で、照れるとすぐこれ。好きなものは笑うこと、くすぐられること（p7）、花に水をあげること（p8）。苦手なものはひとりぼっちと強い風。",
     "past": "家族の中でいちばん小さく、まだ自分の力で高い空まで昇れない。ふだんはお父さん雲の後ろにくっついて旅をしているが、あの日は強い風で手を離してしまった。",
     "secret": "物干しに降りたのは、白いシャツが雲の仲間に見えたから。",
     "designNote": "色で気持ちを表すキャラクター。悲しいとトーンの灰色になって雨を降らせ、笑うと白くなってふくらむ。文字を読まなくても雲の色だけで気持ちが分かる。手足はなく、表情は目・眉・口だけ。",
     "trivia": [
      "口ぐせは「えへへ」",
      "編集チェックでは第1回から「残すべき良い点」に挙げられた"
     ]
    },
    {
     "id": "papa",
     "name": "雲のパパ",
     "profile": "モクのお父さん。旅する大きな白い雲。口ぐせは「うむ」（本編では「モクー」「どこー？」くらいしか言わない）。好きなものは夕焼けの空。苦手なものは子どもとはぐれること。",
     "past": "若いころは夕立を降らせる大きな雨雲だった。いまは落ち着いて、日陰を作る役目が気に入っている。",
     "designNote": "モクと同じ雲の形のまま、太い眉とひげで見分けがつくようにした。第1稿の p9 では顔のない灰色の雲だったが、第1回の編集チェックで「モクの家族だと分からない」と言われ、p11 と同じ顔にそろえた。",
     "trivia": []
    },
    {
     "id": "mama",
     "name": "雲のママ",
     "profile": "モクのお母さん。口ぐせは「あらあら」。好きなものは虹。苦手なものは子どもとはぐれること。",
     "past": "パパよりよく笑う。だからいつもふわふわで、パパより少し高いところを飛んでいる。",
     "designNote": "モクと同じ雲の形のまま、まつげで見分けがつくようにした。",
     "trivia": []
    }
   ],
   "world": [
    {
     "title": "雲の家族の旅",
     "body": "季節ごとに、雨の足りない土地を回っている。春は田んぼ、夏は花だん、秋は果樹園。モクの家族は「町の花だん係」で、エピローグ（p16）で花だんにだけ雨を降らせているのはその仕事。（作者が本編のあとで考えた裏設定）"
    },
    {
     "title": "泣くと雨、笑うとふくらむ",
     "body": "雲の体は水のつぶでできている。悲しいとつぶが重く集まって落ちてくる。灰色に見えるのは、つぶがぎゅっと詰まっているから。笑うと体の中に空気がたくさん入り、つぶの間が広がって白く軽くなり、上へ昇っていく。「ぷくっ」（p7）と「ぷくーっ」（p14）は、この仕組みを絵にしたもの。"
    },
    {
     "title": "うれし泣きと虹",
     "body": "うれしくて泣いた雨にだけ、日の光がよく通る。だから、うれし泣きのあとには虹が出る（p15）。"
    },
    {
     "title": "それからのモク",
     "body": "ときどき家族と町の上を通りかかり、ハルの家の花だんに水をやっていく。お母さんとの約束で、洗濯物には降らない。"
    }
   ],
   "authorNote": "洗濯物を干すと雨が降る。誰にでもある、ちょっと腹の立つ出来事を「犯人がいたら？」とひっくり返したのが始まりです。犯人が迷子で泣いている小さな雲の子どもだったら、怒っていたお母さんはどうするだろう。白黒なので、色の代わりに網点で「悲しいと灰色、うれしいと白」を絵で伝えると最初に決めました。\n苦労したのは p13 の変顔です。第1稿では腕が丸太のように巨大になり、「山場が絵の崩れに見える」と言われました。第2稿でひじを顔の横で曲げる形にし、顔も寄り目・鼻の穴・舌出しにしました。p4 では布団たたきの頭がハルの足の後ろに重なり、フラフープの中に立っているように見えたので、そのコマだけ布団たたきを描かないことにしました。クライマックスも、第1回の指摘を受けて、p7 の「ぷくっ」、p11 の空高い家族、p14 の「ぷく→ぷくぷく→ぷくーっ」を足し、15ページから16ページになりました。\nお気に入りは p13 上の段の「笑いが足りないのよ」から「お母さんの本気、見せてあげる」へ続くところと、読む向きに合わせてモクが大きくなる p14 上の段です。",
   "editorNote": "第1稿（15ページ）の第一印象は「骨組みがいい」。雲の色が気持ちを表すルールが絵だけで伝わり、お母さんの変わり方にも筋が通っていました。一方で、クライマックスの理屈、p13 の絵、文字のつぶれで読者が止まるため、第1回は必須9件・推奨14件・任意5件を返しました。\nいちばん大きかった直しは「笑うとふくらむ」の前振り（p7）と、ふくらむ瞬間を描く p14 の追加です。家族との距離も、p11 を縦長のコマにし、点線の矢印と鳥で「届かない」が絵だけで分かるようにしました。第2回で必須は1件（p4 の布団たたきの輪）まで減り、第3回で必須ゼロになりました。\n「完成」の決め手は、前振り（p7）・距離（p11）・ふくらむ瞬間（p14）・届いた（p15）が一本の線でつながり、山場が「理屈で納得できて、絵で笑える」形になったこと。そして、最初に残すべきと挙げた所が全部残っていたことです。",
   "foreshadowing": [
    {
     "setup": "p2「日曜日。朝からいい天気。」「洗濯日和ね！」",
     "payoff": "p16「今日もいい天気！」：1ページ目と最後が重なる"
    },
    {
     "setup": "p3「うちの洗濯物だけ…」「ピンポイントだね」",
     "payoff": "p16「洗濯物には降らないでよー！」「はーい」"
    },
    {
     "setup": "p4「ぽろぽろ」：泣くと雨になる",
     "payoff": "p15 の虹「うれし泣きかしらね」：悲しい雨がうれしい雨に"
    },
    {
     "setup": "p5「風がはやくて／みんなにおいてかれた」",
     "payoff": "p9 頭の上を流れる家族の雲 → p11 の再会"
    },
    {
     "setup": "p7「ぷくっ」「ふくらんだ？」",
     "payoff": "p11「うんと笑えばふくらむよ！」→ p14「ぷく→ぷくぷく→ぷくーっ」"
    },
    {
     "setup": "p7 お母さん「その子を笑わせ続けて！」",
     "payoff": "p13 お母さん自身の変顔：人に頼んだことを最後は自分でやる"
    },
    {
     "setup": "p10「高くとべないの」、お母さんの「高く、ねぇ…」",
     "payoff": "p13「笑いが足りないのよ」→「お母さんの本気、見せてあげる」"
    },
    {
     "setup": "p11 点線の矢印（地面から家族まで。届かない）",
     "payoff": "p15 点線の矢印（届いた）：同じ記号で対になる"
    }
   ],
   "scrapped": [
    {
     "idea": "第1稿 p7 下の段の、ハルの「くねくね」おどりで晴れにするミニコマ",
     "why": "小さいコマの効果音が黒いシミに見えると言われ、下の段を組み直したとき、モクが「ぷくっ」とふくらむ前振りのコマに差し替えた。おどりは p12 の空回りする場面に役目を移した。"
    },
    {
     "idea": "お風呂の湯気でモクを持ち上げる案（ネームの段階）",
     "why": "「温かい空気は上に昇る」では理科の実験になってしまい、「笑うと晴れる」というこの話のルールともつながらないため、「お母さんの変顔で笑わせる」に決めた。"
    }
   ],
   "sequelHints": [
    "モクの一家が遊びに来る。お父さん雲は大きいから、降らせる雨の量もけた違い（編集者の思いつき）",
    "お母さんとの約束「洗濯物には降らないで」を守れるかどうか（編集者の思いつき）",
    "「怒ると？」「くしゃみをすると？」など、新しい気持ちと新しい天気を一つずつ足していく（編集者の思いつき）",
    "ハルの顔の付いたボタンの髪どめは、本編では何の意味も持たせていない。続編で使うかは作者しだい"
   ],
   "visual": null
  },
  "meeting": null
 },
 {
  "meeting": null,
  "nameScript": {
   "title": "本日も大行列",
   "genre": "ほのぼの日常",
   "logline": "閉店を口止めされた漁師の孫ナギは、その秘密を町中にしゃべってしまい、罪ほろぼしに一言もしゃべらない。ところが町じゅうの人が写真館に押し寄せ、祖母は猫にだけ「計算どおり」とささやく。",
   "ending": "end",
   "characters": [
    {
     "id": "nagi",
     "name": "ナギ",
     "role": "孫・漁師",
     "species": "human",
     "age": "adult",
     "body": "tall",
     "hair": "messy",
     "hairColor": "black",
     "eyes": "round",
     "outfit": "hoodie",
     "pattern": "stripe",
     "items": [
      "headband"
     ],
     "desc": "はちまきの若い漁師"
    },
    {
     "id": "fumi",
     "name": "フミ",
     "role": "祖母・写真館の店主",
     "species": "human",
     "age": "elder",
     "body": "round",
     "hair": "bun",
     "hairColor": "white",
     "eyes": "narrow",
     "outfit": "apron",
     "pattern": "dots",
     "items": [
      "glasses",
      "camera"
     ],
     "desc": "眼鏡とカメラのおばあちゃん"
    },
    {
     "id": "kuro",
     "name": "クロ",
     "role": "看板猫",
     "species": "cat",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "black",
     "eyes": "sleepy",
     "outfit": "none",
     "pattern": "white",
     "items": [
      "crown"
     ],
     "desc": "紙の王冠をかぶった黒猫"
    },
    {
     "id": "gen",
     "name": "ゲン",
     "role": "酒屋の主人",
     "species": "human",
     "age": "adult",
     "body": "round",
     "hair": "bald",
     "hairColor": "black",
     "eyes": "dot",
     "outfit": "shirt",
     "pattern": "check",
     "items": [
      "mustache"
     ],
     "desc": "ひげの酒屋"
    },
    {
     "id": "mei",
     "name": "メイ",
     "role": "近所の子",
     "species": "human",
     "age": "child",
     "body": "normal",
     "hair": "twintail",
     "hairColor": "tone",
     "eyes": "sparkle",
     "outfit": "sailor",
     "pattern": "white",
     "items": [
      "ribbon"
     ],
     "desc": "リボンの女の子"
    }
   ],
   "cover": {
    "bg": "stage",
    "time": "day",
    "weather": "clear",
    "cast": [
     {
      "id": "nagi",
      "expr": "nervous",
      "pose": "hide"
     },
     {
      "id": "fumi",
      "expr": "smug",
      "pose": "hold",
      "hold": "camera"
     },
     {
      "id": "kuro",
      "expr": "sleepy",
      "pose": "sit"
     }
    ],
    "catch": "孫は今日、しゃべらない。"
   },
   "pages": [
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "blank",
         "pose": "sit"
        },
        {
         "id": "kuro",
         "expr": "sleepy",
         "pose": "sit"
        }
       ],
       "say": [],
       "narr": "【速報】ふじ写真館\n本日も大行列",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smile",
         "pose": "hold",
         "hold": "camera"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "いらっしゃい…\nって、ナギかい"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "カラン",
         "size": "s"
        }
       ],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat"
       ]
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "worried",
         "pose": "stand"
        },
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "hide"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "なんで\n黙ってるんだい"
        }
       ],
       "narr": "【速報】孫、今日は\nしゃべらない",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "washitsu",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "sit"
        },
        {
         "id": "nagi",
         "expr": "surprised",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "whisper",
         "text": "店を閉めるよ"
        },
        {
         "who": "fumi",
         "type": "whisper",
         "text": "誰にも\n言うんじゃないよ"
        }
       ],
       "narr": "【昨夜】",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      },
      {
       "shot": "bust",
       "bg": "washitsu",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "determined",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      },
      {
       "shot": "full",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "shock",
         "pose": "surprise"
        },
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "point"
        }
       ],
       "say": [
        {
         "who": "gen",
         "type": "shout",
         "text": "閉店！？"
        }
       ],
       "narr": "【けさ】",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "think",
         "pose": "armscross"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "誰にも\n言ってないね？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "shock",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat",
        "shake"
       ]
      },
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuro",
         "expr": "normal",
         "pose": "sit"
        },
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "【速報】孫、うなずく",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "bg",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "迷子の\nお知らせです"
        },
        {
         "who": "off",
         "type": "electric",
         "text": "坂の上の写真館\nをさがしている\n方…"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "surprised",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "迷子？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "smile",
         "pose": "wave"
        },
        {
         "id": "mei",
         "expr": "happy",
         "pose": "hold",
         "hold": "flower"
        }
       ],
       "say": [
        {
         "who": "gen",
         "type": "speech",
         "text": "写真、\n撮ってくれるかい"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "カラン",
         "size": "m"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      3,
      1
     ],
     "panels": [
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "shock",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat"
       ]
      },
      {
       "shot": "bg",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "迷子は\n三十人です"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "laugh",
         "pose": "cheer"
        },
        {
         "id": "mei",
         "expr": "happy",
         "pose": "jump"
        },
        {
         "id": "fumi",
         "expr": "surprised",
         "pose": "surprise"
        },
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "hide"
        }
       ],
       "say": [],
       "narr": "【速報】ほんとうに\n大行列",
       "sfx": [
        {
         "text": "ワイワイ",
         "size": "l"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "kneel"
        },
        {
         "id": "fumi",
         "expr": "normal",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "hips"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "…言ったね？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "laugh",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "さすが、\nわたしの孫だ"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "laugh",
         "pose": "cheer"
        },
        {
         "id": "mei",
         "expr": "happy",
         "pose": "wave"
        },
        {
         "id": "nagi",
         "expr": "happy",
         "pose": "stand"
        },
        {
         "id": "kuro",
         "expr": "smile",
         "pose": "sit"
        }
       ],
       "say": [],
       "narr": "【速報】ふじ写真館\n本日も大行列",
       "sfx": [
        {
         "text": "パシャ",
         "size": "l"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "kneel"
        },
        {
         "id": "kuro",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "whisper",
         "text": "あの子に話せば\n町中に伝わる"
        },
        {
         "who": "fumi",
         "type": "whisper",
         "text": "計算どおりさ"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "kuro",
         "expr": "smug",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "【速報】店主は\n何も知らなかった模様",
       "sfx": [],
       "fx": []
      }
     ]
    }
   ]
  },
  "extras": {
   "characters": [
    {
     "id": "nagi",
     "name": "ナギ",
     "profile": "二十六歳。坂の下の港で、祖母の写真館の二階に住む漁師。朝が早い。",
     "past": "子どものころ、祖母に撮ってもらった写真を一枚だけ持っていない。撮られる日に、魚市場へ逃げたから。",
     "secret": "漁船の名前を、まだ祖母に言えていない（写真館と同じ名前をつけた）。",
     "catchphrase": "（本編ではしゃべらない）",
     "likes": [
      "凪の朝",
      "祖母の味噌汁"
     ],
     "dislikes": [
      "写真に撮られること",
      "内緒話"
     ],
     "designNote": "はちまきとしま模様は海の男の記号。本編で一言もしゃべらないので、顔より体の動きで見える服を選んだ。",
     "basis": "創作"
    },
    {
     "id": "fumi",
     "name": "フミ",
     "profile": "七十八歳。坂の上の写真館の二代目。眼鏡は老眼鏡ではなく、ファインダー用。",
     "past": "若いころ、町の新聞の写真係だった。速報の見出しを考えるのが得意だった。",
     "secret": "閉店のお知らせの紙は、三年前から同じ一枚を使っている（孫に見せたのは今回で三度目）。",
     "catchphrase": "さすが、わたしの孫だ",
     "likes": [
      "行列",
      "焼きたてのせんべい"
     ],
     "dislikes": [
      "ピントの甘い写真",
      "正直すぎる見出し"
     ],
     "designNote": "丸い体型と水玉のエプロンで『ただのやさしいおばあちゃん』に見せて、得意げな顔とのズレを作った。",
     "basis": "創作"
    },
    {
     "id": "kuro",
     "name": "クロ",
     "profile": "写真館の看板猫。年齢不詳。紙の王冠は撮影用の小道具を勝手にかぶったもの。",
     "past": "もとは港の猫。ナギの船から写真館へ、勝手に引っ越してきた。",
     "secret": "三年前の『閉店のお知らせ』のときも、全部見ていた。",
     "catchphrase": "（猫なので無言）",
     "likes": [
      "日だまりの撮影台",
      "速報の時間"
     ],
     "dislikes": [
      "フラッシュ"
     ],
     "designNote": "最初は黒い毛だったが、最後のアップの得意顔が見えるように灰色の毛にして、服を着せた。",
     "basis": "どこをどう直したか3"
    },
    {
     "id": "gen",
     "name": "ゲン",
     "profile": "商店街の酒屋の主人。声が大きい。",
     "past": "フミの写真館で、結婚写真を撮った最初の客。",
     "secret": "放送の『迷子のお知らせ』を流そうと言い出したのは、じつはゲン。",
     "catchphrase": "閉店！？",
     "likes": [
      "記念写真",
      "町内放送"
     ],
     "dislikes": [
      "静かな商店街"
     ],
     "designNote": "ひげとチェックのシャツで、遠景でもすぐゲンだと分かるように。",
     "basis": "創作"
    },
    {
     "id": "mei",
     "name": "メイ",
     "profile": "近所の小学生。いつも花を一輪持ってくる。",
     "past": "写真館で撮った七五三の写真が、店のショーウィンドウに飾られている。",
     "secret": "ナギの秘密のしゃべり先の、最初の一人。",
     "catchphrase": "（本編ではしゃべらない）",
     "likes": [
      "リボン",
      "ショーウィンドウ"
     ],
     "dislikes": [
      "閉店"
     ],
     "designNote": "ツインテールとリボンで、群衆の中でも子どもだと一目で分かる形に。",
     "basis": "創作"
    }
   ],
   "world": {
    "summary": "坂の上の写真館『ふじ写真館』がある、港の小さな町。町内放送のスピーカーは、迷子と落とし物と、ときどき大事なお知らせを流す。",
    "rules": [
     "この町の迷子のお知らせは、本当の迷子より、集合の合図に使われることのほうが多い",
     "写真館の前の坂は、行列ができると港から見える"
    ],
    "places": [
     {
      "name": "ふじ写真館",
      "note": "撮影台の上の日だまりは、クロの指定席。"
     },
     {
      "name": "商店街",
      "note": "スピーカーは酒屋の屋根の上にある。"
     }
    ]
   },
   "authorAfterword": {
    "text": "くじで『主人公は一言もしゃべらない』を引いたとき、欠点が『秘密を守れない』だったので、しゃべらないのは罪ほろぼしなんだ、とすぐ決まりました。最初のネームでは、ナギは山場で土下座をするだけでした。編集さんから『黙ったままでもできる、自分で選んだ行動を一つ』と言われて、閉店のお知らせを黙って破るページを足しました。いちばん苦労したのは、その破るコマです。セリフが無いので、手を伸ばす形と効果音だけで伝えなければいけないコマでした。お気に入りは最後の猫のアップ。速報が最後まで嘘をつき、猫だけが本当のことを知っている顔をしています。くじにあった目覚まし時計は、一日の話の中で役目を作れず、使えませんでした。ごめんね、目覚まし時計。",
    "favoritePanel": "9-3",
    "hardestPanel": "7-3",
    "basis": [
     "作者の最初のネーム",
     "編集者の指摘1",
     "どこをどう直したか1",
     "使わなかった企画の種"
    ]
   },
   "editorNote": {
    "text": "絵柄は、古い新聞の挿絵のような細い線と斜線にしました。お話はほのぼのですが、笑いの芯は『速報が大真面目に嘘をつく』こと。絵まで報道写真のように大真面目にすると、嘘とのズレがくすぐったくなると考えました。ただ一コマ、最後の猫だけは頭を大きく崩して漫画らしくしています。真実を知る者の得意顔です。ネームからの大きな変更は、山場の前に1ページ足したこと。それから、看板猫を黒い毛から灰色に変えました。最後のアップで表情が見えなかったからです。ひらめきの種の『鉛筆の落書き帳』『設計図』『お菓子の包み紙』は、どれも今回は使いませんでした。",
    "basis": [
     "編集者が絵柄を決めたときの狙い",
     "どこをどう直したか1",
     "どこをどう直したか3",
     "採用しなかった「ひらめきの種」"
    ]
   },
   "foreshadowing": [
    {
     "setup": "2-1",
     "what": "嘘の速報『本日も大行列』と、からっぽの写真館",
     "payoff": "9-1",
     "how": "同じ構図、同じ見出しで、今度は本当の大行列"
    },
    {
     "setup": "3-1",
     "what": "口止めするフミの得意げな顔と、閉店のお知らせの紙",
     "payoff": "9-2",
     "how": "秘密を守れない孫に話したのは、わざとだった"
    },
    {
     "setup": "3-1",
     "what": "閉店のお知らせの紙",
     "payoff": "7-3",
     "how": "ナギが黙って破る"
    }
   ],
   "cutIdeas": [
    {
     "title": "孫、土下座だけで終わる",
     "what": "最初のネームの山場。ナギは土下座で謝るだけで、自分からは何もしなかった。",
     "whyCut": "主人公が山場で何もしていない、という編集の指摘で、破るページに変わった。",
     "basis": "作者の最初のネーム・編集者の指摘1"
    },
    {
     "title": "幻の目覚まし時計",
     "what": "くじで引いた小物。",
     "whyCut": "一日の話の中で役目を作れなかった。",
     "basis": "使わなかった企画の種"
    }
   ],
   "visual": {
    "designs": [],
    "nameVsFinal": [
     {
      "panel": "7-3",
      "comment": "ネームに無かったページ。黙って破るのが山場に"
     },
     {
      "panel": "9-3",
      "comment": "ネームでは黒猫。表情が見えず灰色の毛に"
     }
    ],
    "expressions": [
     {
      "id": "fumi",
      "expr": "smug",
      "comment": "smug：口止めと『計算どおり』。三回出てくる"
     },
     {
      "id": "nagi",
      "expr": "nervous",
      "comment": "nervous：しゃべれない孫の基本の顔"
     },
     {
      "id": "nagi",
      "expr": "determined",
      "comment": "determined：破るときだけの顔"
     },
     {
      "id": "kuro",
      "expr": "smug",
      "comment": "smug：最後のアップ。真実を知る顔"
     }
    ]
   },
   "sequelHints": [
    {
     "hint": "閉店のお知らせは、三年前にも一度あったらしい。",
     "root": "3-1"
    },
    {
     "hint": "ナギの船の名前を、フミはまだ知らない。",
     "root": "2-3"
    },
    {
     "hint": "放送の迷子は三十人。町の人が次に集まるのは、いつだろう。",
     "root": "6-2"
    }
   ]
  },
  "profile": {
   "axes": {
    "humor": 0.62,
    "warmth": 0.82,
    "tension": 0.3,
    "tempo": 0.6,
    "dark": 0.1,
    "fantasy": 0.1,
    "romance": 0,
    "action": 0.2,
    "mystery": 0.45,
    "tearjerk": 0.4,
    "absurd": 0.35,
    "charDriven": 0.6,
    "talky": 0.3,
    "growth": 0.45,
    "everyday": 0.85,
    "scale": 0.05,
    "twist": 0.75,
    "afterglow": 0.35,
    "cute": 0.5,
    "smart": 0.55
   },
   "tags": {
    "genre": [
     "ほのぼの",
     "コメディ"
    ],
    "setting": [
     "写真館",
     "商店街"
    ],
    "protagonist": [
     "人間"
    ],
    "age": [
     "大人"
    ],
    "relation": [
     "祖母と孫"
    ],
    "ending": [
     "どんでん返し"
    ],
    "humor": [
     "ほっこり",
     "とぼけた"
    ],
    "motif": [
     "速報",
     "嘘",
     "写真"
    ]
   }
  },
  "id": "sample-honjitsu",
  "script": {
   "title": "本日も大行列",
   "genre": "ほのぼの日常",
   "logline": "閉店を口止めされた漁師の孫ナギは、その秘密を町中にしゃべってしまい、罪ほろぼしに一言もしゃべらない。ところが町じゅうの人が写真館に押し寄せ、祖母は猫にだけ「計算どおり」とささやく。",
   "ending": "end",
   "characters": [
    {
     "id": "nagi",
     "name": "ナギ",
     "role": "孫・漁師",
     "species": "human",
     "age": "adult",
     "body": "tall",
     "hair": "messy",
     "hairColor": "black",
     "eyes": "round",
     "outfit": "hoodie",
     "pattern": "stripe",
     "items": [
      "headband"
     ],
     "desc": "はちまきの若い漁師"
    },
    {
     "id": "fumi",
     "name": "フミ",
     "role": "祖母・写真館の店主",
     "species": "human",
     "age": "elder",
     "body": "round",
     "hair": "bun",
     "hairColor": "white",
     "eyes": "narrow",
     "outfit": "apron",
     "pattern": "dots",
     "items": [
      "glasses"
     ],
     "desc": "眼鏡のおばあちゃん"
    },
    {
     "id": "kuro",
     "name": "クロ",
     "role": "看板猫",
     "species": "cat",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "tone",
     "eyes": "sleepy",
     "outfit": "suit",
     "pattern": "black",
     "items": [
      "crown"
     ],
     "desc": "紙の王冠をかぶった灰色の猫"
    },
    {
     "id": "gen",
     "name": "ゲン",
     "role": "酒屋の主人",
     "species": "human",
     "age": "adult",
     "body": "round",
     "hair": "bald",
     "hairColor": "black",
     "eyes": "dot",
     "outfit": "shirt",
     "pattern": "check",
     "items": [
      "mustache"
     ],
     "desc": "ひげの酒屋"
    },
    {
     "id": "mei",
     "name": "メイ",
     "role": "近所の子",
     "species": "human",
     "age": "child",
     "body": "normal",
     "hair": "twintail",
     "hairColor": "tone",
     "eyes": "sparkle",
     "outfit": "sailor",
     "pattern": "white",
     "items": [
      "ribbon"
     ],
     "desc": "リボンの女の子"
    }
   ],
   "cover": {
    "bg": "stage",
    "time": "day",
    "weather": "clear",
    "cast": [
     {
      "id": "nagi",
      "expr": "nervous",
      "pose": "hide"
     },
     {
      "id": "fumi",
      "expr": "smug",
      "pose": "hold",
      "hold": "camera"
     },
     {
      "id": "kuro",
      "expr": "sleepy",
      "pose": "sit"
     }
    ],
    "catch": "孫は今日、しゃべらない。"
   },
   "pages": [
    {
     "rows": [
      1,
      2,
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "blank",
         "pose": "sit"
        },
        {
         "id": "kuro",
         "expr": "sleepy",
         "pose": "sit"
        }
       ],
       "say": [],
       "narr": "【速報】ふじ写真館\n本日も大行列",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smile",
         "pose": "hold",
         "hold": "camera"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "いらっしゃい…\nって、ナギかい"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "カラン",
         "size": "s"
        }
       ],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat"
       ]
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "worried",
         "pose": "stand"
        },
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "hide"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "なんで\n黙ってるんだい"
        }
       ],
       "narr": "【速報】孫、今日は\nしゃべらない",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "washitsu",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "hold",
         "hold": "letter"
        },
        {
         "id": "nagi",
         "expr": "surprised",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "whisper",
         "text": "店を閉めるよ"
        },
        {
         "who": "fumi",
         "type": "whisper",
         "text": "誰にも\n言うんじゃないよ"
        }
       ],
       "narr": "【昨夜】",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      },
      {
       "shot": "bust",
       "bg": "washitsu",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "determined",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      },
      {
       "shot": "full",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "shock",
         "pose": "surprise"
        },
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "point"
        }
       ],
       "say": [
        {
         "who": "gen",
         "type": "shout",
         "text": "閉店！？"
        }
       ],
       "narr": "【けさ】",
       "sfx": [],
       "fx": [
        "flashback"
       ]
      }
     ]
    },
    {
     "rows": [
      2,
      1
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "think",
         "pose": "armscross"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "誰にも\n言ってないね？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "shock",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat",
        "shake"
       ]
      },
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuro",
         "expr": "normal",
         "pose": "sit"
        },
        {
         "id": "nagi",
         "expr": "nervous",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "【速報】孫、うなずく",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "bg",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "迷子の\nお知らせです"
        },
        {
         "who": "off",
         "type": "electric",
         "text": "写真館を\nさがしている方…"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "surprised",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "迷子？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "smile",
         "pose": "wave"
        },
        {
         "id": "mei",
         "expr": "happy",
         "pose": "hold",
         "hold": "flower"
        }
       ],
       "say": [
        {
         "who": "gen",
         "type": "speech",
         "text": "写真、\n撮ってくれるかい"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "カラン",
         "size": "m"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      3,
      1
     ],
     "panels": [
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "shock",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "sweat"
       ]
      },
      {
       "shot": "bg",
       "bg": "street",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "迷子は\n三十人です"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "long",
       "bg": "stage",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "laugh",
         "pose": "cheer"
        },
        {
         "id": "mei",
         "expr": "happy",
         "pose": "jump"
        },
        {
         "id": "fumi",
         "expr": "surprised",
         "pose": "surprise"
        },
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "hide"
        }
       ],
       "say": [],
       "narr": "【速報】ほんとうに\n大行列",
       "sfx": [
        {
         "text": "ワイワイ",
         "size": "l"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      2,
      1
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "worried",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "gen",
         "type": "speech",
         "text": "閉店って、\nほんとかい？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "sad",
         "pose": "hold",
         "hold": "letter"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "それはね…"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "determined",
         "pose": "reach",
         "hold": "letter"
        },
        {
         "id": "fumi",
         "expr": "surprised",
         "pose": "surprise"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [
        {
         "text": "ビリッ",
         "size": "l"
        }
       ],
       "fx": [
        "impact",
        "focus"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "nagi",
         "expr": "cry",
         "pose": "kneel"
        },
        {
         "id": "fumi",
         "expr": "normal",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "hips"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "…言ったね？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "laugh",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "speech",
         "text": "さすが、\nわたしの孫だ"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "stage",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "gen",
         "expr": "laugh",
         "pose": "cheer"
        },
        {
         "id": "mei",
         "expr": "laugh",
         "pose": "wave"
        },
        {
         "id": "nagi",
         "expr": "happy",
         "pose": "stand"
        },
        {
         "id": "kuro",
         "expr": "smile",
         "pose": "sit"
        }
       ],
       "say": [],
       "narr": "【速報】ふじ写真館\n本日も大行列",
       "sfx": [
        {
         "text": "パシャ",
         "size": "l"
        }
       ],
       "fx": [
        "sparkle"
       ]
      },
      {
       "shot": "full",
       "bg": "stage",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "fumi",
         "expr": "smug",
         "pose": "stand"
        },
        {
         "id": "kuro",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "fumi",
         "type": "whisper",
         "text": "あの子に話せば\n町中に伝わる"
        },
        {
         "who": "fumi",
         "type": "whisper",
         "text": "計算どおりさ"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "stage",
       "time": "night",
       "weather": "clear",
       "cast": [
        {
         "id": "kuro",
         "expr": "smug",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "【速報】店主は\n何も知らなかった模様",
       "sfx": [],
       "fx": [],
       "art": {
        "headRatio": 2.8,
        "deform": 0.85,
        "hatching": 0,
        "crossHatch": 0,
        "softness": 0.8,
        "grain": 0,
        "eyeStyle": "dot",
        "note": "真実を知る猫だけ漫画に"
       }
      }
     ]
    }
   ],
   "art": {
    "line": {
     "weight": 0.35,
     "taper": 0.8,
     "jitter": 0.05,
     "roughness": 0.1
    },
    "headRatio": 6.2,
    "deform": 0.15,
    "eyeSize": 0.3,
    "hatching": 0.7,
    "crossHatch": 0.35,
    "black": 0.35,
    "tone": 0.15,
    "detail": 0.75,
    "perspective": 0.3,
    "dynamism": 0.15,
    "sparkle": 0,
    "softness": 0.2,
    "grain": 0.45,
    "eyeStyle": "simple",
    "toneKind": "kakeami",
    "panelFrame": "clean",
    "direction": "古い新聞の挿絵のように、細い線と斜線で陰影をつける。頭身は高め、表情は控えめに描き、速報のナレーションが『報道写真』の上に乗っているように見せる。トーンは使わず、斜線と紙のざらつきで。",
    "aim": "町の小さな嘘を、新聞写真の大真面目さで",
    "reason": "話はほのぼのだが、笑いの芯は『速報が大真面目に嘘をつく』ことにある。絵まで大真面目な報道調にすると、嘘とのズレがくすぐったさになる。最後の猫だけを漫画らしく崩して、真実を知る者の得意顔を際立たせる。"
   }
  },
  "meta": {
   "mode": "sample",
   "bundled": true,
   "seedNote": "ジャンル: ほのぼの日常／語り口: ニュース速報の調子／舞台: 町の写真館／主人公: 二十代の漁師（秘密を守れない）／関係性: 祖父母と孫／葛藤: 大事な人に嘘をついてしまった／目的: 店をつぶさない／仕掛け: 語り手が嘘をついている／結末: 動物だけが真実を知っている／小物: 紙の王冠・目覚まし時計・迷子のお知らせ放送／制約: 主人公は一言もしゃべらない",
   "memo": {
    "core": "秘密を守れない漁師の孫が、祖母の閉店の秘密を町中にしゃべってしまい、罪ほろぼしに一言もしゃべらない一日で写真館を救う話",
    "hook": "「本日も大行列」という速報のナレーションの下で、写真館はからっぽ（ナレーションの嘘が絵でばれる）",
    "turn": "4ページ目：町内放送の「迷子のお知らせ」で、写真館をさがす人が次々に来る（孫がしゃべったせいだと分かる）",
    "climax": "6ページ目：閉店は本当かと訊かれ、口ごもる祖母の手から、孫が黙って閉店のお知らせを取って破る。7ページ目：声を出さずに土下座で謝る",
    "punch": "1ページ目と同じ構図で、今度は本当に大行列。祖母は猫にだけ「計算どおり」とささやく。速報は最後まで嘘をつく",
    "foreshadow": [
     {
      "setup": "3ページ1コマ目：祖母が口止めするときの得意げな顔",
      "payoff": "8ページ2コマ目：わざと孫に話したと分かる"
     },
     {
      "setup": "2ページ1コマ目：嘘の速報『本日も大行列』",
      "payoff": "8ページ1コマ目：同じ構図で本当になる"
     },
     {
      "setup": "3ページ1コマ目：祖母が見せた閉店のお知らせの紙",
      "payoff": "6ページ3コマ目：孫が破る"
     }
    ],
    "change": "自分の欠点を恥じて口を閉じていた孫が、欠点ごと祖母に頼られていたと知る（本人は知らないまま）",
    "motifPlan": "紙の王冠は写真館の看板猫クロがいつもかぶっている。迷子のお知らせ放送は電話・機械の声（electric）で画面の外から",
    "dropped": "目覚まし時計：一日の話の中で役目を作れなかった"
   },
   "editor": [
    {
     "stage": "name",
     "verdict": "ok",
     "notes": [
      "5ページ1コマ目の放送は、二つ目の吹き出しを9字に詰めた（写真館を／さがしている方…）",
      "最後のページの祖母は座らせると頭が沈むので立たせた"
     ],
     "originality": "問題なし（速報口調の語りも、祖母の計算も、既存作品の筋に寄っていない）",
     "feeling": "くすぐったい",
     "approach": "対位",
     "panelArt": [
      {
       "page": 9,
       "panel": 3,
       "art": {
        "headRatio": 2.8,
        "deform": 0.85,
        "hatching": 0,
        "crossHatch": 0,
        "softness": 0.8,
        "grain": 0,
        "eyeStyle": "dot",
        "note": "真実を知る猫だけ漫画に"
       },
       "note": "真実を知る猫だけ漫画に"
      }
     ]
    }
   ],
   "note": "prompts.js の指示文に従って企画・脚本担当が書いた見本。nameScript は最初のネーム",
   "extrasHistory": {
    "firstDraft": "7ページ。孫は閉店の秘密を町中にしゃべってしまい、罪ほろぼしに一言もしゃべらない。町の人が押し寄せ、山場で孫は土下座し、祖母は「言ったね？」と笑う。最後に祖母は猫にだけ「計算どおり」とささやく。",
    "editorNotes": [
     "主人公が山場で何もしていない。黙ったままでもできる「自分で選んだ行動」を一つ入れる",
     "ナレーションの速報口調は語り口として残してよい",
     "黒い毛の猫は最後のアップで表情が見えない"
    ],
    "changes": [
     "山場の前に1ページ足し、閉店は本当かと訊かれて口ごもる祖母の手から、孫が黙って閉店のお知らせを取って破るようにした",
     "3ページ1コマ目で、祖母が閉店のお知らせの紙を見せるようにした（破る場面の伏線）",
     "看板猫クロの毛を黒から灰色にし、服を着せた",
     "最後のページの祖母を、座りから立ちに変えた（頭がコマから沈むため）",
     "町内放送の吹き出しを9字に詰めた"
    ],
    "artDecision": {
     "feeling": "くすぐったい",
     "approach": "対位",
     "aim": "町の小さな嘘を、新聞写真の大真面目さで",
     "direction": "古い新聞の挿絵のように、細い線と斜線で陰影をつける。頭身は高め、表情は控えめに描き、速報のナレーションが『報道写真』の上に乗っているように見せる。トーンは使わず、斜線と紙のざらつきで。",
     "reason": "話はほのぼのだが、笑いの芯は『速報が大真面目に嘘をつく』ことにある。絵まで大真面目な報道調にすると、嘘とのズレがくすぐったさになる。最後の猫だけを漫画らしく崩して、真実を知る者の得意顔を際立たせる。",
     "panelArt": [
      {
       "page": 9,
       "panel": 3,
       "art": {
        "headRatio": 0.85,
        "deform": 0.85,
        "hatching": 0,
        "crossHatch": 0,
        "softness": 0.8,
        "grain": 0,
        "eyeStyle": "dot",
        "note": "真実を知る猫だけ漫画に"
       },
       "note": "真実を知る猫だけ漫画に"
      }
     ]
    },
    "droppedSeeds": [
     "目覚まし時計（一日の話の中で役目を作れなかった）"
    ]
   }
  }
 },
 {
  "meeting": null,
  "nameScript": {
   "title": "これは父です",
   "genre": "不条理ギャグ",
   "logline": "毎日ひとつずつ物が消える世界で、着ぐるみの父は無表情に弁当を食べる。父の正体は世界を片付ける消し職人で、明日の注文は『父』だった。",
   "ending": "end",
   "characters": [
    {
     "id": "kuma",
     "name": "父",
     "role": "着ぐるみの中の人・消し職人",
     "species": "bear",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "light",
     "eyes": "dot",
     "outfit": "none",
     "pattern": "white",
     "items": [
      "key"
     ],
     "desc": "鍵を下げた、無表情なくまの着ぐるみ"
    },
    {
     "id": "mimi",
     "name": "ミミ",
     "role": "しっかり者の娘",
     "species": "human",
     "age": "child",
     "body": "slim",
     "hair": "bob",
     "hairColor": "black",
     "eyes": "sharp",
     "outfit": "uniform",
     "pattern": "check",
     "items": [
      "glasses"
     ],
     "desc": "眼鏡のしっかり者"
    },
    {
     "id": "kero",
     "name": "かえる",
     "role": "砂漠のかえる",
     "species": "frog",
     "age": "adult",
     "body": "normal",
     "hair": "short",
     "hairColor": "tone",
     "eyes": "round",
     "outfit": "none",
     "pattern": "white",
     "items": [],
     "desc": "ずっと見ているかえる"
    },
    {
     "id": "chichi",
     "name": "父（中の人）",
     "role": "着ぐるみを脱いだ父",
     "species": "human",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "black",
     "eyes": "dot",
     "outfit": "shirt",
     "pattern": "white",
     "items": [],
     "desc": "後ろ姿だけの父"
    }
   ],
   "cover": {
    "bg": "desert",
    "time": "day",
    "weather": "clear",
    "cast": [
     {
      "id": "kuma",
      "expr": "blank",
      "pose": "stand"
     },
     {
      "id": "mimi",
      "expr": "determined",
      "pose": "hold",
      "hold": "food"
     },
     {
      "id": "kero",
      "expr": "surprised",
      "pose": "sit"
     }
    ],
    "catch": "父の顔は、だれも知らない。"
   },
   "pages": [
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "normal",
         "pose": "stand"
        },
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "これはさばくです。\nきのうまで海でした。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "これは父です。\n父は着ぐるみです。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "smile",
         "pose": "hold",
         "hold": "food"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "お父さん、\nお弁当"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "sit",
         "hold": "food"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "うむ"
        }
       ],
       "narr": "父の顔は\nだれも知りません。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "think",
         "pose": "hold",
         "hold": "book"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "月曜は海、\n火曜は町"
        },
        {
         "who": "mimi",
         "type": "speech",
         "text": "今日は何が\n消えるかな"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "worried",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "それ、\n何の鍵？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "armscross"
        },
        {
         "id": "kero",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "仕事の鍵だ"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "ケロ",
         "size": "s"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "walk"
        },
        {
         "id": "mimi",
         "expr": "nervous",
         "pose": "hide"
        }
       ],
       "say": [],
       "narr": "父は毎日夕方に\nひみつの場所へ行きます。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bg",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [],
       "say": [],
       "narr": "これは電話ボックスです。\nさばくのまん中にあります。",
       "sfx": [
        {
         "text": "リリリン",
         "size": "m"
        }
       ],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "はい、\n消し屋です"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        },
        {
         "id": "mimi",
         "expr": "shock",
         "pose": "surprise"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "明日は\n何を消しますか"
        }
       ],
       "narr": "父は世界を\n片付ける職人でした。",
       "sfx": [],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "rage",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "shout",
         "text": "海を消したの、\nお父さん！？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "shrug"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "注文だから"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      2,
      1
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        }
       ],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "明日は\n『父』を\nお願いします"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "cry",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "long",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        },
        {
         "id": "kero",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "かしこまりました"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": [
        "gloom"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "angry",
         "pose": "point"
        },
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "shout",
         "text": "断ってよ！"
        },
        {
         "who": "kuma",
         "type": "speech",
         "text": "職人は\n断らない"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "point"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "ただし、\n読み方は\n職人が決める"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "surprised",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "question"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "reach"
        }
       ],
       "say": [],
       "narr": "父は着ぐるみです。",
       "sfx": [
        {
         "text": "カチャリ",
         "size": "l"
        }
       ],
       "fx": [
        "magic",
        "focus"
       ]
      },
      {
       "shot": "long",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "chichi",
         "expr": "normal",
         "pose": "walk",
         "face": "back"
        },
        {
         "id": "mimi",
         "expr": "happy",
         "pose": "walk",
         "face": "back"
        },
        {
         "id": "kero",
         "expr": "shock",
         "pose": "surprise",
         "face": "front"
        }
       ],
       "say": [
        {
         "who": "kero",
         "type": "shout",
         "text": "ケロ！？"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "ザッザッ",
         "size": "s"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kero",
         "expr": "smug",
         "pose": "sit"
        }
       ],
       "say": [],
       "narr": "これはかえるです。\nかえるは父の顔を知っています。",
       "sfx": [],
       "fx": []
      }
     ]
    }
   ]
  },
  "extras": null,
  "profile": {
   "axes": {
    "humor": 0.7,
    "warmth": 0.6,
    "tension": 0.35,
    "tempo": 0.5,
    "dark": 0.3,
    "fantasy": 0.75,
    "romance": 0,
    "action": 0.15,
    "mystery": 0.5,
    "tearjerk": 0.35,
    "absurd": 0.9,
    "charDriven": 0.55,
    "talky": 0.35,
    "growth": 0.3,
    "everyday": 0.3,
    "scale": 0.55,
    "twist": 0.75,
    "afterglow": 0.6,
    "cute": 0.45,
    "smart": 0.65
   },
   "tags": {
    "genre": [
     "不条理ギャグ"
    ],
    "setting": [
     "砂漠"
    ],
    "protagonist": [
     "くま（着ぐるみ）"
    ],
    "age": [
     "大人"
    ],
    "relation": [
     "親子"
    ],
    "ending": [
     "動物だけが知っている"
    ],
    "humor": [
     "シュール",
     "真顔"
    ],
    "motif": [
     "例文",
     "鍵",
     "弁当"
    ]
   }
  },
  "id": "sample-korechichi",
  "script": {
   "title": "これは父です",
   "genre": "不条理ギャグ",
   "logline": "毎日ひとつずつ物が消える世界で、着ぐるみの父は無表情に弁当を食べる。父の正体は世界を片付ける消し職人で、明日の注文は『父』だった。",
   "ending": "end",
   "characters": [
    {
     "id": "kuma",
     "name": "父",
     "role": "着ぐるみの中の人・消し職人",
     "species": "bear",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "light",
     "eyes": "dot",
     "outfit": "jersey",
     "pattern": "white",
     "items": [
      "key"
     ],
     "desc": "鍵を下げた、無表情なくまの着ぐるみ（ジャージ）"
    },
    {
     "id": "mimi",
     "name": "ミミ",
     "role": "しっかり者の娘",
     "species": "human",
     "age": "child",
     "body": "slim",
     "hair": "bob",
     "hairColor": "black",
     "eyes": "sharp",
     "outfit": "uniform",
     "pattern": "check",
     "items": [
      "glasses"
     ],
     "desc": "眼鏡のしっかり者"
    },
    {
     "id": "kero",
     "name": "かえる",
     "role": "砂漠のかえる",
     "species": "frog",
     "age": "adult",
     "body": "normal",
     "hair": "short",
     "hairColor": "tone",
     "eyes": "round",
     "outfit": "tshirt",
     "pattern": "dots",
     "items": [],
     "desc": "ずっと見ているかえる"
    },
    {
     "id": "chichi",
     "name": "父（中の人）",
     "role": "着ぐるみを脱いだ父",
     "species": "human",
     "age": "adult",
     "body": "round",
     "hair": "short",
     "hairColor": "black",
     "eyes": "dot",
     "outfit": "shirt",
     "pattern": "white",
     "items": [],
     "desc": "後ろ姿だけの父"
    }
   ],
   "cover": {
    "bg": "desert",
    "time": "day",
    "weather": "clear",
    "cast": [
     {
      "id": "kuma",
      "expr": "blank",
      "pose": "stand"
     },
     {
      "id": "mimi",
      "expr": "determined",
      "pose": "hold",
      "hold": "food"
     },
     {
      "id": "kero",
      "expr": "surprised",
      "pose": "sit"
     }
    ],
    "catch": "父の顔は、だれも知らない。"
   },
   "pages": [
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "normal",
         "pose": "stand"
        },
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "これはさばくです。\nきのうまで海でした。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "これは父です。\n父は着ぐるみです。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "smile",
         "pose": "hold",
         "hold": "food"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "お父さん、\nお弁当"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      2,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "sit",
         "hold": "food"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "うむ"
        }
       ],
       "narr": "父の顔は\nだれも知りません。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "think",
         "pose": "hold",
         "hold": "book"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "月曜は海、\n火曜は町"
        },
        {
         "who": "mimi",
         "type": "speech",
         "text": "今日は何が\n消えるかな"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mimi",
         "expr": "worried",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "speech",
         "text": "それ、\n何の鍵？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "armscross"
        },
        {
         "id": "kero",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "仕事の鍵だ"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "ケロ",
         "size": "s"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "long",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "walk"
        },
        {
         "id": "mimi",
         "expr": "nervous",
         "pose": "hide"
        }
       ],
       "say": [],
       "narr": "父は毎日夕方に\nひみつの場所へ行きます。",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bg",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [],
       "say": [],
       "narr": "これは電話ボックスです。\nさばくのまん中にあります。",
       "sfx": [
        {
         "text": "リリリン",
         "size": "m"
        }
       ],
       "fx": []
      },
      {
       "shot": "full",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "はい、\n消し屋です"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        },
        {
         "id": "mimi",
         "expr": "shock",
         "pose": "surprise"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "明日は\n何を消しますか"
        }
       ],
       "narr": "父は世界を\n片付ける職人でした。",
       "sfx": [],
       "fx": [
        "focus"
       ]
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "rage",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "shout",
         "text": "海を消したの、\nお父さん！？"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "evening",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "shrug"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "注文だから"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      2,
      1
     ],
     "panels": [
      {
       "shot": "bust",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "hold",
         "hold": "phone"
        }
       ],
       "say": [
        {
         "who": "off",
         "type": "electric",
         "text": "明日は\n『父』を\nお願いします"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "cry",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "long",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        },
        {
         "id": "kero",
         "expr": "normal",
         "pose": "sit"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "かしこまりました"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": [
        "gloom"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      2
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "angry",
         "pose": "point"
        },
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "stand"
        }
       ],
       "say": [
        {
         "who": "mimi",
         "type": "shout",
         "text": "断ってよ！"
        },
        {
         "who": "kuma",
         "type": "speech",
         "text": "職人は\n断らない"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "bust",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "point"
        }
       ],
       "say": [
        {
         "who": "kuma",
         "type": "speech",
         "text": "ただし、\n読み方は\n職人が決める"
        }
       ],
       "narr": "",
       "sfx": [],
       "fx": []
      },
      {
       "shot": "up",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "mimi",
         "expr": "surprised",
         "pose": "stand"
        }
       ],
       "say": [],
       "narr": "",
       "sfx": [],
       "fx": [
        "question"
       ]
      }
     ]
    },
    {
     "rows": [
      1,
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "night",
       "weather": "fog",
       "cast": [
        {
         "id": "kuma",
         "expr": "blank",
         "pose": "reach"
        }
       ],
       "say": [],
       "narr": "父は着ぐるみです。",
       "sfx": [
        {
         "text": "カチャリ",
         "size": "l"
        }
       ],
       "fx": [
        "magic",
        "focus"
       ],
       "art": {
        "headRatio": 7.5,
        "deform": 0,
        "hatching": 0.75,
        "crossHatch": 0.5,
        "black": 0.8,
        "detail": 0.85,
        "dynamism": 0.8,
        "line": {
         "weight": 0.7,
         "taper": 0.9
        },
        "eyeStyle": "realistic",
        "note": "職人の一瞬だけ劇画"
       }
      },
      {
       "shot": "long",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "chichi",
         "expr": "normal",
         "pose": "walk",
         "face": "back"
        },
        {
         "id": "mimi",
         "expr": "happy",
         "pose": "walk",
         "face": "back"
        },
        {
         "id": "kero",
         "expr": "shock",
         "pose": "surprise",
         "face": "front"
        }
       ],
       "say": [
        {
         "who": "kero",
         "type": "shout",
         "text": "ケロ！？"
        }
       ],
       "narr": "",
       "sfx": [
        {
         "text": "ザッザッ",
         "size": "s"
        }
       ],
       "fx": []
      }
     ]
    },
    {
     "rows": [
      1
     ],
     "panels": [
      {
       "shot": "full",
       "bg": "desert",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "kero",
         "expr": "smug",
         "pose": "hips"
        }
       ],
       "say": [],
       "narr": "これはかえるです。\nかえるは父の顔を知っています。",
       "sfx": [],
       "fx": []
      }
     ]
    }
   ],
   "art": {
    "line": {
     "weight": 0.3,
     "taper": 0.1,
     "jitter": 0,
     "roughness": 0
    },
    "headRatio": 4,
    "deform": 0.35,
    "eyeSize": 0.3,
    "hatching": 0,
    "crossHatch": 0,
    "black": 0.1,
    "tone": 0.05,
    "detail": 0.3,
    "perspective": 0.1,
    "dynamism": 0.05,
    "sparkle": 0,
    "softness": 0.3,
    "grain": 0,
    "eyeStyle": "dot",
    "toneKind": "none",
    "panelFrame": "borderless",
    "direction": "理科の教科書の図のように、均一な細い線、影なし、トーンなし、枠なし。人物は4頭身で正面か真横。例文のナレーションとさし絵がそのまま並んでいるように描く。父が鍵を回すコマだけ、7.5頭身の劇画で描く。",
    "aim": "教科書のさし絵のまま、父の一瞬だけ劇画",
    "reason": "語りが教科書の例文なので、絵もさし絵の無表情さに合わせると、とんでもない出来事が淡々と進むおかしさが立つ。職人として仕事をする一瞬だけ劇画にして、無表情な父の本気を絵で見せる。"
   }
  },
  "meta": {
   "mode": "sample",
   "bundled": true,
   "seedNote": "ジャンル: 不条理ギャグ × 職人もの／語り口: 教科書の例文の調子／舞台: 砂漠の真ん中の電話ボックス／主人公: 四十代の着ぐるみの中の人（感情が顔に出ない）／関係性: 親子（子のほうがしっかり者）／葛藤: 何かが毎日ひとつずつ消える／目的: 秘密の場所に行く／仕掛け: 劇中劇／結末: 動物だけが真実を知っている／小物: 手作りの弁当・霧・合鍵／制約: 一段一コマの大ゴマを三回以上使う",
   "memo": {
    "core": "顔に感情が出ない着ぐるみの父は、じつは世界を毎日ひとつずつ片付ける『消し職人』。明日消す注文が『父』だと知り、教科書の例文の理屈で切り抜ける話",
    "hook": "『これは　さばくです。きのうまで　海でした。』という教科書の例文と、砂漠に立つ着ぐるみの父",
    "turn": "4ページ目：娘があとをつけると、霧の電話ボックスで父が『明日は何を消しますか』と注文を受けている",
    "climax": "6ページ目：注文は『父』。父は合鍵を回し、例文『父は着ぐるみです』を盾に、着ぐるみのほうを消す",
    "punch": "着ぐるみが消えた父は後ろ姿だけ。正面から顔を見たかえるだけが『ケロ！？』と驚く。父の顔は、かえるだけが知っている",
    "foreshadow": [
     {
      "setup": "2ページ2コマ目：例文『父は　着ぐるみです。』",
      "payoff": "7ページ2コマ目：その例文を理屈にして、着ぐるみを消す"
     },
     {
      "setup": "3ページ3コマ目：父がいつも持っている合鍵（娘が『それ何の鍵？』）",
      "payoff": "7ページ1コマ目：合鍵で消す"
     },
     {
      "setup": "2ページ1コマ目：きのうまで海",
      "payoff": "4ページ：父が消していた"
     }
    ],
    "change": "何を消すときも無表情だった父が、娘のために初めて注文に逆らう（顔は最後まで無表情のまま）",
    "motifPlan": "弁当は娘が持つ food。霧は weather の fog。合鍵は父の items の key。電話ボックスは描けないので砂漠に電話を持つ父とナレーションで",
    "dropped": "劇中劇：例文の語りと消し職人の理屈で手いっぱいになり、劇中劇を入れると何の話か分からなくなるため"
   },
   "editor": [
    {
     "stage": "name",
     "verdict": "ok",
     "notes": [
      "父の『うむ』は無表情の顔だけでも伝わるが、弁当を受け取る手の動きで残した",
      "最後のページは、かえるの得意顔を大きく。引きの小さいかえるでは弱い"
     ],
     "originality": "問題なし",
     "feeling": "ぽかんとして、あとからじわっと温かい",
     "approach": "裏切り",
     "panelArt": [
      {
       "page": 8,
       "panel": 1,
       "art": {
        "headRatio": 7.5,
        "deform": 0,
        "hatching": 0.75,
        "crossHatch": 0.5,
        "black": 0.8,
        "detail": 0.85,
        "dynamism": 0.8,
        "line": {
         "weight": 0.7,
         "taper": 0.9
        },
        "eyeStyle": "realistic",
        "note": "職人の一瞬だけ劇画"
       },
       "note": "職人の一瞬だけ劇画"
      }
     ]
    }
   ],
   "note": "prompts.js の指示文に従って企画・脚本担当が書いた見本。nameScript は最初のネーム"
  }
 }
];
