# タスクアプリ ユーザーガイド

## 前提
- `npm install`
- `npm run dev` で `http://localhost:3000` が起動
- モダンブラウザ（Chrome/Edge/Safari 最新版）

## 画面概要
- タイトル: **Tasks**
- 入力フォーム: `id="new_task"`、プレースホルダー「Add a task and press Enter」
- タスクリスト: `[role=list][aria-label="tasks"]` に各行 `role=listitem`
- 空状態: `data-testid="empty-tasks"` を持つ `role=status`
- エラー表示: `<div role="alert">` にAPIエラーコードを表示

## 操作フロー
1. **タスクの作成**
   - フィールドにタイトルを入力し Enter。
   - 成功すると新規タスクがリスト先頭に追加され、入力はリセット、エラー表示が消えます。
   - 空白のみを送信すると `TITLE_REQUIRED` がアラートに表示されます。

2. **完了状態の切り替え**
   - 各行先頭のボタンは `role=checkbox`。クリックで `done` がトグルされ、`aria-checked` が同期。
   - 失敗時は `DONE_REQUIRED` や `TASK_NOT_FOUND` がアラートに表示され、リストは変わりません。

3. **タスクの削除**
   - 行末の `data-testid="delete-task"` ボタンを押すと即座にリストから削除。
   - 失敗時は `TASK_NOT_FOUND` が表示されます。

## アクセシビリティ／キーボード操作
- フォーム入力 → Enter で送信。
- Checkbox ボタンはキーボードフォーカス可能。Space/Enter でトグル。
- Delete ボタンもキーボード操作可能。
- 空状態メッセージは `aria-live="polite"` で追加/削除に追従。

## トラブルシューティング
| 症状 | 原因 | 対処 |
| --- | --- | --- |
| エラーコード `TITLE_REQUIRED` | 空のタイトル送信 | 入力値を確認し再送信 |
| エラーコード `DONE_REQUIRED` | チェックボックス操作時に通信失敗 | ネットワーク確認。再表示されない場合はリロード |
| エラーコード `TASK_NOT_FOUND` | 既に削除されたIDを操作 | リストをリロード (`Cmd/Ctrl + R`) し最新状態を確認 |
| リストが空のまま | サーバー停止または通信失敗 | ターミナルの Next.js ログを確認し、必要なら再起動 |

## 制限
- 入力: `title` はトリム後に空不可（最大200文字目安）。
- 型: `done` は boolean のみ受理。それ以外は `DONE_REQUIRED`。
- 識別子: `id` はサーバー発行の文字列（UUID）。外部から書き換え不可。
- 同期: ローカル開発ではメモリ保持。サーバー再起動で初期化される場合あり。

## 再現手順（APIベース）
```http
### 一覧
GET http://localhost:3000/api/tasks
accept: application/json

### 作成（正常）
POST http://localhost:3000/api/tasks
content-type: application/json

{ "title": "Buy milk" }

### 作成（エラー: 空白）
POST http://localhost:3000/api/tasks
content-type: application/json

{ "title": "  " }

### 完了更新（正常）
PATCH http://localhost:3000/api/tasks/{{taskId}}
content-type: application/json

{ "done": true }

### 完了更新（エラー: 型不正）
PATCH http://localhost:3000/api/tasks/{{taskId}}
content-type: application/json

{ "done": "yes" }

### 削除（正常）
DELETE http://localhost:3000/api/tasks/{{taskId}}
```
