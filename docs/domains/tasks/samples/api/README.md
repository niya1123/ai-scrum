# API Samples — Tasks

## 基本リスト取得
```bash
curl -s ${BASE_URL:-http://localhost:3000}/api/tasks | jq .
```

## 新規作成
- リクエスト/レスポンス例: `task.create.json`
```bash
curl -s -X POST \
  -H 'content-type: application/json' \
  -d '{"title":"Buy milk"}' \
  ${BASE_URL:-http://localhost:3000}/api/tasks | jq .
```

## 完了状態の更新
- リクエスト/レスポンス例: `task.patch.json`
```bash
curl -s -X PATCH \
  -H 'content-type: application/json' \
  -d '{"done":true}' \
  ${BASE_URL:-http://localhost:3000}/api/tasks/<id> | jq .
```

## 削除
```bash
curl -s -X DELETE ${BASE_URL:-http://localhost:3000}/api/tasks/<id> | jq .
```

## エラー応答
```bash
curl -s -X POST -H 'content-type: application/json' -d '{"title":"  "}' ${BASE_URL:-http://localhost:3000}/api/tasks | jq .
curl -s -X PATCH -H 'content-type: application/json' -d '{"done":"yes"}' ${BASE_URL:-http://localhost:3000}/api/tasks/unknown | jq .
curl -s -X DELETE ${BASE_URL:-http://localhost:3000}/api/tasks/does-not-exist | jq .
```
