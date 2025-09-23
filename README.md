# AI Scrum — Tasks MVP（アーキテクトスキャフォールド）

## 概要
- スタック: Next.js（App Router、Node ランタイム）+ TypeScript
- 目的: インメモリストアでタスク一覧を扱う API と UI の最小構成。E2E テストに対応済み。
- ライセンス: MIT（詳細は `LICENSE` を参照）

このスキャフォールドは、PO バックログに沿ってタスク一覧の表示と描画のハッピーパスを実装し、作成・トグル・削除用エンドポイントとバリデーションを用意しています。永続化は設計上インメモリで、プロセス再起動時にリセットされます。

## このスタックを選んだ理由（オプション A）
- API と UI を単一アプリに統合し、高速な DX と容易なデプロイを実現。Node LTS を最優先。
- エコシステムが強力で、Playwright による E2E 連携がシンプル。

比較については後述の「アーキテクチャ選択肢」を参照してください。

## ディレクトリ構成
```
.
├─ app/                      # Next.js App Router（UI + API ルート）
│  ├─ api/tasks/             # REST エンドポイント
│  │  ├─ [id]/route.ts       # PATCH/DELETE /api/tasks/:id
│  │  └─ route.ts            # GET/POST /api/tasks
│  ├─ globals.css            # グローバルスタイル（最小限）
│  ├─ layout.tsx             # ルートレイアウト
│  └─ page.tsx               # タスク UI
├─ config/
│  └─ playwright.config.ts   # Playwright 設定（環境変数で baseURL・レポート制御）
├─ docs/
│  ├─ domains/
│  │  ├─ tasks/
│  │  │  ├─ API.md           # タスクドメイン API 仕様
│  │  │  ├─ USER_GUIDE.md    # タスク UI 操作ガイド
│  │  │  └─ samples/api/     # API サンプル(JSON/curl)
│  │  └─ travel-planner/
│  │     └─ samples/api/     # トリッププランナー向けサンプル
│  └─ scrum/
│     └─ 2025-09-19T16-28-35-819Z/
│        ├─ backlog.po.md    # PO バックログ（RUN_ID 単位で保存）
│        ├─ planner.plan.md  # Planner 生成タスク
│        └─ RETRO.md         # Docs レトロ（RUN_ID 単位）
├─ share/
│  └─ retro/
│     ├─ 2025-09-19T16-28-35-819Z.md # RUN_ID ごとの共有用レトロ
│     └─ latest.md                 # QA/PO 参照用の最新レトロ
├─ out/
│  └─ logs/.gitkeep          # 実行時ログ配置先
├─ trip/
│  ├─ src/                   # Trip ドメイン（型/検証/ポート/実装）
│  └─ tests/                 # Trip のテスト（e2e, unit）
├─ todo/
│  ├─ src/                   # Todo(Tasks) ドメイン（型/ポート/実装）
│  └─ tests/                 # Todo のテスト（e2e, unit）
├─ .gitignore
├─ LICENSE
├─ next.config.mjs
├─ package.json
└─ tsconfig.json
```

## セットアップ
- 前提条件: Node LTS (>= 18)、npm（または pnpm/yarn）

依存関係のインストール:
```
npm install
```
開発サーバーの起動:
```
PORT=3000 npm run dev
```
UI 表示: http://localhost:3000/

トリッププランナー UI:
- http://localhost:3000/trip にアクセスすると旅程作成 MVP フォームを利用できます。
- 入力フィールド: `destination`, `start_date` (YYYY-MM-DD), `end_date` (YYYY-MM-DD)。
- 「Plan Trip」ボタンで送信すると、結果は `[role="region"][aria-label="result"]` に表示されます。

簡易確認（UI）:
- `/` にアクセスし、空状態のテキスト "No tasks yet." を確認してください。
- `[role=list][aria-label="tasks"]` を持つリストが存在し、アイテムが `[role=listitem]` として描画されていることを確認します。
- `#new_task` に入力して Enter を押すとタスクが先頭に追加され、入力欄がクリアされます。

