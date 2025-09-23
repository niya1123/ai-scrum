#!/usr/bin/env -S node --enable-source-maps
import "dotenv/config";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, mkdirSync, writeFileSync, readFileSync, createWriteStream, appendFileSync, renameSync, rmSync, cpSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createServer } from "node:net";

const sh = promisify(exec);
const OUT_DIR = "out";
const PROMPTS_DIR = "prompts";
const DEFAULT_DOMAIN_SPEC = process.env.DOMAIN_SPEC || "domains/examples/travel-planner.md";
// Namespace per run to avoid artifact collisions across multiple orchestrator runs
const RUN_ID = process.env.RUN_ID || new Date().toISOString().replace(/[:.]/g, "-");
process.env.RUN_ID = RUN_ID;
const MAX_ITERS = Number(process.env.MAX_ITERS || 3);
const ENABLE_RED_INVESTIGATION = String(process.env.ENABLE_RED_INVESTIGATION || "1") !== "0";
const PARALLEL_DEVS = Number(process.env.PARALLEL_DEVS || 2); // 2 = FE/BE 並列
const AUTO_DEV_AFTER_REPLAN = String(process.env.AUTO_DEV_AFTER_REPLAN || "1") !== "0"; // RED時: 再分解→Dev→QA を自動実行
const PROGRESS_STYLE = process.env.PROGRESS_STYLE || "bar"; // bar | spinner | none
const PROGRESS_INTERVAL = Number(process.env.PROGRESS_INTERVAL || 120); // ms
// Dev stages often need longer uninterrupted reasoning time. Allow an override and use
// a safer default (10 min) for Dev; others keep the general default (5 min).
const DEFAULT_DEV_STALL_MS = Number(
  process.env.CODEX_STALL_TIMEOUT_MS_DEV ||
  process.env.CODEX_STALL_TIMEOUT_MS ||
  10 * 60 * 1000
);
// MCP 要求は無効化（ローカル CLI 実行を前提）。
// 環境変数で上書き可: QA_REQUIRE_MCP=1 で再有効化。
const QA_REQUIRE_MCP = String(process.env.QA_REQUIRE_MCP || "0") !== "0";

function logSection(title: string) {
  if (process.env.PROGRESS_ONLY) return; // 抑制
  console.log(`\n\n=== ${title} ===`);
}

async function run(cmd: string, outfile?: string) {
  if (!process.env.PROGRESS_ONLY) console.log(`\n$ ${cmd}`);
  const { stdout, stderr } = await sh(cmd, { maxBuffer: 20 * 1024 * 1024 });
  if (outfile) writeFileSync(join(OUT_DIR, outfile), stdout);
  if (stderr?.trim()) console.error(stderr);
  return { stdout, stderr };
}

