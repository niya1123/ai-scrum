# Domain Specs

本ディレクトリは、PO/Architect/Planner が参照する領域固有の仕様（Domain Spec）を配置します。

- 既定の参照先は `DOMAIN_SPEC` 環境変数で指定します（未指定時は `domains/examples/travel-planner.md`）。
- 形式は自由（Markdown/MDX/YAML/JSON など）。PO はこの内容をもとにユーザーストーリーを生成します。

## 実装配置ポリシー（重要）
- 各ドメインの実装ルートは `domains/<primary-domain>/src/` とします。
  - `<primary-domain>` は `DOMAIN_SPEC` が指すファイルの直下ディレクトリ名（例: `domains/gomoku/gomoku.md` → `gomoku`）。
  - 新規に生成するAPI/UI/ドメインロジックは原則この `src/` 配下に作成してください。
  - 共有ユーティリティのみ、必要に応じてルート `src/` を使用しても構いません。

例:
- `domains/examples/travel-planner.md`: 既存MVP相当の仕様
- `domains/examples/todo-app.md`: ToDo管理アプリのサンプル仕様