ビルドと本番起動:
```
npm run build
PORT=3000 npm start
```

## ドメイン自動化 CLI
- フルパイプライン: `npm run domain`（PO→Docs の全ロールを順次実行）。
- ステージ単位: `npm run domain:<role>`（`po` / `architect` / `planner` / `dev` / `qa` / `docs`）。
- 過去成果物の再利用:
  - 例: `npm run domain:qa -- --backlog out/po/2025-09-15T13-39-59-366Z/backlog.yml`
  - `--backlog` で指定したファイルを新しい `out/po/<RUN_ID>/backlog.yml` にコピーします。
  - 関連する `out/planner/<RUN_ID>/tasks.yml` が存在すれば自動で再利用します。別 RUN_ID や独自構成を使うときは `--tasks path/to/tasks.yml` を併用してください。
  - 存在しないファイルを指定すると即座にエラーになるため、同じコマンドを再実行しても安全です。

## E2E テスト（Playwright）
- 設定ファイル: `config/playwright.config.ts`
- 戦略: オプション B — `scripts/run-e2e-local.mjs` で空きポートと `BASE_URL` を自動割り当てし、競合回避と CI 安定性を確保
- 主要な環境変数:
  - `PORT`（デフォルト 3000。以下のスクリプトは空きポートを自動選択）
  - `BASE_URL`（デフォルト http://localhost:${PORT}）
  - `PLAYWRIGHT_HTML_REPORT`（デフォルト `playwright-report`）
  - `PLAYWRIGHT_OUTPUT_DIR`（デフォルト `test-results`）
  - `PLAYWRIGHT_TRACE`（デフォルト `retain-on-failure`）
  - `PLAYWRIGHT_WORKERS`（デフォルト `1`）
  - `PLAYWRIGHT_HEADLESS`（デフォルト `1`）
  - `PLAYWRIGHT_WEB_SERVER_MODE`（`dev` または `prod`。ランナーの既定は `prod` で、高速化したい場合は `PLAYWRIGHT_WEB_SERVER_MODE=dev`）

ブラウザインストール（初回のみ）:
```
npx playwright install --with-deps
```

QA 向けメモ
- `npm run test:e2e*` は Next.js サーバーを自動で起動・停止し、空きポート割り当てと `BASE_URL` の設定も行います。
- MCP や手動検証で Playwright CLI を使わない場合は、先に `npm run qa:start-server` でサーバーを起動し、`BASE_URL`（デフォルト http://localhost:3000）にアクセスしてください。
- シナリオ分離には `todo/tests/e2e/_helpers.ts::resetTasks` を使用します（各 spec が `beforeEach` で実行済み）。
- UI セレクタはアクセシビリティ優先で安定しています: `#new_task`, `[role="list"][aria-label="tasks"]`, `[role="listitem"]`, `[role="checkbox"]`, `div[role="alert"]`。
- 並び順は API (`createdAt` 降順) で保証され、UI でもその順序のまま描画されます。

トリッププランナー QA メモ
- Page: `/trip`。フォームラベル: `destination`, `start_date`, `end_date`（`getByLabel` を使用）。
- 送信ボタン: `getByRole('button', { name: 'Plan Trip' })`。
- 結果領域: `[role="region"][aria-label="result"]`。各日付は `data-testid="day"` を持ちます。
- バリデーションコードは各フィールド付近および `div[role="alert"]` のサマリーに表示されます: `required`, `format`, `date_range`（`order` を含む）。
- 集約エリア `#form-errors` は常時 DOM に存在し、エラーがあるときのみ `role="alert"` を付与。