// Execute Codex CLI non-interactively. Concatenates provided files and pipes them
// as stdin to `codex exec -`. Writes JSONL stream to jsonLog (if provided)
// and the agent's last message to lastMessageFile (required by callers).
async function runCodex({
  inputFiles,
  lastMessageFile,
  jsonLogFile,
  showProgress = true,
  stageLabel,
  timeoutMs = Number(process.env.CODEX_TIMEOUT_MS || 30 * 60 * 1000),
  stallTimeoutMs = Number(process.env.CODEX_STALL_TIMEOUT_MS || 5 * 60 * 1000),
  allowFailure = false,
  env,
}: {
  inputFiles: string[];
  lastMessageFile: string;
  jsonLogFile?: string;
  showProgress?: boolean;
  stageLabel?: string;
  timeoutMs?: number;
  stallTimeoutMs?: number;
  /**
   * 非0終了コードやSIGKILL等のシグナル終了でも例外にせずresolveする。
   * 呼び出し側でログ/成果物の有無に応じて処理を継続させたいステージ（例: QA）向け。
   */
  allowFailure?: boolean;
  /** 環境変数の追加/上書き（子プロセスに適用） */
  env?: Record<string, string | undefined>;
}) {
  const absLast = join(OUT_DIR, lastMessageFile);
  ensureDir(dirname(absLast));
  const absJsonLog = jsonLogFile ? join(OUT_DIR, jsonLogFile) : undefined;
  if (absJsonLog) ensureDir(dirname(absJsonLog));

  return new Promise<{
    stdout: string;
    stderr: string;
    lines: number;
    durationMs: number;
  }>((resolve, reject) => {
    const args = [
      "exec",
      "--skip-git-repo-check",
      "--dangerously-bypass-approvals-and-sandbox",
      "--json",
      "--output-last-message",
      absLast,
      "-",
    ];

    const started = Date.now();
    const child = spawn("codex", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...(env || {}) },
    });
    let stdoutAll = "";
    let stderrAll = "";
    let lineBuf = "";
    let lines = 0;
    // Track last activity time across both stdout and stderr to avoid false stalls
    let lastLineAt = Date.now();
    let lastActivityAt = Date.now();
    // Track if we killed the process and why, for clearer error messages
    let killedBy: "stall" | "timeout" | null = null;

    // If jsonLogFile provided, open a write stream (ESM互換: require非使用)
    const jsonLogStream = absJsonLog
      ? createWriteStream(absJsonLog, { encoding: "utf8" })
      : null;

    // Concatenate and send inputs
    try {
      for (const f of inputFiles) {
        const content = readFileSync(f, "utf8");
        child.stdin.write(content.endsWith("\n") ? content : content + "\n");
      }
    } catch (e) {
      child.kill();
      return reject(e);
    } finally {
      child.stdin.end();
    }

  // Progress renderer (single line). For unknown total, animate an indefinite bar or spinner.
  let tick = 0;
    let lastRender = 0;
    const barWidth = Math.min(40, Math.max(20, (process.stdout.columns || 80) - 40));
    const spinnerFrames = ["⣾","⣽","⣻","⢿","⡿","⣟","⣯","⣷"];
    const makeBar = (t: number) => {
      const pos = t % barWidth;
      let bar = "";
      for (let i = 0; i < barWidth; i++) bar += i === pos ? "█" : "─";
      return bar;
    };
    const render = (force = false) => {
      if (!showProgress || PROGRESS_STYLE === "none") return;
      const now = Date.now();
      if (!force && now - lastRender < PROGRESS_INTERVAL) return;
      lastRender = now;
      const elapsed = ((now - started) / 1000).toFixed(1);
      let visual: string;
      if (PROGRESS_STYLE === "spinner") {
        visual = spinnerFrames[tick % spinnerFrames.length];
      } else { // bar
        visual = makeBar(tick);
      }
      const stage = stageLabel ? `[${stageLabel}] ` : "";
      const msg = `${visual} ${stage}lines:${lines} elapsed:${elapsed}s`;
      process.stdout.write("\r" + msg.slice(0, process.stdout.columns || msg.length));
      tick++;
    };
    const interval = showProgress && PROGRESS_STYLE !== "none" ? setInterval(render, PROGRESS_INTERVAL) : null;

    // セクション直後に即座に 0 行で表示したいので初回強制レンダー
    render(true);

  child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdoutAll += text;
      if (jsonLogStream) jsonLogStream.write(text);
      lineBuf += text;
      // Treat any stdout chunk as activity to avoid false stalls when a line
      // has not been terminated by a newline yet (e.g., large JSON without \n).
      lastActivityAt = Date.now();
      let idx: number;
      while ((idx = lineBuf.indexOf("\n")) >= 0) {
        const line = lineBuf.slice(0, idx);
        lineBuf = lineBuf.slice(idx + 1);
        if (line.trim().length) lines++;
    lastLineAt = Date.now();
    lastActivityAt = lastLineAt;
      }
      render();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderrAll += text;
      lastActivityAt = Date.now();
      // Show stderr immediately (often token streaming or debug)
      process.stderr.write(text);
    });
    // タイマー: 全体タイムアウト
    const timeoutTimer = setTimeout(() => {
      if (killedBy) return; // already handled by stall or other
      const msg = `⏰ TIMEOUT ${stageLabel || ''} ${timeoutMs}ms 超過 → 終了要請 (調整: CODEX_TIMEOUT_MS)`;
      process.stderr.write("\n" + msg + "\n");
      killedBy = "timeout";
      try { child.kill('SIGTERM'); } catch {}
      // Give the process a small grace period to exit cleanly, then force kill
      setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000);
    }, timeoutMs);

    // スタール監視: 一定時間新規行なし
    const stallTimer = setInterval(() => {
      const idle = Date.now() - lastActivityAt;
      if (idle >= stallTimeoutMs && !killedBy) {
        const msg = `⚠️ STALL ${stageLabel || ''} ${Math.round(idle/1000)}s 無アクティビティ (閾値 ${Math.round(stallTimeoutMs/1000)}s) → 終了要請 (調整: CODEX_STALL_TIMEOUT_MS)`;
        process.stderr.write("\n" + msg + "\n");
        killedBy = "stall";
        try { child.kill('SIGTERM'); } catch {}
        // Force kill if it doesn't exit soon
        setTimeout(() => { try { child.kill('SIGKILL'); } catch {} }, 5000);
      }
    }, Math.min(30_000, stallTimeoutMs));

    child.on("error", (err) => {
      if (interval) clearInterval(interval as any);
      clearTimeout(timeoutTimer);
      clearInterval(stallTimer);
      if (jsonLogStream) jsonLogStream.end();
      process.stdout.write("\n");
      reject(err);
    });
    child.on("close", (code, signal) => {
      if (interval) clearInterval(interval as any);
      clearTimeout(timeoutTimer);
      clearInterval(stallTimer);
      if (jsonLogStream) jsonLogStream.end();
      const durationMs = Date.now() - started;
      const stage = stageLabel ? `[${stageLabel}] ` : "";
      const finalLine = `✔ ${stage}codex完了: ${lines} json行 (${(durationMs / 1000).toFixed(1)}s, exitCode=${code}, signal=${signal ?? "none"})`;
      if (process.env.PROGRESS_ONLY) {
        process.stdout.write("\r" + finalLine + "\n");
      } else if (showProgress && PROGRESS_STYLE !== "none") {
        process.stdout.write("\r" + finalLine + "\n");
      } else {
        process.stdout.write(finalLine + "\n");
      }
      if (code === 0) {
        resolve({ stdout: stdoutAll, stderr: stderrAll, lines, durationMs });
      } else if (allowFailure) {
        // 失敗を許容: 呼び出し側でリカバリ（例: Planner差し戻し等）する前提でresolve
        const msg = `WARN ${stage}codex 非正常終了を継続許容: exitCode=${code}, signal=${signal ?? "none"}`;
        process.stderr.write(msg + "\n");
        resolve({ stdout: stdoutAll, stderr: stderrAll, lines, durationMs });
      } else {
        let reasonDetail = "";
        if (killedBy === "stall") {
          reasonDetail = `no activity for >= ${Math.round(stallTimeoutMs/1000)}s (stall)`;
        } else if (killedBy === "timeout") {
          reasonDetail = `overall timeout ${Math.round(timeoutMs/1000)}s`;
        } else if (signal) {
          reasonDetail = `terminated by signal ${signal}`;
        } else {
          reasonDetail = `exit code ${code}`;
        }
        const err = new Error(`codex terminated: ${reasonDetail} (exitCode=${code}, signal=${signal ?? "none"}). Tune CODEX_STALL_TIMEOUT_MS/CODEX_TIMEOUT_MS as needed.`);
        (err as any).stdout = stdoutAll;
        (err as any).stderr = stderrAll;
        reject(err);
      }
    });
  });
}

