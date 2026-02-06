/**
 * Drawing Canvas Component
 *
 * Canvas for drawing using react-konva.
 */

import { useRef, useState, useCallback } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import type Konva from 'konva';
import { cn } from '@/lib/utils';
import type { DrawStroke, Point, DrawingToolSettings } from '../types/skribbl.types';

interface DrawingCanvasProps {
  /** Width of the canvas */
  width: number;
  /** Height of the canvas */
  height: number;
  /** Whether drawing is enabled */
  isDrawer: boolean;
  /** Current strokes to display */
  strokes: DrawStroke[];
  /** Current drawing tool settings */
  toolSettings: DrawingToolSettings;
  /** Called when a new stroke is completed */
  onStroke?: (stroke: DrawStroke) => void;
  /** Called when canvas should be cleared */
  onClear?: () => void;
  /** Called when undo is requested */
  onUndo?: () => void;
  /** Custom class name */
  className?: string;
}

export function DrawingCanvas({
  width,
  height,
  isDrawer,
  strokes,
  toolSettings,
  onStroke,
  className,
}: DrawingCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Get pointer position relative to canvas
  const getPointerPosition = useCallback((): Point | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: pos.x, y: pos.y };
  }, []);

  // Start drawing
  const handleMouseDown = useCallback(() => {
    if (!isDrawer) return;
    const pos = getPointerPosition();
    if (!pos) return;

    setIsDrawing(true);
    setCurrentStroke({
      points: [pos],
      color: toolSettings.tool === 'eraser' ? '#FFFFFF' : toolSettings.color,
      size: toolSettings.size,
      tool: toolSettings.tool === 'fill' ? 'brush' : toolSettings.tool,
    });
  }, [isDrawer, toolSettings, getPointerPosition]);

  // Continue drawing
  const handleMouseMove = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    const pos = getPointerPosition();
    if (!pos) return;

    setCurrentStroke((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, pos],
      };
    });
  }, [isDrawing, currentStroke, getPointerPosition]);

  // End drawing
  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);

    // Only emit if there are points
    if (currentStroke.points.length > 0) {
      onStroke?.(currentStroke);
    }
    setCurrentStroke(null);
  }, [isDrawing, currentStroke, onStroke]);

  // Handle touch events
  const handleTouchStart = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.evt.preventDefault();
      handleMouseDown();
    },
    [handleMouseDown]
  );

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.evt.preventDefault();
      handleMouseMove();
    },
    [handleMouseMove]
  );

  const handleTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      e.evt.preventDefault();
      handleMouseUp();
    },
    [handleMouseUp]
  );

  // Convert stroke points to flat array for Konva Line
  const pointsToFlat = (points: Point[]): number[] => {
    return points.flatMap((p) => [p.x, p.y]);
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border bg-white',
        !isDrawer && 'cursor-not-allowed',
        className
      )}
    >
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDrawer ? 'crosshair' : 'not-allowed' }}
      >
        <Layer>
          {/* Existing strokes */}
          {strokes.map((stroke, index) => (
            <Line
              key={index}
              points={pointsToFlat(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.size}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                stroke.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          ))}

          {/* Current stroke being drawn */}
          {currentStroke && (
            <Line
              points={pointsToFlat(currentStroke.points)}
              stroke={currentStroke.color}
              strokeWidth={currentStroke.size}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation={
                currentStroke.tool === 'eraser' ? 'destination-out' : 'source-over'
              }
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
}

/**
 * Drawing toolbar component
 */
interface DrawingToolbarProps {
  settings: DrawingToolSettings;
  onChange: (settings: DrawingToolSettings) => void;
  onClear: () => void;
  onUndo: () => void;
  disabled?: boolean;
  className?: string;
}

export function DrawingToolbar({
  settings,
  onChange,
  onClear,
  onUndo,
  disabled = false,
  className,
}: DrawingToolbarProps) {
  const colors = [
    '#000000', '#FFFFFF', '#C1C1C1', '#EF130B', '#FF7100',
    '#FFE400', '#00CC00', '#00B2FF', '#231FD3', '#A300BA',
    '#D37CAA', '#A0522D',
  ];

  const sizes = [4, 8, 16, 32];

  return (
    <div className={cn('flex flex-wrap items-center gap-2 p-2', className)}>
      {/* Tool selection */}
      <div className="flex gap-1 rounded-md border p-1">
        <button
          type="button"
          onClick={() => onChange({ ...settings, tool: 'brush' })}
          disabled={disabled}
          className={cn(
            'rounded px-2 py-1 text-sm',
            settings.tool === 'brush' && 'bg-primary text-primary-foreground'
          )}
        >
          Brush
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...settings, tool: 'eraser' })}
          disabled={disabled}
          className={cn(
            'rounded px-2 py-1 text-sm',
            settings.tool === 'eraser' && 'bg-primary text-primary-foreground'
          )}
        >
          Eraser
        </button>
      </div>

      {/* Color palette */}
      <div className="flex flex-wrap gap-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange({ ...settings, color, tool: 'brush' })}
            disabled={disabled}
            className={cn(
              'h-6 w-6 rounded border-2',
              settings.color === color && settings.tool === 'brush'
                ? 'border-primary'
                : 'border-gray-300'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Brush sizes */}
      <div className="flex items-center gap-1">
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange({ ...settings, size })}
            disabled={disabled}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded border',
              settings.size === size ? 'border-primary bg-primary/10' : 'border-gray-300'
            )}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(size, 24), height: Math.min(size, 24) }}
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="ml-auto flex gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={disabled}
          className="rounded border px-2 py-1 text-sm hover:bg-muted disabled:opacity-50"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="rounded border px-2 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
