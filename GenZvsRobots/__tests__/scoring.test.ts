import { calculateDetailedScore, DetailedScore } from "../lib/scoring";
import { createEmptyGrid } from "../lib/constants";
import type { Grid } from "../lib/types";

// Helper to set a specific cell in a grid copy
function setCell(grid: Grid, row: number, col: number, block: Grid[0][0][0], height: number = 0): Grid {
  const copy = grid.map(r => r.map(c => [...c])) as Grid;
  copy[row][col][height] = block;
  return copy;
}

describe("calculateDetailedScore", () => {
  // 1. Perfect match returns 100%
  it("returns 100% when build exactly matches target", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Place some blocks in both grids identically
    const withBlocks = (g: Grid) => {
      let result = setCell(g, 0, 0, "wall");
      result = setCell(result, 0, 1, "window");
      result = setCell(result, 1, 0, "floor");
      result = setCell(result, 2, 2, "roof");
      result = setCell(result, 3, 3, "door");
      return result;
    };

    const result = calculateDetailedScore(withBlocks(build), withBlocks(target));

    expect(result.percentage).toBe(100);
    expect(result.correct).toBe(5);
    expect(result.total).toBe(5);
  });

  // 2. Completely wrong build (right number of blocks, wrong positions) returns 0%
  it("returns 0% when blocks are placed in entirely wrong positions", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Target has a wall at (0,0); build has a wall at (7,7) — no overlap
    const targetGrid = setCell(target, 0, 0, "wall");
    const buildGrid = setCell(build, 7, 7, "wall");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    // total = 1 (expected wall at 0,0) + 1 (extra wall at 7,7) = 2, correct = 0
    expect(result.percentage).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.total).toBe(2);
  });

  // 3. Extra blocks are penalized (reduce the percentage)
  it("penalizes extra blocks not present in target", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Target: wall at (0,0)
    const targetGrid = setCell(target, 0, 0, "wall");
    // Build: wall at (0,0) correct + extra wall at (1,1)
    let buildGrid = setCell(build, 0, 0, "wall");
    buildGrid = setCell(buildGrid, 1, 1, "wall");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    // correct = 1, total = 2 (1 expected + 1 extra penalty), percentage = 50%
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(50);
  });

  // 4. Missing blocks reduce percentage
  it("reduces percentage when expected blocks are missing from build", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Target has 4 walls; build only places 2 of them
    let targetGrid = setCell(target, 0, 0, "wall");
    targetGrid = setCell(targetGrid, 0, 1, "wall");
    targetGrid = setCell(targetGrid, 0, 2, "wall");
    targetGrid = setCell(targetGrid, 0, 3, "wall");

    // Build matches only the first two
    let buildGrid = setCell(build, 0, 0, "wall");
    buildGrid = setCell(buildGrid, 0, 1, "wall");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    // correct = 2, total = 4, percentage = 50%
    expect(result.correct).toBe(2);
    expect(result.total).toBe(4);
    expect(result.percentage).toBe(50);
  });

  // 5. Partial match returns correct percentage
  it("returns the correct percentage for a partial match", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Target: 3 cells — wall, floor, roof
    let targetGrid = setCell(target, 0, 0, "wall");
    targetGrid = setCell(targetGrid, 1, 1, "floor");
    targetGrid = setCell(targetGrid, 2, 2, "roof");

    // Build: wall correct, floor wrong type (window), roof missing, 1 extra
    let buildGrid = setCell(build, 0, 0, "wall");      // correct
    buildGrid = setCell(buildGrid, 1, 1, "window");    // wrong type — expected floor
    buildGrid = setCell(buildGrid, 3, 3, "door");      // extra — penalised

    const result = calculateDetailedScore(buildGrid, targetGrid);

    // correct=1, total = 3 expected + 1 extra = 4, percentage = 25%
    expect(result.correct).toBe(1);
    expect(result.total).toBe(4);
    expect(result.percentage).toBe(25);
  });

  // 6. Empty build vs non-empty target returns 0%
  it("returns 0% when build is empty but target has blocks", () => {
    const target = createEmptyGrid();
    let targetGrid = setCell(target, 0, 0, "wall");
    targetGrid = setCell(targetGrid, 1, 1, "floor");

    const buildGrid = createEmptyGrid();

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.percentage).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.total).toBe(2);
  });

  // 7. Empty target vs empty build returns 0 (edge case: total=0)
  it("returns 0% (total=0) when both target and build are empty", () => {
    const targetGrid = createEmptyGrid();
    const buildGrid = createEmptyGrid();

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.percentage).toBe(0);
    expect(result.correct).toBe(0);
    expect(result.total).toBe(0);
    expect(result.cells).toHaveLength(0);
  });

  // 8. Cell results contain correct row, col, expected, actual, correct fields
  it("returns cell results with correct row, col, expected, actual, and correct fields", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // Target: wall at (2, 3); build: floor at (2, 3) — wrong type
    const targetGrid = setCell(target, 2, 3, "wall");
    const buildGrid = setCell(build, 2, 3, "floor");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.cells).toHaveLength(1);

    const cell = result.cells[0];
    expect(cell.row).toBe(2);
    expect(cell.col).toBe(3);
    expect(cell.expected).toBe("wall");
    expect(cell.actual).toBe("floor");
    expect(cell.correct).toBe(false);
  });

  it("marks cell as correct=true when build matches target at that position", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    const targetGrid = setCell(target, 5, 5, "roof");
    const buildGrid = setCell(build, 5, 5, "roof");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.cells).toHaveLength(1);
    const cell = result.cells[0];
    expect(cell.row).toBe(5);
    expect(cell.col).toBe(5);
    expect(cell.expected).toBe("roof");
    expect(cell.actual).toBe("roof");
    expect(cell.correct).toBe(true);
  });

  it("includes extra-block cell results with correct=false", () => {
    const targetGrid = createEmptyGrid();
    const buildGrid = setCell(createEmptyGrid(), 4, 6, "door");

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.cells).toHaveLength(1);
    const cell = result.cells[0];
    expect(cell.row).toBe(4);
    expect(cell.col).toBe(6);
    expect(cell.expected).toBe("empty");
    expect(cell.actual).toBe("door");
    expect(cell.correct).toBe(false);
  });

  it("scores multi-layer targets correctly", () => {
    const target = createEmptyGrid();
    target[0][0][0] = "wall";
    target[0][0][1] = "roof";
    const build = createEmptyGrid();
    build[0][0][0] = "wall";
    build[0][0][1] = "roof";
    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(100);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
  });

  // New block types: plant and table score correctly
  it("scores plant and table blocks at matching positions correctly", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    let targetGrid = setCell(target, 1, 1, "plant");
    targetGrid = setCell(targetGrid, 2, 2, "table");
    let buildGrid = setCell(build, 1, 1, "plant");
    buildGrid = setCell(buildGrid, 2, 2, "table");

    const result = calculateDetailedScore(buildGrid, targetGrid);
    expect(result.percentage).toBe(100);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
  });

  // 2-high door scoring
  it("scores 2-high door target with 2-high door build as 100%", () => {
    const target = createEmptyGrid();
    target[3][3][0] = "door";
    target[3][3][1] = "door";
    const build = createEmptyGrid();
    build[3][3][0] = "door";
    build[3][3][1] = "door";

    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(100);
    expect(result.correct).toBe(2);
    expect(result.total).toBe(2);
  });

  it("scores 2-high door target with only 1 door block as 50%", () => {
    const target = createEmptyGrid();
    target[3][3][0] = "door";
    target[3][3][1] = "door";
    const build = createEmptyGrid();
    build[3][3][0] = "door";
    // height 1 is empty

    const result = calculateDetailedScore(build, target);
    expect(result.percentage).toBe(50);
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
  });

  // Additional: percentage rounds correctly
  it("rounds percentage to nearest integer", () => {
    const target = createEmptyGrid();
    const build = createEmptyGrid();

    // 2 correct out of 3 = 66.666...% -> rounds to 67
    let targetGrid = setCell(target, 0, 0, "wall");
    targetGrid = setCell(targetGrid, 0, 1, "wall");
    targetGrid = setCell(targetGrid, 0, 2, "wall");

    let buildGrid = setCell(build, 0, 0, "wall");
    buildGrid = setCell(buildGrid, 0, 1, "wall");
    // (0,2) left empty — missing

    const result = calculateDetailedScore(buildGrid, targetGrid);

    expect(result.correct).toBe(2);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(67);
  });
});