E2E テスト実行方法（ローカル CLI、デフォルト headless）:
```
# 安定版（build+start、headless、workers=1）
npm run test:e2e:ci

# 開発モード（高速、headless）
npm run test:e2e:local:dev

# 汎用ローカルランナー（headless、空きポート自動選択）
npm run test:e2e

# ローカルランナー別名（headless 明示）
npm run test:e2e:local

# 単一ファイル実行例
# API リストのみ
PLAYWRIGHT_WEB_SERVER_MODE=dev node scripts/run-e2e-local.mjs todo/tests/e2e/ac_api_list.spec.ts
# UI リストのみ
PLAYWRIGHT_WEB_SERVER_MODE=dev node scripts/run-e2e-local.mjs todo/tests/e2e/ac_ui_list.spec.ts
# Trip Planner のみ
npm run test:e2e -- trip/tests/e2e/trip_plan.spec.ts
```

## ドメイン別レイアウト指針（trip/, todo/）
- 目的: ドメインごとにコードとテストを完結させ、疎結合に保つ。

- 物理構成（共通）
  ```
  <domain>/
  ├─ src/
  │  ├─ index.ts                  # ドメインの公開API（型/関数のエントリ）
  │  ├─ ports/                    # ポート（インタフェース）
  │  ├─ adapters/                 # アダプタ実装（モック/実装差替点）
  │  └─ container.ts              # 軽量DI（シングルトンの提供元）
  └─ tests/
     ├─ e2e/                      # ドメインE2E（Playwright）
     └─ unit/                     # 単体テスト（node:test 等）
  ```

- パスエイリアス（tsconfig）
  - Trip: `@trip`, `@trip/*` → `trip/src/*`
  - Todo: `@todo`, `@todo/*` → `todo/src/*`
  - 互換: `@/domain/trip` → Trip、`@/domain/task` → Todo（段階的移行用）

- 依存ルール
  - `app/*`（Next UI/API）は各ドメインの `container.ts` のみ参照（例: `@trip/container`, `@todo/container`）。
  - ドメイン間は直接参照しない（必要なら上位層で調停）。
  - ドメイン内の import は `@trip/*` / `@todo/*` を優先。

- DI/コンテナ
  - `container.ts` は小さなシングルトン・ファクトリ。差し替えはここで行う。
  - 例: `trip/src/container.ts` の `getItineraryPlanner()` を別アダプタに差し替える。

- テスト配置
  - E2E は `trip/tests/e2e/*`, `todo/tests/e2e/*` に配置。
  - Playwright は `config/playwright.config.ts` の `testMatch` で両方を収集済み。
  - Unit は `trip/tests/unit/*`, `todo/tests/unit/*` に配置し、`npm run test:unit` で併走。

- 命名/スタイル
  - ポート: 名詞インタフェース（例: `ItineraryPlanner`, `TaskStore`）。
  - アダプタ: 接尾辞つき（例: `simpleItineraryPlanner.ts`, `memoryTaskStore.ts`）。
  - 公開面: `index.ts` で集約エクスポート（外部に漏らす記号を最小化）。

- 追加例（Tripに新アルゴリズムを追加）
  1) `trip/src/adapters/aiItineraryPlanner.ts` を追加
  2) 必要なら `trip/src/index.ts` で再エクスポート
  3) `trip/src/container.ts` の初期値を差し替え、または環境変数で切替
  4) E2E/Unit を `trip/tests/**` に追加し、`npm run test:e2e:local:dev` / `npm run test:unit` で検証

### AC ごとの E2E カバレッジ
- UI リスト: `todo/tests/e2e/ac_ui_list.spec.ts`（ロール/ラベル、空状態、並び順）
- 作成: `todo/tests/e2e/ac_create.spec.ts`（Enter 送信、先頭追加、入力クリア）
- トグル: `todo/tests/e2e/ac_toggle.spec.ts`（`aria-checked` の永続化）
- 削除: `todo/tests/e2e/ac_delete.spec.ts`（`data-testid="delete-task"`、空状態）
- バリデーション: `todo/tests/e2e/ac_validation.spec.ts`（400/404/invalid）— 稼働中で合格（TDA-016..018）
- トリッププランナー: `trip/tests/e2e/trip_plan.spec.ts`（TPA-009..016, TPA-014）

