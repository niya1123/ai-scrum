# Domain Specs

本ディレクトリは、PO/Architect/Planner が参照する領域固有の仕様（Domain Spec）を配置します。

- 既定の参照先は `DOMAIN_SPEC` 環境変数で指定します（未指定時は `domains/examples/travel-planner.md`）。
- 形式は自由（Markdown/MDX/YAML/JSON など）。PO はこの内容をもとにユーザーストーリーを生成します。

例:
- `domains/examples/travel-planner.md`: 既存MVP相当の仕様
- `domains/examples/todo-app.md`: ToDo管理アプリのサンプル仕様

