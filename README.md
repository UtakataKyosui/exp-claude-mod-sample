# tool-timer — Claude Mods sample

Claude Code の早期アクセス機能 **Claude Mods**（旧称 Function Hooks）を試す、最小構成の Plugin です。すべてのツール呼び出しを関数フックで包み、実行中の notice と完了時の所要時間 toast を表示します。さらに `/tool-stats` スラッシュコマンドで、ツールごとの累計呼び出し回数と累計所要時間を確認できます。

## Claude Mods とは

Mod は、振る舞いを TypeScript の hooks module に実装した Claude Code Plugin です。入口は `register(on, options)` で、各フックは `($, event, next)` を受け取ります。

- `on(...)` はイベントと matcher に関数を登録します。
- `next(event)` は内側の Plugin または Claude Code 本体へ処理を渡します。
- `$` は UI、時計、ファイル、モデルなど、ホストが許可した副作用への窓口です。
- 登録順が middleware の入れ子順になります。先に登録されたフックほど外側です。
- `on('*', ...)` で Plugin 自身が `$` に対して行った呼び出しも含め、全イベントを観測できます。

従来の command / prompt / agent hook が外部プロセスを起動するのに対し、Function Hook は Claude Code 内のイベントを型付き関数として合成でき、入力・結果・UI まで扱える点が大きな違いです。

> [!WARNING]
> 2026-09-15 現在は早期アクセスです。公式案内でも API はリリース間で予告なく変わり得るとされています。

## 構成

```text
.
├── .claude-plugin/plugin.json  # Plugin manifest
├── hooks/
│   ├── hooks.json              # hooks module の宣言（modules は 1 エントリのみ）
│   ├── register.ts             # Mod 本体: hooks.json が指す唯一のエントリ
│   ├── stats.ts                # /tool-stats 用の集計・整形ロジック
│   └── format-duration.ts      # 所要時間の表示整形（共通）
├── tests/
│   ├── register.test.ts        # Claude Code 組み込み test runner 用
│   └── stats.test.ts
└── tsconfig.json
```

## 試し方

Claude Code 2.1.267 以降の早期アクセス版で、リポジトリ直下から実行します。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude --plugin-dir .
```

起動後に Claude にファイルを読ませるなど、何かツールを使わせてください。ツール実行中に `Timing Read…`、完了後に `Read finished in 42 ms` のように表示されます。

`/tool-stats` を実行すると、ツールごとの累計呼び出し回数と累計所要時間が一覧表示されます。集計は `$.store` に保存され、セッションをまたいで積み上がります。

```text
Read: 12 calls, 3.4 s total
Bash: 5 calls, 820 ms total
```

型定義は `.claude/types/` に置き、Claude Code のバージョンに合わせて生成します。`.gitignore` で除外しているため、clone 後にまず実行してください。

```text
/plugin-types
```

テストと manifest 検証は次の通りです。

```bash
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude plugin test .
claude plugin validate .
```

## 参考資料

- [公式提案・Community Update: Mods - make Claude 10x more extensible](https://github.com/anthropics/claude-code/issues/91870)
- [公式リポジトリの組み込み Mods](https://github.com/anthropics/claude-code/tree/main/mods)

このサンプルは公式リポジトリの `.claude-plugin/plugin.json`、`hooks/hooks.json`、`hooks/register.ts` という現在の構成に合わせています。
