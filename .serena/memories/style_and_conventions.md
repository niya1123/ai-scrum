# スタイル & 規約

## 基本原則（AGENTS.md 抜粋）
- 変更フロー: 「提案 → 実行」の二段階（提案は根拠/比較表つき、実行は差分パッチ/コマンド）
- 冪等性: 再実行に耐える。既存物を壊さない。失敗時はロールバック指示を含める。
- 受け入れ条件: ACに紐づくE2EがGreenになって初めてDone。

## コードスタイル
- 言語: TypeScript（ESM import）
- 非同期: `async/await` を基本、Nodeの `child_process` は `promisify` して使用
- ロギング: セクションを `=== Title ===` で明示（`logSection()`）
- 設定: `.env` を許容（`dotenv/config`）
- 命名: 環境変数は大文字+`_`、ファイル名は `kebab-case` を優先
- 例外/終了: タイムアウト/スタールを検知して安全終了（無限待機しない）

## ディレクトリ配置規約
- E2Eテスト: `tests/e2e/`
- APIサンプル/契約例: `docs/samples/api/`
- 実行ログ: `out/logs/`（成果物全般は `out/` 配下）
- ルート直下に新規ファイルを散在させない

## QAポリシー（必須）
- ランナー: MCP-Playwright のみ許可（`runner: "mcp"` を最終JSONに含める）。フォールバック検知時は `status=red`。
- ポート: 接続先は常に `process.env.PORT || 3000`。オーケストレータが各実行でエフェメラルPORTを割当。
- 判定: 最低3テスト（正常/バリデーション/異常）すべて pass → GREEN。それ以外は RED。
- 安定化: 明示的な待機・入力検証・クリック活性確認などのアンチフレーク手順を遵守。

## ドメイン仕様
- `DOMAIN_SPEC` 環境変数で PO に渡す仕様ファイルを切替（既定: `domains/examples/travel-planner.md`）。
- AC ID は `[A-Z]{2,5}-\d+` 形式推奨（例: TPA-001 / TDA-010 / MVP-01 など）。

## 未定義/要補完
- Linter/Formatter（ESLint/Prettier）の具体設定は未定。
- `package.json`/パッケージマネージャ選定は Architect ステージで確定予定。
