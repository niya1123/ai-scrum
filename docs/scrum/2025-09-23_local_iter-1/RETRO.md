# Sprint Retro — 2025-09-23_local_iter-1

ステータス: QA Red（T2 入力検証ギャップ）。最小ハッピーパスは Green。

## 続ける（Keep）
- Playwright-first によるE2Eスケルトン先行（前提/操作/期待の明確化）。
- 役割分担（PO/Planner/Architect/Dev/QA/Docs）のハンドオフ契約を明文化。
- クリティカルパス順の実装（MVP-007 → 001 → 002 → 003 → 004 → 006 → 005）。
- Docs と samples（JSON/requests.http）を同時更新して契約の単一情報源にする。

## やめる（Stop）
- 入力バリデーション未実装のままエンドポイントを提供すること（QAでのT2遅延の主因）。
- エラー形式のブレ（`{error: CODE}` と他形式の混在）。
- 長い検証フィードバックループ（UIやE2Eが先に壊れ、原因特定に時間）。

## 試す（Try）
- 契約テスト（Contract/E2E）をCIゲート化し、実装前にスキーマを固定。
- `requests.http` と `docs/domains/tasks/samples/api/*.json` を単体の契約サンプルとして継続運用（ドリフト検知）。
- 受け口での軽量入力検証（型・空白・UUIDなど）はヘルパ化し、全エンドポイントに適用。
- APIレスポンスの `accept: application/json` とエラーコードの一貫性を自動Lint。

## アクション（Next）
- BE-001/BE-002 を優先し、UUID/入力検証を公開（QA-002のGreen化）。
- Docs: ドメイン `tasks` のAPIサンプルを増補（list/delete/requests.http 追加）。
- QA: 失敗最小再現（無効ID/型不正/空白）を first-class 化して早期検知。

---
- 参照: out/planner/2025-09-23_local_iter-1/tasks.yml（critical_path, 失敗T2メモ）
- ドメイン: tasks（docs/domains/tasks/*）
