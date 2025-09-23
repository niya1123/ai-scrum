"use client"

import React from "react"
import type { Board, Cell } from "@qgomoku/types"
import { BOARD_SIZE } from "@qgomoku/types"

type BoardProps = {
  board: Board
  onCellClick?: (row: number, col: number, cell: Cell) => void
  disabled?: boolean
}

export function BoardView({ board, onCellClick, disabled }: BoardProps) {
  return (
    <div
      data-testid="board"
      role="grid"
      aria-label="Quantum Gomoku board"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 28px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 28px)`,
        gap: 2,
        padding: 8,
        background: "#d7b992",
        border: "1px solid #8b6b3b",
        width: "max-content",
        userSelect: "none",
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {board.map((row, rIdx) =>
        row.map((cell, cIdx) => (
          <button
            key={`${rIdx}-${cIdx}`}
            type="button"
            role="gridcell"
            aria-label={`cell ${rIdx + 1}, ${cIdx + 1}`}
            data-testid={`cell-${rIdx}-${cIdx}`}
            onClick={() => onCellClick?.(rIdx, cIdx, cell)}
            disabled={disabled}
            style={{
              width: 28,
              height: 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f0d9b5",
              border: "1px solid #8b6b3b",
              borderRadius: 2,
              padding: 0,
            }}
          >
            {cell ? (
              <span
                aria-label={cell.observedColor ?? cell.placedBy}
                data-testid="stone"
                data-stone-player={cell.placedBy}
                data-stone-observed={cell.observedColor ? "true" : "false"}
                className={
                  `marker ` +
                  (
                    (cell.observedColor ?? cell.placedBy) === "BLACK"
                      ? "marker--black"
                      : "marker--white"
                  )
                }
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: cell.observedColor
                    ? cell.observedColor === "BLACK"
                      ? "#222"
                      : "#fafafa"
                    : cell.placedBy === "BLACK"
                    ? "#444"
                    : "#ddd",
                  boxShadow: "inset 0 0 2px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(0,0,0,0.2)",
                }}
              />
            ) : null}
          </button>
        ))
      )}
    </div>
  )
}