// 競合回避用: 利用可能なエフェメラルポートを確保
async function getEphemeralPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", (e) => reject(e));
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

function ensureDir(p: string) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function syncRetroShare(runId: string) {
  const retroPath = join("docs", "scrum", runId, "RETRO.md");
  if (!existsSync(retroPath)) return;
  const shareDir = join("share", "retro");
  ensureDir(shareDir);
  const latestPath = join(shareDir, "latest.md");
  const runPath = join(shareDir, `${runId}.md`);
  try {
    cpSync(retroPath, runPath, { force: true });
    cpSync(retroPath, latestPath, { force: true });
  } catch (e) {
    console.warn(`WARN: failed to mirror RETRO to share folder: ${(e as Error).message}`);
  }
}

function movePathSafe(src: string, dst: string) {
  if (!existsSync(src)) return false;
  try {
    // If destination exists, replace it (keeps structure stable per iter)
    if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
  } catch {}
  try {
    renameSync(src, dst);
  } catch {
    try {
      cpSync(src, dst, { recursive: true });
      rmSync(src, { recursive: true, force: true });
    } catch (e) {
      return false;
    }
  }
  return true;
}

function collectQaArtifacts({
  iter,
  retry,
  htmlReportPath,
  qaLastPath,
  qaJsonlPath,
}: {
  iter: number;
  retry: boolean;
  htmlReportPath: string;
  qaLastPath: string;
  qaJsonlPath: string;
}) {
  const label = retry ? `iter-${iter}-retry` : `iter-${iter}`;
  const baseDir = join(OUT_DIR, "qa", RUN_ID, label);
  ensureDir(baseDir);
  // HTML report already targeted to htmlReportPath; ensure it's under baseDir/report
  try {
    const target = join(baseDir, "report");
    if (existsSync(htmlReportPath)) {
      const srcAbs = resolve(htmlReportPath);
      const dstAbs = resolve(target);
      if (srcAbs !== dstAbs) movePathSafe(htmlReportPath, target);
    }
  } catch {}
  // Common Playwright artifacts possibly created by runner
  const candidates = [
    "test-results",
    join(OUT_DIR, "test-results"),
    "blob-report",
    join(OUT_DIR, "blob-report"),
    "playwright-report",
    join(OUT_DIR, "playwright-report"),
  ];
  for (const c of candidates) if (existsSync(c)) movePathSafe(c, join(baseDir, c.split("/").pop() || "artifact"));
  // Copy QA outputs (skip if already the same path)
  try {
    if (existsSync(qaLastPath)) {
      const dst = join(baseDir, "result.json");
      if (resolve(qaLastPath) !== resolve(dst)) cpSync(qaLastPath, dst);
    }
  } catch {}
  try {
    if (existsSync(qaJsonlPath)) {
      const dst = join(baseDir, "stream.jsonl");
      if (resolve(qaJsonlPath) !== resolve(dst)) cpSync(qaJsonlPath, dst);
    }
  } catch {}
}

type ManualArtifacts = {
  backlog?: string;
  tasks?: string;
};

function resolveIfExists(pathLike: string, label: string): string {
  const abs = resolve(pathLike);
  if (!existsSync(abs)) {
    throw new Error(`指定された ${label} が見つかりません: ${abs}`);
  }
  return abs;
}

function resolveBacklogArg(pathLike: string): string {
  const abs = resolveIfExists(pathLike, "backlog 指定");
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const candidate = join(abs, "backlog.yml");
      if (existsSync(candidate)) return candidate;
      throw new Error(`--backlog にディレクトリが指定されましたが 'backlog.yml' が見つかりません: ${candidate}`);
    }
  } catch {}
  return abs;
}

function resolveTasksArg(pathLike: string): string {
  const abs = resolveIfExists(pathLike, "tasks 指定");
  try {
    const st = statSync(abs);
    if (st.isDirectory()) {
      const candidate = join(abs, "tasks.yml");
      if (existsSync(candidate)) return candidate;
      throw new Error(`--tasks にディレクトリが指定されましたが 'tasks.yml' が見つかりません: ${candidate}`);
    }
  } catch {}
  return abs;
}

function parseManualArtifacts(args: string[]): ManualArtifacts {
  const res: ManualArtifacts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") break;
    if (arg === "--backlog") {
      const next = args[++i];
      if (!next || next.startsWith("--")) {
        throw new Error("'--backlog' オプションには backlog.yml へのファイルパス、またはそれを含むディレクトリを指定してください。");
      }
      res.backlog = next;
      continue;
    }
    if (arg.startsWith("--backlog=")) {
      res.backlog = arg.slice("--backlog=".length);
      continue;
    }
    if (arg === "--tasks") {
      const next = args[++i];
      if (!next || next.startsWith("--")) {
        throw new Error("'--tasks' オプションには tasks.yml へのファイルパス、またはそれを含むディレクトリを指定してください。");
      }
      res.tasks = next;
      continue;
    }
    if (arg.startsWith("--tasks=")) {
      res.tasks = arg.slice("--tasks=".length);
    }
  }
  return res;
}

