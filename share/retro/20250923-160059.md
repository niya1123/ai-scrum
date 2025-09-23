# Sprint Retro — 20250923-160059

ステータス: Docs Green（tasks API/UG整備）、UI E2E skeletons 追加（skip でCI維持）。

## 続ける（Keep）
- 既存ツーリングの活用（Next.js + TypeScript / Playwright）。新規FW追加なしで速度最優先。
- UI E2EはACごとのスケルトン先行（`test.skip`）でハンドオフを円滑化。
- ドメイン別ドキュメント構成（`docs/domains/<domain>`）とサンプル（`samples/api/*.json` / `requests.http`）を単一真実源として維持。
- クリティカルパスの明示と依存関係の可視化（BE→FE→QA）。

## やめる（Stop）
- ACの文言と実装/テストのレスポンス仕様の食い違いを後追いで修正する運用。
- UIセレクタを文言に結びつけること（`data-testid`/ARIAロールへ統一）。
- FE配線前にUI E2EをunskipしてCIを赤くすること。

## 試す（Try）
- サンプルJSONと実APIの整合を確認する軽量ContractテストをQAに追加し、CIでドリフト検知。
- `requests.http` の定期実行ジョブ（ローカル/CI）と最小スモークを用意。
- Docs更新のPRテンプレートに「AC / サンプル更新 / 影響範囲」を必須化。

## アクション（Next）
- FE配線後にUI E2E（QGM-004/005/010/011）を段階的にunskip。
- tasksドメインのAPIエラー分岐の追加サンプル（境界ケース）を拡充。
- Architect/PO合意後、API仕様のステータス/コードを固定し、QAで契約テスト化。

---
- 参照: out/planner/20250923-160059/tasks.yml（owners/依存/クリティカルパス）
- ドメイン: tasks（docs/domains/tasks/*） / UI E2E skeletons: tests/e2e/ui/quantum-gomoku.ui-ac.spec.ts
