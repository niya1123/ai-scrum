"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import type { GameState } from "@qgomoku/types"
import { BoardView } from "@qgomoku/ui/Board"

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; gameId: string; gameState: GameState }
  | { status: "error"; message: string }

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null
  const url = new URL(window.location.href)
  return url.searchParams.get(name)
}

export default function GameUI() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" })
  const [existingId, setExistingId] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)

  const canSubmitExisting = useMemo(() => {
    if (existingId.trim().length === 0) return false
    return UUID_V4_RE.test(existingId.trim())
  }, [existingId])

  const validateExisting = useCallback((value: string) => {
    const v = value.trim()
    if (v.length === 0) return setInputError("Game ID is required")
    if (!UUID_V4_RE.test(v))
      return setInputError("Invalid format: must be UUID v4")
    setInputError(null)
  }, [])

  const persistId = useCallback((id: string) => {
    try {
      localStorage.setItem("qgomoku:gameId", id)
    } catch {}
  }, [])

  const fetchGame = useCallback(async (id: string) => {
    setLoadState({ status: "loading" })
    try {
      const res = await fetch(`/api/quantum-gomoku/games/${id}`, {
        headers: { accept: "application/json" },
      })
      if (res.status === 404) {
        setLoadState({ status: "error", message: "Game not found" })
        return
      }
      if (!res.ok) {
        setLoadState({ status: "error", message: `Failed: ${res.status}` })
        return
      }
      // Tolerant parsing during contract transition:
      // - Legacy: GET returns flat GameState
      // - New: GET returns { gameState }
      const raw: unknown = await res.json()
      const maybeWrapped = raw as { gameState?: GameState }
      const gs: GameState = maybeWrapped && maybeWrapped.gameState ? maybeWrapped.gameState : (raw as GameState)

      setLoadState({ status: "loaded", gameId: gs.id, gameState: gs })
      persistId(gs.id)
    } catch (e) {
      setLoadState({ status: "error", message: "Network error" })
    }
  }, [persistId])

  const createGame = useCallback(async () => {
    setLoadState({ status: "loading" })
    try {
      const res = await fetch(`/api/quantum-gomoku/games`, {
        method: "POST",
        headers: { accept: "application/json" },
      })
      if (!res.ok) {
        setLoadState({ status: "error", message: `Failed: ${res.status}` })
        return
      }
      const data = (await res.json()) as { gameId: string; gameState: GameState }
      setLoadState({ status: "loaded", gameId: data.gameId, gameState: data.gameState })
      persistId(data.gameId)
    } catch (e) {
      setLoadState({ status: "error", message: "Network error" })
    }
  }, [persistId])

  useEffect(() => {
    // Boot: try URL param, then localStorage, else create
    const fromQuery = getQueryParam("gameId")
    const boot = async () => {
      let id: string | null = null
      if (fromQuery && UUID_V4_RE.test(fromQuery)) id = fromQuery
      if (!id) {
        try {
          const ls = localStorage.getItem("qgomoku:gameId")
          if (ls && UUID_V4_RE.test(ls)) id = ls
        } catch {}
      }
      if (id) return fetchGame(id)
      return createGame()
    }
    void boot()
  }, [createGame, fetchGame])

  const statusBar = useMemo(() => {
    if (loadState.status !== "loaded") return null
    const gs = loadState.gameState
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          margin: "8px 0 16px",
        }}
      >
        <span>Game ID: <code>{gs.id}</code></span>
        <span>Turn: {gs.turnCount}</span>
        <span>Current: {gs.currentPlayer}</span>
        <span>Black obs: {gs.blackObservationsRemaining}</span>
        <span>White obs: {gs.whiteObservationsRemaining}</span>
        <span>Status: {gs.status}</span>
        {gs.winner ? <span>Winner: {gs.winner}</span> : null}
      </div>
    )
  }, [loadState])

  const handleCellClick = useCallback(
    async (row: number, col: number) => {
      if (loadState.status !== "loaded") return
      const id = loadState.gameId
      try {
        const res = await fetch(`/api/quantum-gomoku/games/${id}/moves`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            playerId: loadState.gameState.currentPlayer,
            position: { row, col },
          }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          // Error model: { code }
          const code = data && typeof data.code === 'string' ? data.code : `HTTP_${res.status}`
          setLoadState({ status: "error", message: code })
          // Re-fetch to ensure state unchanged after errors (QGM-009)
          await fetchGame(id)
          return
        }
        const next = data as { gameState: GameState }
        setLoadState({ status: "loaded", gameId: id, gameState: next.gameState })
      } catch (e) {
        setLoadState({ status: "error", message: "Network error" })
      }
    },
    [loadState, fetchGame]
  )

  return (
    <main>
      <h1>Quantum Gomoku</h1>
      <p style={{ margin: 0, opacity: 0.75 }}>
        MVP UI — creates or loads a game and renders a 15x15 board.
      </p>

      <section aria-label="controls" style={{ margin: "16px 0", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={() => void createGame()} data-testid="new-game">
          New Game
        </button>
        <form
          onSubmit={e => {
            e.preventDefault()
            if (!canSubmitExisting) return
            return fetchGame(existingId.trim())
          }}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <label htmlFor="existing_id">Existing Game ID:</label>
          <input
            id="existing_id"
            name="existing_id"
            placeholder="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            value={existingId}
            onChange={e => {
              setExistingId(e.target.value)
              validateExisting(e.target.value)
            }}
            aria-describedby={inputError ? "err-existing_id" : undefined}
            aria-invalid={!!inputError}
            style={{ minWidth: 360, padding: 6 }}
          />
          <button type="submit" disabled={!canSubmitExisting} data-testid="load-game">
            Load
          </button>
        </form>
      </section>

      {inputError ? (
        <div id="err-existing_id" style={{ color: "crimson", margin: "4px 0 12px" }}>
          {inputError}
        </div>
      ) : null}

      {loadState.status === "loading" && <div>Loading…</div>}
      {loadState.status === "error" && (
        <div role="alert" style={{ color: "crimson" }}>{loadState.message}</div>
      )}
      {loadState.status === "loaded" && (
        <>
          {statusBar}
          <BoardView board={loadState.gameState.board} onCellClick={handleCellClick} />
        </>
      )}
    </main>
  )
}
