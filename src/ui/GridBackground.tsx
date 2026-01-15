import { useMemo } from "react";

const GRID_SIZE = 64;
const COLS = 8;
const ROWS = 12;
const FILL_PROBABILITY = 0.25; // 25% of squares get filled

// Generate random fills once
function generateFills(): boolean[][] {
  const fills: boolean[][] = [];
  for (let row = 0; row < ROWS; row++) {
    fills[row] = [];
    for (let col = 0; col < COLS; col++) {
      fills[row][col] = Math.random() < FILL_PROBABILITY;
    }
  }
  return fills;
}

// Generate random opacity for each filled square
function getRandomOpacity(): number {
  return 0.01 + Math.random() * 0.02; // 1-3% opacity (very subtle)
}

function GridBackground() {
  // Generate fills once on mount
  const fills = useMemo(() => generateFills(), []);
  const opacities = useMemo(() => {
    return fills.map(row => row.map(filled => filled ? getRandomOpacity() : 0));
  }, [fills]);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, borderRadius: "inherit" }}
    >
      {/* Square fills */}
      {fills.map((row, rowIndex) =>
        row.map((filled, colIndex) =>
          filled ? (
            <div
              key={`fill-${rowIndex}-${colIndex}`}
              className="absolute"
              style={{
                left: colIndex * GRID_SIZE,
                top: rowIndex * GRID_SIZE,
                width: GRID_SIZE,
                height: GRID_SIZE,
                backgroundColor: `rgba(var(--bg-spotlight-color), ${opacities[rowIndex][colIndex]})`,
                boxShadow: `0 0 20px rgba(var(--bg-spotlight-color), ${opacities[rowIndex][colIndex] * 3})`,
              }}
            />
          ) : null
        )
      )}

      {/* Vertical lines */}
      {Array.from({ length: COLS + 1 }).map((_, i) => (
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0"
          style={{
            left: i * GRID_SIZE,
            width: 1,
            backgroundColor: `rgba(var(--bg-grid-color), var(--bg-grid-opacity))`,
          }}
        />
      ))}

      {/* Horizontal lines */}
      {Array.from({ length: ROWS + 1 }).map((_, i) => (
        <div
          key={`h-${i}`}
          className="absolute left-0 right-0"
          style={{
            top: i * GRID_SIZE,
            height: 1,
            backgroundColor: `rgba(var(--bg-grid-color), var(--bg-grid-opacity))`,
          }}
        />
      ))}
    </div>
  );
}

export default GridBackground;