function tryInferTasksFromBacklog(backlogPath: string): string | undefined {
  const normalized = backlogPath.replace(/\\/g, "/");
  const match = normalized.match(/\bout\/po\/([^/]+)\/backlog\.yml$/);
  if (!match) return undefined;
  const runId = match[1];
  const inferred = resolve("out", "planner", runId, "tasks.yml");
  return existsSync(inferred) ? inferred : undefined;
}

async function ensureDirs() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  if (!existsSync(PROMPTS_DIR)) {
    throw new Error(`Missing '${PROMPTS_DIR}' directory. Place po.md / architect.md / planner.md / dev-fe.md / dev-be.md / qa.md / docs.md under ${PROMPTS_DIR}/`);
  }
  // ドメイン仕様は任意（未指定でも動作）。存在時はPOへのインプットに含める。
}

function extractStatusFromJson(text: string): string | undefined {
  const trimmed = text.trim();
  const candidates: string[] = [];
  if (trimmed) {
    candidates.push(trimmed);
    for (const line of trimmed.split(/\r?\n/)) {
      const candidate = line.trim();
      if (candidate.startsWith("{") && candidate.endsWith("}")) {
        candidates.push(candidate);
      }
    }
  }

  const objects: string[] = [];
  let depth = 0;
  let start = -1;
  for (let idx = 0; idx < text.length; idx++) {
    const ch = text[idx];
    if (ch === "{") {
      if (depth === 0) start = idx;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) {
        depth--;
        if (depth === 0 && start !== -1) {
          objects.push(text.slice(start, idx + 1));
          start = -1;
        }
      }
    }
  }
  candidates.push(...objects);

  const seen = new Set<string>();
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i].trim();
    if (!candidate.startsWith("{") || !candidate.endsWith("}")) continue;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    try {
      const parsed = JSON.parse(candidate);
      const status = parsed?.status;
      if (typeof status === "string") return status;
    } catch {}
  }

  return undefined;
}

function isQaGreen(text: string): boolean {
  // QAエージェントの標準出力に、下記のいずれかのトークンが含まれていれば合格とみなす
  // 例: "E2E: GREEN" / "ACCEPTED" / {"status":"green"}
  const jsonStatus = extractStatusFromJson(text);
  if (jsonStatus && /^(green|passed|ok)$/i.test(jsonStatus)) return true;
  return /E2E\s*:\s*GREEN|ACCEPTED|QA\s*STATUS\s*:\s*GREEN/i.test(text);
}

function parseRunnerTag(text: string): "mcp" | "fallback" | "unknown" {
  // Preferred: The QA agent's final message is a single JSON object.
  // We support detection via a JSON field `runner: "mcp"|"fallback"`.
  try {
    const trimmed = text.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      const obj = JSON.parse(trimmed);
      const r = String(obj?.runner || "").toLowerCase();
      if (r === "mcp" || r === "fallback") return r as any;
    }
  } catch {}
  // Fallback: parse loose tag like `runner=mcp` that may appear in logs.
  try {
    const m = text.match(/runner\s*[:=]\s*(mcp|fallback)/i);
    if (m) return (m[1].toLowerCase() as any) || "unknown";
  } catch {}
  return "unknown";
}

