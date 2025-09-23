# ドメイン仕様格納ルール

このディレクトリには各スクラム実行で参照するドメイン仕様（Domain Spec）を配置します。オーケストレータは毎回 1 つの plan ファイルを読み込みます。

- 既定では `domains/examples/travel-planner/travel-planner-plan.md` が選択されます。別の仕様を使う場合は `npm run domain` にキーワードまたはファイルパスを渡してください。
- 新しいドメインを始めるには次のコマンドで雛形を作成します（既存ファイルはスキップされます）。
  ```
  npm run domain:init <ドメイン名> --title "Display Title"
  ```
  生成後は `domains/<ドメイン名>/<ドメイン名>-plan.md` を編集し、詳細仕様は `domains/<ドメイン名>/<ドメイン名>-spec.md` に追記してください。
- `domains/` 配下に複数の仕様ファイルを置いておき、実行時に目的のファイルを選択する運用も可能です。

`domains/examples/` に含まれるサンプルは仕様の粒度や書式の参考になります。
