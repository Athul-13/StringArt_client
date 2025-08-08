import React, { useState, useRef } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';

interface Nail {
  x: number;
  y: number;
}

interface StringArtVisualizerProps {
  nails: Nail[];
  lines: number[][];
}

export default function StringArtVisualizer({ nails, lines }:StringArtVisualizerProps) {
  const [visibleLines, setVisibleLines] = useState<number[][]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showNailNumbers, setShowNailNumbers] = useState(true);
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Stage dimensions
  const STAGE_WIDTH = 800;
  const STAGE_HEIGHT = 600;
  const CENTER_X = STAGE_WIDTH / 2;
  const CENTER_Y = STAGE_HEIGHT / 2;
  const RADIUS = 250;

  // Convert nail coordinates to circular positions if they aren't already
  const circularNails = nails.map((nail, index) => {
    // If nails are already positioned, use them; otherwise arrange in circle
    if (nail.x !== undefined && nail.y !== undefined) {
      return nail;
    }
    const angle = (index / nails.length) * 2 * Math.PI;
    return {
      x: CENTER_X + RADIUS * Math.cos(angle),
      y: CENTER_Y + RADIUS * Math.sin(angle)
    };
  });

  const startAnimation = () => {
    setVisibleLines([]);
    setIsAnimating(true);
    
    let currentLineIndex = 0;
    const interval = setInterval(() => {
      if (currentLineIndex < lines.length) {
        setVisibleLines(prev => [...prev, lines[currentLineIndex]]);
        currentLineIndex++;
      } else {
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 5); // 5ms intervals as requested
  };

  const resetAnimation = () => {
    setVisibleLines([]);
    setIsAnimating(false);
  };

  const showAllLines = () => {
    setVisibleLines([...lines]);
    setIsAnimating(false);
  };

  // Zoom functionality
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    
    // Limit zoom
    const clampedScale = Math.max(0.1, Math.min(newScale, 3));
    
    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  };

  // Convert line indices to actual coordinates
  const getLinePoints = (lineNails: number[]) => {
    const points: number[] = [];
    for (let i = 0; i < lineNails.length; i++) {
      const nailIndex = lineNails[i];
      if (circularNails[nailIndex]) {
        points.push(circularNails[nailIndex].x, circularNails[nailIndex].y);
      }
    }
    return points;
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md text-sm transition-colors"
            >
              {isAnimating ? 'Animating...' : 'Start Animation'}
            </button>
            <button
              onClick={showAllLines}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm transition-colors"
            >
              Show All
            </button>
            <button
              onClick={resetAnimation}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showNailNumbers}
                onChange={(e) => setShowNailNumbers(e.target.checked)}
                className="rounded"
              />
              Show Numbers
            </label>
            
            <div className="text-white text-sm">
              Lines: {visibleLines.length} / {lines.length}
            </div>
            
            <div className="text-white text-sm">
              Zoom: {Math.round(scale * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="relative w-full h-full">
        <Stage
          ref={stageRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          scaleX={scale}
          scaleY={scale}
          x={position.x}
          y={position.y}
          draggable
          onWheel={handleWheel}
          onDragEnd={(e) => {
            setPosition({
              x: e.target.x(),
              y: e.target.y(),
            });
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <Layer>
            {/* Background circle */}
            <Circle
              x={CENTER_X}
              y={CENTER_Y}
              radius={RADIUS + 10}
              stroke="#374151"
              strokeWidth={2}
              dash={[5, 5]}
            />
            
            {/* String lines */}
            {visibleLines.map((line, index) => (
              <Line
                key={index}
                points={getLinePoints(line)}
                stroke="#fbbf24"
                strokeWidth={0.8}
                opacity={0.8}
                lineCap="round"
                lineJoin="round"
              />
            ))}
            
            {/* Nails */}
            {circularNails.map((nail, index) => (
              <Group key={index}>
                <Circle
                  x={nail.x}
                  y={nail.y}
                  radius={4}
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth={1}
                />
                {showNailNumbers && (
                  <Text
                    x={nail.x - 8}
                    y={nail.y - 25}
                    text={index.toString()}
                    fontSize={12}
                    fill="#ffffff"
                    fontFamily="Arial"
                    align="center"
                    width={16}
                  />
                )}
              </Group>
            ))}
          </Layer>
        </Stage>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
          <div>• Drag to pan</div>
          <div>• Mouse wheel to zoom</div>
          <div>• Use controls to animate</div>
        </div>
        
        {/* Loading indicator */}
        {isAnimating && (
          <div className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <div className="bg-black bg-opacity-50 text-white px-3 py-2 rounded-md text-sm">
              Creating art... {Math.round((visibleLines.length / lines.length) * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