注目セレクタ:
- 入力 `#new_task`
- リスト `[role="list"][aria-label="tasks"]` とアイテム `[role="listitem"]`
- トグル `[role="checkbox"]`（`aria-checked` 付き）
- 削除ボタン `data-testid="delete-task"`
- 空状態 `data-testid="empty-tasks"`
- 入力付近のエラー: `div[role="alert"]`
```

## 振る舞いの補足
- インメモリストア: データはプロセス存続期間のみ保持され、再起動時にリセットされます（TDA-019）。
- ID: crypto UUID で一意。1000 件以上の連続作成でも安全です（TDA-020）。
- API は適切な content-type で JSON を返し、`createdAt` の ISO 文字列を含んで降順に整列します。
- UI のリストコンテナは最小高さを確保し、空でも `[role=list][aria-label="tasks"]` が表示され [AC: TDA-005] を満たします。
- エラー契約: `POST /api/tasks` の無効入力は 400 `{error:"TITLE_REQUIRED"}`、`PATCH/DELETE /api/tasks/:id` の未存在 ID は 404 `{error:"TASK_NOT_FOUND"}`、`PATCH` の非 boolean `done` は 400 `{error:"DONE_REQUIRED"}`。

## 拡張ポイント（アダプタ）
- DI の差し替えポイントは `@todo/container` と `@trip/container` にあります。

## アーキテクチャ選択肢
- オプション A（採用済み）: Next.js App Router + TypeScript
  - メリット: UI と API を単一コードベースで扱え、開発が速く、エコシステムが強力。SSR/SPA の切り替えも容易。
  - デメリット: サーバーレス Edge ランタイムではインメモリ運用に注意が必要（本構成では Node ランタイムを使用）。
- オプション B: Remix（フルスタック）+ TypeScript
  - メリット: 従来型フォーム/アクションがシンプルで DX 良好。
  - デメリット: エコシステム規模が小さく、チームの既存慣習からの逸脱が大きい。
- オプション C: Express API + Vite React
  - メリット: 関心の分離が明瞭で、ランタイムもシンプル。
  - デメリット: サーバーが 2 つ必要になり、配線が増えてエンドツーエンドの反復が遅くなる。

## リポジトリ運用
- バックログ/Planner成果物: `docs/scrum/<RUN_ID>/backlog.po.md` と `docs/scrum/<RUN_ID>/planner.plan.md`（不要になったRUN_IDを削除する場合はディレクトリごと削除）
- レトロ共有: `share/retro/latest.md`（QA/PO向け）。履歴は `share/retro/<RUN_ID>.md` を参照。
- E2E テスト: `todo/tests/e2e/`, `trip/tests/e2e/`
- 実行時ログ: `out/logs/`

---

Architect scaffold が ❤️ を込めて作成しました。

---

# Trip Planner — Itinerary MVP（アーキテクトアドオン）

本セクションでは新しい PO バックログに従って Trip Planner の MVP を追加します。既存の Tasks 機能に変更はなく、純粋な追加実装です。

## 技術選定（3案比較）

| 案 | フレームワーク | ビルド/実行 | テスト/E2E | CI 例 | 理由/トレードオフ |
|---|---|---|---|---|---|
| A (採用) | Next.js App Router + TypeScript | `next dev/start` (Node LTS) | Playwright（`config/playwright.config.ts` 再利用） | GitHub Actions（既存`ci.yml`流用） | 単一リポで UI/API を統合、既存構成と親和性高い。API ルートで JSON 契約を安定提供。SSR/SPA 切替が容易。学習コスト・運用一貫性に優れる。 |
| B | Express API + Vite React | `vite` + `node`/`ts-node` | Playwright | 同上 | API/UI 分離の明確さはあるが 2 プロセス/配線が増える。速度/安定は良いが設定が増える。 |
| C | Remix + TypeScript | `remix dev`/`serve` | Playwright | 同上 | ルート/アクションの一貫モデルは魅力。ただし既存 Next ベースからの逸脱が大きく、チーム標準化観点でコスト。 |

デフォルト案 A を即時適用（本リポは既に Next.js/Playwright 構成のため追加差分のみ）。

## 追加ディレクトリ構成（Trip Planner）
```
app/
├─ api/plan/route.ts           # POST /api/plan — Trip JSON を返却
└─ trip/page.tsx               # 入力フォーム + 結果領域 (role=region, name=result)
trip/
└─ src/
   ├─ index.ts                 # Trip型/検証/日付列挙
   ├─ ports/itineraryPlanner.ts# Adapter インタフェース（拡張点）
   └─ adapters/simpleItineraryPlanner.ts # 既定のモック実装（3秒以内応答）