async function main() {
  await ensureDirs();

  const rawArgs = process.argv.slice(2);
  const manualArtifacts = parseManualArtifacts(rawArgs);

  // ===== 引数 / 環境オプション解析 =====
  const STAGES = ["po","architect","planner","dev","qa","docs"] as const;
  type Stage = typeof STAGES[number];
  function parseFromArg(): Stage {
    const argPrefix = "--from=";
    let from = process.env.START_FROM as Stage | undefined;
    for (const a of rawArgs) if (a.startsWith(argPrefix)) from = a.slice(argPrefix.length) as Stage;
    if (!from) return "po";
    if (!STAGES.includes(from)) {
      console.error(`無効な --from 指定: '${from}'. 使用可能: ${STAGES.join(', ')}`);
      process.exit(2);
    }
    return from;
  }
  const startFrom = parseFromArg();
  const startIdx = STAGES.indexOf(startFrom);
  const should = (stage: Stage) => STAGES.indexOf(stage) >= startIdx;
  if (startFrom !== "po") console.log(`(from='${startFrom}' 以前のステージはスキップ)`);

  // Phase directories per RUN_ID
  const PO_DIR = join(OUT_DIR, "po", RUN_ID);
  const ARCH_DIR = join(OUT_DIR, "architect", RUN_ID);
  const PLAN_DIR = join(OUT_DIR, "planner", RUN_ID);
  const DEV_FE_DIR = join(OUT_DIR, "dev-fe", RUN_ID);
  const DEV_BE_DIR = join(OUT_DIR, "dev-be", RUN_ID);
  const QA_DIR = join(OUT_DIR, "qa", RUN_ID);
  const INV_DIR = join(OUT_DIR, "investigate", RUN_ID);
  const DOCS_DIR = join(OUT_DIR, "docs", RUN_ID);
  [PO_DIR, ARCH_DIR, PLAN_DIR, DEV_FE_DIR, DEV_BE_DIR, QA_DIR, INV_DIR, DOCS_DIR].forEach(ensureDir);

  // 手動指定された成果物を新しい RUN_ID 配下にコピー
  let backlogCopied = false;
  let backlogSrcResolved: string | undefined;
  if (manualArtifacts.backlog) {
    const backlogSrc = resolveBacklogArg(manualArtifacts.backlog);
    backlogSrcResolved = backlogSrc;
    const backlogDst = join(PO_DIR, "backlog.yml");
    cpSync(backlogSrc, backlogDst, { force: true });
    backlogCopied = true;
    if (!process.env.PROGRESS_ONLY) {
      console.log(`既存 backlog を再利用します: ${backlogSrc} → ${backlogDst}`);
    }
  }

  const tasksSrcExplicit = manualArtifacts.tasks ? resolveTasksArg(manualArtifacts.tasks) : undefined;
  const tasksSrcInferred = !tasksSrcExplicit && backlogSrcResolved ? tryInferTasksFromBacklog(backlogSrcResolved) : undefined;
  if (tasksSrcExplicit) {
    const tasksDst = join(PLAN_DIR, "tasks.yml");
    cpSync(tasksSrcExplicit, tasksDst, { force: true });
    if (!process.env.PROGRESS_ONLY) {
      console.log(`既存 tasks を再利用します: ${tasksSrcExplicit} → ${tasksDst}`);
    }
  } else if (tasksSrcInferred) {
    const tasksDst = join(PLAN_DIR, "tasks.yml");
    cpSync(tasksSrcInferred, tasksDst, { force: true });
    if (!process.env.PROGRESS_ONLY) {
      console.log(`backlog から推測した tasks.yml を再利用します: ${tasksSrcInferred} → ${tasksDst}`);
    }
  }

  // 1) PO → backlog
  if (should("po")) {
    logSection("1) PO: Backlog 生成");
    const poInputs = [join(PROMPTS_DIR, "po.md")];
    if (existsSync(DEFAULT_DOMAIN_SPEC)) poInputs.push(DEFAULT_DOMAIN_SPEC);
    await runCodex({
      inputFiles: poInputs,
      lastMessageFile: join("po", RUN_ID, "backlog.yml"),
      jsonLogFile: join("po", RUN_ID, "po.jsonl"),
      stageLabel: "PO",
    });
  } else if (!existsSync(join(PO_DIR, "backlog.yml"))) {
    const manualHint = backlogCopied ? "コピー処理が失敗した可能性があります。" : "--backlog オプションで既存ファイルを指定してください。";
    throw new Error(`--from=${startFrom} ですが 'out/po/${RUN_ID}/backlog.yml' が存在しません。${manualHint}`);
  }

  // 2) Architect → scaffold（提案 + 自動適用想定）
  if (should("architect")) {
    logSection("2) Architect: 技術選定/雛形適用");
    await runCodex({
      inputFiles: [join(PROMPTS_DIR, "architect.md"), join(PO_DIR, "backlog.yml")],
      lastMessageFile: join("architect", RUN_ID, "scaffold.log"),
      jsonLogFile: join("architect", RUN_ID, "architect.jsonl"),
      stageLabel: "Architect",
    });
  } else if (!existsSync(join(ARCH_DIR, "scaffold.log"))) {
    console.warn(`Architect スキップ (--from=${startFrom}). 既存 out/architect/${RUN_ID}/scaffold.log が無いので続行しますが問題が起きる可能性があります。`);
  }

  // 3) Planner → tasks
  if (should("planner")) {
    logSection("3) Planner: タスク分解 + E2E雛形");
    await runCodex({
      inputFiles: [join(PROMPTS_DIR, "planner.md"), join(PO_DIR, "backlog.yml")],
      lastMessageFile: join("planner", RUN_ID, "tasks.yml"),
      jsonLogFile: join("planner", RUN_ID, "planner.jsonl"),
      stageLabel: "Planner",
    });
  } else if (!existsSync(join(PLAN_DIR, "tasks.yml"))) {
    throw new Error(`--from=${startFrom} ですが 'out/planner/${RUN_ID}/tasks.yml' が存在しません。'--tasks' で既存ファイルを指定するか、Planner を実行してください。`);
  }

  // 4) Dev (FE/BE) 並列 → 5) QA → 失敗なら Planner→Dev→QA をリトライ
  if (should("dev") || should("qa") || should("docs")) {
  for (let i = 1; i <= MAX_ITERS; i++) {
    logSection(`4) 実装イテレーション ${i}/${MAX_ITERS}`);

    const devJobs: Promise<any>[] = [];
    if (should("dev") && PARALLEL_DEVS >= 1) {
      ensureDir(join(DEV_FE_DIR, `iter-${i}`));
      devJobs.push(
        runCodex({
          inputFiles: [join(PROMPTS_DIR, "dev-fe.md"), join(PLAN_DIR, "tasks.yml")],
          lastMessageFile: join("dev-fe", RUN_ID, `iter-${i}`, `dev-fe-${i}.log`),
          jsonLogFile: join("dev-fe", RUN_ID, `iter-${i}`, `dev-fe-${i}.jsonl`),
          stageLabel: `Dev-FE#${i}`,
          stallTimeoutMs: DEFAULT_DEV_STALL_MS,
          env: {
            // Block interactive tools like `playwright show-report/show-trace` by putting a guard earlier in PATH
            PATH: `${resolve("scripts/wrappers/bin")}:${process.env.PATH || ""}`,
            // Hint for tools/scripts that interactive commands are disallowed in this orchestrated run
            NO_INTERACTIVE_CLI: "1",
          },
        })
      );
    }
    if (should("dev") && PARALLEL_DEVS >= 2) {
      ensureDir(join(DEV_BE_DIR, `iter-${i}`));
      devJobs.push(
        runCodex({
          inputFiles: [join(PROMPTS_DIR, "dev-be.md"), join(PLAN_DIR, "tasks.yml")],
          lastMessageFile: join("dev-be", RUN_ID, `iter-${i}`, `dev-be-${i}.log`),
          jsonLogFile: join("dev-be", RUN_ID, `iter-${i}`, `dev-be-${i}.jsonl`),
          stageLabel: `Dev-BE#${i}`,
          stallTimeoutMs: DEFAULT_DEV_STALL_MS,
          env: {
            PATH: `${resolve("scripts/wrappers/bin")}:${process.env.PATH || ""}`,
            NO_INTERACTIVE_CLI: "1",
          },
        })
      );
    }
    if (devJobs.length) await Promise.all(devJobs);
    if (!should("qa") && !should("docs")) {
      console.log("Dev のみ実行 (--from 指定)。終了します。");
      return;
    }

    logSection("5) QA: 受け入れテスト");
    if (should("qa")) {
      const qaPort = await getEphemeralPort();
      const qaIterBase = join(OUT_DIR, "qa", RUN_ID, `iter-${i}`);
      const qaReportDir = join(qaIterBase, "report");
      ensureDir(qaIterBase);
      await runCodex({
        inputFiles: [join(PROMPTS_DIR, "qa.md"), join(PLAN_DIR, "tasks.yml")],
        lastMessageFile: join("qa", RUN_ID, `iter-${i}`, "result.json"),
        jsonLogFile: join("qa", RUN_ID, `iter-${i}`, "stream.jsonl"),
        stageLabel: `QA#${i}`,
        // QAは失敗・SIGKILLでも次の差し戻し処理に進めるため許容
        allowFailure: true,
        // ポート競合を避けるため、固有PORTとレポート出力先を付与
        env: {
          PORT: String(qaPort),
          PLAYWRIGHT_HTML_REPORT: qaReportDir,
          PLAYWRIGHT_JSON_REPORT: join("out", "qa", RUN_ID, `iter-${i}`, "report", "results.json"),
          // ローカル CLI で安定実行（prod起動 + headless）
          PLAYWRIGHT_WEB_SERVER_MODE: "prod",
          PLAYWRIGHT_HEADLESS: "1",
          QA_ITERATION_LABEL: `iter-${i}`,
          RUN_ID: RUN_ID,
        },
      });
    } else {
      console.log("QA スキップ (--from により)");
    }

    // Determine QA status from the last message file content
    const qaLastPath = join(OUT_DIR, "qa", RUN_ID, `iter-${i}`, "result.json");
    const qaLast = existsSync(qaLastPath) ? readFileSync(qaLastPath, "utf8") : "";
    // Collect artifacts into out/qa/<RUN_ID>/iter-<i>
    try {
      collectQaArtifacts({
        iter: i,
        retry: false,
        htmlReportPath: join(OUT_DIR, "qa", RUN_ID, `iter-${i}`, "report"),
        qaLastPath,
        qaJsonlPath: join(OUT_DIR, "qa", RUN_ID, `iter-${i}`, "stream.jsonl"),
      });
    } catch (e) {
      console.warn(`WARN: QA artifacts collection failed: ${(e as Error).message}`);
    }
    // Record which runner was used (MCP or fallback) if the tag appears in output.
    // QA agent may include `runner=mcp` or `runner=fallback` (optional; acceptance does not depend on it).
    const runner = parseRunnerTag(qaLast);
    const runnerLog = join(QA_DIR, "qa-runner.log");
    const entry = `iter=${i}, runner=${runner}, at=${new Date().toISOString()}\n`;
    try {
      const prev = existsSync(runnerLog) ? readFileSync(runnerLog, "utf8") : "";
      // Idempotent: avoid duplicating the same iteration entry
      if (!prev.split(/\r?\n/).some((l) => l.startsWith(`iter=${i},`))) {
        appendFileSync(runnerLog, entry, { encoding: "utf8" });
      }
    } catch (e) {
      console.warn(`WARN: failed to write runner log: ${(e as Error).message}`);
    }
    if (!process.env.PROGRESS_ONLY) console.log(`QA#${i} runner=${runner}`);
    // Accept only if GREEN and (runner gating条件を満たす)
    const qaGreen = should("qa") && isQaGreen(qaLast);
    const runnerOk = !QA_REQUIRE_MCP || runner === "mcp";
    if (qaGreen && runnerOk) {
      console.log("\n✅ QA GREEN → 受け入れ完了");
      if (should("docs")) {
        logSection("6) Docs: ドキュメント生成");
        ensureDir(join(DOCS_DIR, `iter-${i}`));
        await runCodex({
          inputFiles: [join(PROMPTS_DIR, "docs.md"), join(PLAN_DIR, "tasks.yml")],
          lastMessageFile: join("docs", RUN_ID, `iter-${i}`, `docs-${i}.log`),
          jsonLogFile: join("docs", RUN_ID, `iter-${i}`, `docs-${i}.jsonl`),
          stageLabel: `Docs#${i}`,
        });
        syncRetroShare(RUN_ID);
      }
      console.log(`\n完了: 成果物/ログは '${OUT_DIR}/' を参照してください。`);
      return;
    } else if (qaGreen && !runnerOk) {
      console.warn("\n⚠️  QA は GREEN ですが runner が MCP ではありません (runner!=mcp)。QA_REQUIRE_MCP=1 のため不合格扱いにします。");
    }

  if (should("qa")) {
      // レッド時は 調査(任意) → Planner に差し戻し → 次イテレーションへ
      console.warn("\n⚠️  QA RED → 原因調査 → Plannerに差し戻し (再分解)");

      // 5.1 調査フェーズ（ENABLE_RED_INVESTIGATION!=0 の場合）
      // 目的: 失敗テスト/分類/理由/証跡をもとに、推定原因と担当を特定し、
      //       次のPlannerに渡す調査記録 (YAML) を out/investigate/<RUN_ID>/iter-<i>/investigation.yml に保存。
      const invIterDir = join(INV_DIR, `iter-${i}`);
      ensureDir(invIterDir);
      const investigationPath = join(invIterDir, `investigation.yml`);
      const devFeLog = join(OUT_DIR, "dev-fe", RUN_ID, `iter-${i}`, `dev-fe-${i}.log`);
      const devBeLog = join(OUT_DIR, "dev-be", RUN_ID, `iter-${i}`, `dev-be-${i}.log`);
      if (ENABLE_RED_INVESTIGATION) {
        const exists = existsSync(investigationPath);
        if (!exists) {
          const investigateInputs = [
            join(PROMPTS_DIR, "investigate.md"),
          ];
          if (existsSync(qaLastPath)) {
            investigateInputs.push(qaLastPath);
          } else {
            const missingQaNote = join(invIterDir, "qa-result-missing.txt");
            const note = [
              `QA result.json not found for RUN_ID=${RUN_ID} iter=${i}.`,
              "The QA stage likely terminated before writing its final summary.",
              "Investigate using available logs (playwright-report, stream.jsonl, etc.).",
            ].join("\n");
            writeFileSync(missingQaNote, note, { encoding: "utf8" });
            investigateInputs.push(missingQaNote);
          }
          if (existsSync(devFeLog)) investigateInputs.push(devFeLog);
          if (existsSync(devBeLog)) investigateInputs.push(devBeLog);
          await runCodex({
            inputFiles: investigateInputs,
            lastMessageFile: join("investigate", RUN_ID, `iter-${i}`, `investigation.yml`),
            jsonLogFile: join("investigate", RUN_ID, `iter-${i}`, `stream.jsonl`),
            stageLabel: `Investigate#${i}`,
            // 調査は失敗しても続行（Plannerに直接差し戻す）
            allowFailure: true,
          });
        } else if (!process.env.PROGRESS_ONLY) {
          console.log(`調査記録を再利用: ${investigationPath}`);
        }
      } else if (!process.env.PROGRESS_ONLY) {
        console.log("(ENABLE_RED_INVESTIGATION=0 により調査フェーズをスキップ)");
      }

      // 5.2 Planner 再分解（調査記録と直近QA結果も入力に含める）
      const replanInputs = [
        join(PROMPTS_DIR, "planner.md"),
        join(PO_DIR, "backlog.yml"),
      ];
      if (ENABLE_RED_INVESTIGATION && existsSync(investigationPath)) {
        replanInputs.push(investigationPath);
      }
      if (existsSync(qaLastPath)) {
        replanInputs.push(qaLastPath);
      }

      ensureDir(join(PLAN_DIR, "replan", `iter-${i}`));
      await runCodex({
        inputFiles: replanInputs,
        lastMessageFile: join("planner", RUN_ID, "replan", `iter-${i}`, "tasks.yml"),
        jsonLogFile: join("planner", RUN_ID, "replan", `iter-${i}`, "planner-replan.jsonl"),
        stageLabel: `Replan#${i}`,
      });
      // 最新tasksに差し替え
      const latest = readFileSync(join(PLAN_DIR, "replan", `iter-${i}`, "tasks.yml"), "utf8");
      writeFileSync(join(PLAN_DIR, "tasks.yml"), latest);

      // 5.3 再分解の内容を Dev に即時反映（開始ステージが qa の場合でも実行）
      if (AUTO_DEV_AFTER_REPLAN && PARALLEL_DEVS > 0) {
        logSection("5.3 Dev: 再分解タスクの適用 (RED後)");
        const devJobs2: Promise<any>[] = [];
        if (PARALLEL_DEVS >= 1) {
          ensureDir(join(DEV_FE_DIR, `iter-${i}-retry`));
          devJobs2.push(
            runCodex({
              inputFiles: [join(PROMPTS_DIR, "dev-fe.md"), join(PLAN_DIR, "tasks.yml")],
              lastMessageFile: join("dev-fe", RUN_ID, `iter-${i}-retry`, `dev-fe-${i}-retry.log`),
              jsonLogFile: join("dev-fe", RUN_ID, `iter-${i}-retry`, `dev-fe-${i}-retry.jsonl`),
              stageLabel: `Dev-FE#${i}-retry`,
              stallTimeoutMs: DEFAULT_DEV_STALL_MS,
              env: {
                PATH: `${resolve("scripts/wrappers/bin")}:${process.env.PATH || ""}`,
                NO_INTERACTIVE_CLI: "1",
              },
            })
          );
        }
        if (PARALLEL_DEVS >= 2) {
          ensureDir(join(DEV_BE_DIR, `iter-${i}-retry`));
          devJobs2.push(
            runCodex({
              inputFiles: [join(PROMPTS_DIR, "dev-be.md"), join(PLAN_DIR, "tasks.yml")],
              lastMessageFile: join("dev-be", RUN_ID, `iter-${i}-retry`, `dev-be-${i}-retry.log`),
              jsonLogFile: join("dev-be", RUN_ID, `iter-${i}-retry`, `dev-be-${i}-retry.jsonl`),
              stageLabel: `Dev-BE#${i}-retry`,
              stallTimeoutMs: DEFAULT_DEV_STALL_MS,
              env: {
                PATH: `${resolve("scripts/wrappers/bin")}:${process.env.PATH || ""}`,
                NO_INTERACTIVE_CLI: "1",
              },
            })
          );
        }
        if (devJobs2.length) await Promise.all(devJobs2);

        // 5.4 QA を即時再実行（実装反映後）
        logSection("5.4 QA: 再実行 (再分解+実装反映後)");
        const qaPort2 = await getEphemeralPort();
        const qaIterBase2 = join(OUT_DIR, "qa", RUN_ID, `iter-${i}-retry`);
        const qaReportDir2 = join(qaIterBase2, "report");
        ensureDir(qaIterBase2);
        await runCodex({
          inputFiles: [join(PROMPTS_DIR, "qa.md"), join(PLAN_DIR, "tasks.yml")],
          lastMessageFile: join("qa", RUN_ID, `iter-${i}-retry`, "result.json"),
          jsonLogFile: join("qa", RUN_ID, `iter-${i}-retry`, "stream.jsonl"),
          stageLabel: `QA#${i}-retry`,
          allowFailure: true,
          env: {
            PORT: String(qaPort2),
            PLAYWRIGHT_HTML_REPORT: qaReportDir2,
            PLAYWRIGHT_JSON_REPORT: join("out", "qa", RUN_ID, `iter-${i}-retry`, "report", "results.json"),
            FORCE_MCP_PLAYWRIGHT: "1",
            QA_ITERATION_LABEL: `iter-${i}-retry`,
            RUN_ID: RUN_ID,
          },
        });

        const qaRetryPath = join(OUT_DIR, "qa", RUN_ID, `iter-${i}-retry`, "result.json");
        const qaRetry = existsSync(qaRetryPath) ? readFileSync(qaRetryPath, "utf8") : "";
        try {
          collectQaArtifacts({
            iter: i,
            retry: true,
            htmlReportPath: join(OUT_DIR, "qa", RUN_ID, `iter-${i}-retry`, "report"),
            qaLastPath: qaRetryPath,
            qaJsonlPath: join(OUT_DIR, "qa", RUN_ID, `iter-${i}-retry`, "stream.jsonl"),
          });
        } catch (e) {
          console.warn(`WARN: QA(retry) artifacts collection failed: ${(e as Error).message}`);
        }
        const runner2 = parseRunnerTag(qaRetry);
        const runnerLog2 = join(QA_DIR, "qa-runner.log");
        const entry2 = `iter=${i}, retry=1, runner=${runner2}, at=${new Date().toISOString()}\n`;
        try {
          const prev2 = existsSync(runnerLog2) ? readFileSync(runnerLog2, "utf8") : "";
          if (!prev2.split(/\r?\n/).some((l) => l.startsWith(`iter=${i}, retry=1`))) {
            appendFileSync(runnerLog2, entry2, { encoding: "utf8" });
          }
        } catch (e) {
          console.warn(`WARN: failed to write retry runner log: ${(e as Error).message}`);
        }

        const qaRetryGreen = isQaGreen(qaRetry);
        const runnerOk2 = !QA_REQUIRE_MCP || runner2 === "mcp";
        if (qaRetryGreen && runnerOk2) {
          console.log("\n✅ QA GREEN (after replan+dev) → 受け入れ完了");
          if (should("docs")) {
            logSection("6) Docs: ドキュメント生成");
            ensureDir(join(DOCS_DIR, `iter-${i}-retry`));
            await runCodex({
              inputFiles: [join(PROMPTS_DIR, "docs.md"), join(PLAN_DIR, "tasks.yml")],
              lastMessageFile: join("docs", RUN_ID, `iter-${i}-retry`, `docs-${i}-retry.log`),
              jsonLogFile: join("docs", RUN_ID, `iter-${i}-retry`, `docs-${i}-retry.jsonl`),
              stageLabel: `Docs#${i}-retry`,
            });
            syncRetroShare(RUN_ID);
          }
          console.log(`\n完了: 成果物/ログは '${OUT_DIR}/' を参照してください。`);
          return;
        } else if (qaRetryGreen && !runnerOk2) {
          console.warn("\n⚠️  QA リトライは GREEN ですが runner が MCP ではありません (runner!=mcp)。QA_REQUIRE_MCP=1 のため不合格扱いにします。");
        }
      }
    } else if (should("docs")) {
      // QA を通さず docs を求めている場合 (非推奨) 一度だけ docs 生成して終了
      logSection("6) Docs: ドキュメント生成 (QAスキップ) ");
      ensureDir(join(DOCS_DIR, `iter-${i}`));
      await runCodex({
        inputFiles: [join(PROMPTS_DIR, "docs.md"), join(PLAN_DIR, "tasks.yml")],
        lastMessageFile: join("docs", RUN_ID, `iter-${i}`, `docs-${i}.log`),
        jsonLogFile: join("docs", RUN_ID, `iter-${i}`, `docs-${i}.jsonl`),
        stageLabel: `Docs#${i}`,
      });
      syncRetroShare(RUN_ID);
      console.log(`\n完了: 成果物/ログは '${OUT_DIR}/' を参照してください。`);
      return;
    }
  }
  }

  if (should("qa")) {
    console.error(`\n❌ 収束せず: MAX_ITERS=${MAX_ITERS} に達しました。${OUT_DIR}/qa-*.log を確認してください。`);
  }
  process.exit(1);
}

main().catch((e) => {
  console.error("\nUnexpected error:", e);
  process.exit(1);
});
