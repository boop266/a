/* manga/samples/index.js — 漫画工房に同梱する見本の作品
   1冊目『うちの物干しに雲がいる』（全16ページ＝表紙＋本文15ページ）。
   ・script     … 完成稿（manga/index.html の第3稿）を schema v4 に移したもの
   ・nameScript … 第1稿（git の「漫画: 第1稿『うちの物干しに雲がいる』（編集チェック前）」の manga/index.html）を同じ形に移したもの
   ・extras     … manga/extras/author.md（作者）と editor.md（編集者）から
   ・meeting    … この作品は、企画会議の工程ができる前に作られました。会議の記録はないので null にしています（作り話の会議は入れない）。
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
      "hairflower"
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
    "bg": "park",
    "time": "day",
    "weather": "clear",
    "catch": "うちの洗濯物にだけ、雨がふる。",
    "cast": [
     {
      "id": "mom",
      "pose": "hold",
      "hold": "box",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.2,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "洗濯日和ね！"
        }
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
         "hold": "none"
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
       "sfx": [
        {
         "text": "スッ…",
         "size": "m"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
         "hold": "broom"
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
       "bg": "park",
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
         "hold": "broom"
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
       "sfx": [
        {
         "text": "ザザアッ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.55,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "broom"
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
       "bg": "park",
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
         "expr": "funny",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
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
       "bg": "park",
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
       "shot": "full",
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.3,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.56,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.5,
         "expr": "shock",
         "pose": "float",
         "look": "up"
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
       "shot": "full",
       "bg": "plain",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.35,
         "expr": "worried",
         "pose": "float"
        },
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
       "bg": "park",
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
         "expr": "funny",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.1,
         "expr": "worried",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.24,
         "expr": "worried",
         "pose": "float"
        },
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
         "x": 0.11,
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
      3,
      1
     ],
     "panels": [
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
         "text": "ぷく",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.25,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.75,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.5,
         "expr": "laugh",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.42,
         "expr": "happy",
         "pose": "wave",
         "face": "right",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.56,
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
         "text": "とどいた！"
        },
        {
         "who": "haru",
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
       "bg": "street",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.42,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.16,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "今日も\nいい天気！"
        }
       ],
       "narr": "それから"
      },
      {
       "shot": "bg",
       "bg": "park",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "papa",
         "x": 0.14,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "mama",
         "x": 0.36,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "moku",
         "x": 0.27,
         "expr": "happy",
         "pose": "float"
        },
        {
         "id": "haru",
         "x": 0.8,
         "expr": "happy",
         "pose": "wave",
         "face": "left",
         "look": "up",
         "hold": "none"
        },
        {
         "id": "mom",
         "x": 0.55,
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
      "hairflower"
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
    "bg": "park",
    "time": "day",
    "weather": "clear",
    "catch": "うちの洗濯物にだけ、雨がふる。",
    "cast": [
     {
      "id": "mom",
      "pose": "hold",
      "hold": "box",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.2,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "洗濯日和ね！"
        }
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
         "hold": "none"
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
       "sfx": [
        {
         "text": "スッ…",
         "size": "m"
        }
       ]
      },
      {
       "shot": "bust",
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
         "hold": "broom"
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
       "bg": "park",
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
         "hold": "broom"
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
       "sfx": [
        {
         "text": "ザザーッ",
         "size": "m"
        }
       ]
      },
      {
       "shot": "full",
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.3,
         "expr": "shock",
         "pose": "fight",
         "face": "right",
         "hold": "broom"
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
       "bg": "park",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.5,
         "expr": "sad",
         "pose": "stand",
         "face": "left",
         "hold": "broom"
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
       "bg": "park",
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
         "expr": "funny",
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
       "bg": "park",
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
         "hold": "broom"
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
       "bg": "park",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [],
       "say": [],
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
       "time": "evening",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.72,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "park",
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
         "expr": "funny",
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
       "bg": "park",
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
       "bg": "park",
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
       "bg": "street",
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
       "bg": "park",
       "time": "day",
       "weather": "clear",
       "cast": [
        {
         "id": "mom",
         "x": 0.42,
         "expr": "happy",
         "pose": "reach",
         "face": "left",
         "hold": "none"
        },
        {
         "id": "haru",
         "x": 0.16,
         "expr": "smile",
         "pose": "hold",
         "face": "right",
         "hold": "box"
        }
       ],
       "say": [
        {
         "who": "mom",
         "type": "speech",
         "text": "今日も\nいい天気！"
        }
       ],
       "narr": "それから"
      },
      {
       "shot": "bg",
       "bg": "park",
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
       "bg": "park",
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
  "extras": null,
  "meeting": null
 }
];
