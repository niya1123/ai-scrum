# タスクAPI仕様

## 概要
- ベースURL: `http://localhost:3000`
- 認証: なし（ローカル開発想定）
- コンテンツタイプ: 送信時は `application/json`
- タスクオブジェクトの共通スキーマ:
  | フィールド | 型 | 説明 |
  | --- | --- | --- |
  | `id` | string | サーバーが発行する一意ID（UUID） |
  | `title` | string | 登録済みのタスク名（前後の空白はトリムされる） |
  | `done` | boolean | 完了状態。新規作成時は `false` |
  | `createdAt` | string (ISO 8601) | サーバーが付与する作成日時 |

## エンドポイント

### GET `/api/tasks`
既存タスクを作成日時降順で返します。

- レスポンス: `200 OK`
- ボディ: タスクオブジェクトの配列（最新が先頭）。
- エラー: なし。

```bash
curl -s ${BASE_URL:-http://localhost:3000}/api/tasks | jq .
```

### POST `/api/tasks`
新規タスクを作成し、最新リスト先頭に挿入します。

- リクエストボディ:
  ```json
  { "title": "Buy milk" }
  ```
  空白のみはエラー。
- レスポンス: `201 Created`
- レスポンスボディ: 生成されたタスクオブジェクト。
- エラー:
  | ステータス | エラーコード | 条件 |
  | --- | --- | --- |
  | `400` | `TITLE_REQUIRED` | `title` が空/空白、JSONが不正 |

サンプル: `docs/domains/tasks/samples/api/task.create.json`

```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -d '{"title":"Buy milk"}' \
  ${BASE_URL:-http://localhost:3000}/api/tasks | jq .
```

### PATCH `/api/tasks/:id`
指定したタスクの完了状態を更新します。

- パスパラメータ: `:id`（`GET`で取得した `id` を利用）
- リクエストボディ:
  ```json
  { "done": true }
  ```
- 成功時: `200 OK` + 更新後タスク。
- エラー:
  | ステータス | エラーコード | 条件 |
  | --- | --- | --- |
  | `400` | `DONE_REQUIRED` | `done` が boolean 以外 または JSONエラー |
  | `404` | `TASK_NOT_FOUND` | `id` に一致するタスクが存在しない |

サンプル: `docs/domains/tasks/samples/api/task.patch.json`

```bash
curl -s -X PATCH \
  -H 'content-type: application/json' \
  -d '{"done":true}' \
  ${BASE_URL:-http://localhost:3000}/api/tasks/<id> | jq .
```

### DELETE `/api/tasks/:id`
指定タスクを削除します。

- パスパラメータ: `:id`
- 成功時: `200 OK`、レスポンスは `{ "ok": true }`
- エラー:
  | ステータス | エラーコード | 条件 |
  | --- | --- | --- |
  | `404` | `TASK_NOT_FOUND` | `id` に一致するタスクが存在しない |

```bash
curl -s -X DELETE ${BASE_URL:-http://localhost:3000}/api/tasks/<id> | jq .
```

## エラーレスポンス共通形式
```json
{ "error": "ERROR_CODE" }
```
- `TITLE_REQUIRED`: POST 入力が空/不正
- `DONE_REQUIRED`: PATCH ボディの `done` が boolean 以外
- `TASK_NOT_FOUND`: 指定IDが存在しない
