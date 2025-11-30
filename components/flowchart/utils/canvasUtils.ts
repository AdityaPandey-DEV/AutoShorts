// Utility functions for 2D canvas operations

export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(point: Point, viewport: Viewport, canvasSize: { width: number; height: number }): Point {
  return {
    x: (point.x - viewport.panX) * viewport.zoom + canvasSize.width / 2,
    y: (point.y - viewport.panY) * viewport.zoom + canvasSize.height / 2,
  };
}

/**
 * Convert screen coordinates to world coordinates
 */
export function screenToWorld(point: Point, viewport: Viewport, canvasSize: { width: number; height: number }): Point {
  return {
    x: (point.x - canvasSize.width / 2) / viewport.zoom + viewport.panX,
    y: (point.y - canvasSize.height / 2) / viewport.zoom + viewport.panY,
  };
}

/**
 * Calculate bezier curve control points for smooth connections
 */
export function calculateBezierControlPoints(
  start: Point,
  end: Point,
  curveStrength: number = 50
): { cp1: Point; cp2: Point } {
  const dx = end.x - start.x;
  const distance = Math.abs(dx);

  return {
    cp1: {
      x: start.x + Math.max(distance * 0.5, curveStrength),
      y: start.y,
    },
    cp2: {
      x: end.x - Math.max(distance * 0.5, curveStrength),
      y: end.y,
    },
  };
}

/**
 * Generate SVG path for bezier curve
 */
export function bezierPath(start: Point, end: Point, curveStrength?: number): string {
  const { cp1, cp2 } = calculateBezierControlPoints(start, end, curveStrength);
  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}

/**
 * Check if point is inside rectangle
 */
export function pointInRect(point: Point, rect: { x: number; y: number; width: number; height: number }): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Check if point is near another point (for pin connection)
 */
export function pointNear(point1: Point, point2: Point, threshold: number = 10): boolean {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) < threshold;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