docs/domains/travel-planner/samples/api/
├─ plan.md                     # 仕様/リクエスト・レスポンス例
├─ plan-request.json
└─ plan-response.json
 trip/tests/e2e/
└─ trip_plan.spec.ts           # UIハッピーシナリオ/検証/3秒以内
out/logs/.gitkeep              # 実行時ログ配置規約
```

## 初期化/起動コマンド（bash）
既存プロジェクトに追加実装済み。初回セットアップ例:
```
npm install
PORT=3000 npm run dev
# UI: http://localhost:3000/trip
# API: curl -s -X POST localhost:3000/api/plan \
#   -H 'Content-Type: application/json' \
#   -d @docs/domains/travel-planner/samples/api/plan-request.json | jq
```

Playwright は既存設定を再利用（上書き禁止のため変更なし）:
```
# E2E 実行
npm run test:e2e:local
```

## API 契約（要点）
- POST `/api/plan` で `{ destination, start_date, end_date }` を受理（YYYY-MM-DD）。
- 200 応答: `Trip` 形式 `{ destination, startDate, endDate, days[] }`。
- 400 応答: `{ errors: [{ field?, code, message? }] }`（required/format/order）。
- 500 応答: `{ errors: [{ code: "internal_error" }] }`。

## UI 要件（要点）
- ラベル付き入力 `destination`, `start_date`, `end_date` と送信ボタン。
- 結果領域: `role=region`, `aria-label="result"` に Trip を日別表示（items は1件以上）。
 - フィールド単位エラーは各入力近傍に表示（`aria-describedby` で入力と関連付け）。
  - 実装ではフォーム先頭に集約エリア `#form-errors`（`role=alert`）を1つだけ設置し、各フィールド直下のエラーテキストは `aria-describedby` 連携（`role` 非付与）で提示。これにより Playwright の厳格モードで `getByRole('alert')` が単一要素に解決され、E2E が安定します。

### UI セレクタ（E2E 抽象）
- 入力: `input[name="destination"]`, `input[name="start_date"]`, `input[name="end_date"]`
- 送信: `button[type="submit"]`
- 結果領域: `[role="region"][aria-label="result"]`
- エラー集約: `#form-errors[role="alert"]`（フィールド下のエラーテキストは `id="err-<field>"` を持ち、`aria-describedby` で関連付け）

## テスト/E2E
- `trip/tests/e2e/trip_plan.spec.ts` がハッピーシナリオ/検証/3秒以内を担保。
- Playwright 設定は `config/playwright.config.ts` を再利用（env駆動、`reuseExistingServer: true`, `timeout~40s`, `reporter: html`）。

## 拡張点（Adapter）
- 置換可能ポイント: `trip/src/ports/itineraryPlanner.ts`（例: 他サービス連携版を実装し、`@trip/container` の DI で差し替え）。
