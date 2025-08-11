import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Circle, Line, Text, Group } from 'react-konva';

interface Nail {
  x: number;
  y: number;
}

interface StringArtVisualizerProps {
  nails: Nail[];
  lines: number[];  // Array of nail indices from your server
  canvasSize?: number;
}

export default function StringArtVisualizer({ nails, lines, canvasSize = 600 }: StringArtVisualizerProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(10);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showNails, setShowNails] = useState(true);
  const [showNailNumbers, setShowNailNumbers] = useState(false);
  
  const animationRef = useRef<number>();
  const stageRef = useRef<any>(null);
  
  // Stage dimensions
  const STAGE_WIDTH = canvasSize;
  const STAGE_HEIGHT = canvasSize;
  
  // Scale nails to fit the stage
  const scaledNails = nails.map(nail => ({
    x: (nail.x / 300) * STAGE_WIDTH,
    y: (nail.y / 300) * STAGE_HEIGHT
  }));

  // Convert line indices to coordinate pairs for rendering
  const getVisibleLines = () => {
    if (!lines || currentLineIndex < 2) return [];
    
    const lineCoords = [];
    for (let i = 1; i < Math.min(currentLineIndex, lines.length); i++) {
      const nail1Index = lines[i - 1];
      const nail2Index = lines[i];
      
      if (scaledNails[nail1Index] && scaledNails[nail2Index]) {
        lineCoords.push([
          scaledNails[nail1Index].x,
          scaledNails[nail1Index].y,
          scaledNails[nail2Index].x,
          scaledNails[nail2Index].y
        ]);
      }
    }
    return lineCoords;
  };

  const startAnimation = () => {
    if (!lines || lines.length === 0) return;
    
    setCurrentLineIndex(0);
    setIsAnimating(true);
    
    const animate = () => {
      setCurrentLineIndex(prev => {
        const next = prev + animationSpeed;
        if (next >= lines.length) {
          setIsAnimating(false);
          return lines.length;
        }
        return next;
      });
      
      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const resetAnimation = () => {
    stopAnimation();
    setCurrentLineIndex(0);
  };

  const showAllLines = () => {
    stopAnimation();
    if (lines) {
      setCurrentLineIndex(lines.length);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAnimationSpeed(parseInt(e.target.value));
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX(); 
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    const clampedScale = Math.max(0.1, Math.min(newScale, 3));

    setScale(clampedScale);
    setPosition({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Stop animation when component updates
  useEffect(() => {
    if (!isAnimating && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [isAnimating]);

  if (!nails || !lines || nails.length === 0 || lines.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white text-lg">No string art data available</div>
      </div>
    );
  }

  const visibleLines = getVisibleLines();
  const progress = lines.length > 0 ? 
    ((currentLineIndex / lines.length) * 100).toFixed(1) : 0;

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Controls */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={startAnimation}
              disabled={isAnimating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
            >
              {isAnimating ? 'Animating...' : 'Start Animation'}
            </button>
            <button
              onClick={stopAnimation}
              disabled={!isAnimating}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md text-sm transition-colors"
            >
              Pause
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
              Speed:
              <input
                type="range"
                min="1"
                max="50"
                value={animationSpeed}
                onChange={handleSpeedChange}
                className="w-20"
              />
              <span className="w-8 text-center">{animationSpeed}</span>
            </label>
            
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showNails}
                onChange={(e) => setShowNails(e.target.checked)}
                className="rounded"
              />
              Nails
            </label>
            
            <label className="flex items-center gap-2 text-white text-sm">
              <input
                type="checkbox"
                checked={showNailNumbers}
                onChange={(e) => setShowNailNumbers(e.target.checked)}
                className="rounded"
              />
              Numbers
            </label>
            
            <div className="text-white text-sm">
              Progress: {currentLineIndex} / {lines.length} ({progress}%)
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" style={{ height: STAGE_HEIGHT }}>
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
        >
          <Layer>
            {/* String lines */}
            {visibleLines.map((linePoints, index) => (
              <Line
                key={index}
                points={linePoints}
                stroke="#fbbf24"
                strokeWidth={0.8}
                opacity={0.7}
              />
            ))}
            
            {/* Nails */}
            {showNails && scaledNails.map((nail, index) => (
              <Group key={index}>
                <Circle
                  x={nail.x}
                  y={nail.y}
                  radius={3}
                  fill="#ef4444"
                  stroke="#dc2626"
                  strokeWidth={1}
                />
                {showNailNumbers && (
                  <Text
                    x={nail.x - 8}
                    y={nail.y - 20}
                    text={index.toString()}
                    fontSize={10}
                    fill="#ffffff"
                    width={16}
                  />
                )}
              </Group>
            ))}
          </Layer>
        </Stage>
        
        {/* Instructions */}
        <div className="absolute bottom-4 left-4 text-white text-xs bg-black bg-opacity-75 p-3 rounded">
          <div>• Use controls to animate the string art</div>
          <div>• Adjust speed with the slider</div>
          <div>• Toggle nails and numbers visibility</div>
          <div className="mt-2 text-yellow-400">
            Total Nails: {nails.length}
          </div>
        </div>
        
        {/* Progress indicator */}
        {isAnimating && (
          <div className="absolute top-4 right-4">
            <div className="bg-black bg-opacity-75 text-white px-3 py-2 rounded-md text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                Creating art... {progress}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}