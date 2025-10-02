import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, CheckCircle } from "lucide-react";

interface MarkerSelectionProps {
  imageData: string;
  onConfirm: (ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => void;
  onReset: () => void;
}

export const MarkerSelection = ({ imageData, onConfirm, onReset }: MarkerSelectionProps) => {
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [holePosition, setHolePosition] = useState<{ x: number; y: number } | null>(null);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMarker, setDraggedMarker] = useState<'ball' | 'hole' | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current || isDragging) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!ballPosition) {
      setBallPosition({ x, y });
    } else if (!holePosition) {
      setHolePosition({ x, y });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setTouchPosition({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (isDragging) {
      // Update marker position during drag
      if (draggedMarker === 'ball') {
        setBallPosition({ x, y });
      } else if (draggedMarker === 'hole') {
        setHolePosition({ x, y });
      }
    }
    
    // Always update touch position for magnifier
    setTouchPosition({ x, y });
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDragging) {
      setIsDragging(false);
      setDraggedMarker(null);
      setTouchPosition(null);
      return;
    }

    if (touchPosition && imageRef.current) {
      if (!ballPosition) {
        setBallPosition({ x: touchPosition.x, y: touchPosition.y });
      } else if (!holePosition) {
        setHolePosition({ x: touchPosition.x, y: touchPosition.y });
      }
    }
    
    setTouchPosition(null);
  };

  const handleMarkerTouchStart = (e: React.TouchEvent<HTMLDivElement>, markerType: 'ball' | 'hole') => {
    e.stopPropagation();
    e.preventDefault();
    
    longPressTimerRef.current = setTimeout(() => {
      setIsDragging(true);
      setDraggedMarker(markerType);
      if (navigator.vibrate) {
        navigator.vibrate(50); // Haptic feedback
      }
    }, 300);
  };


  const handleConfirm = () => {
    if (ballPosition && holePosition && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      
      // Convert pixel coordinates to percentages relative to the actual image
      const ballPercent = {
        x: (ballPosition.x / rect.width) * 100,
        y: (ballPosition.y / rect.height) * 100
      };
      const holePercent = {
        x: (holePosition.x / rect.width) * 100,
        y: (holePosition.y / rect.height) * 100
      };
      
      onConfirm(ballPercent, holePercent);
    }
  };

  const handleResetMarkers = () => {
    setBallPosition(null);
    setHolePosition(null);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div 
        ref={containerRef}
        className="relative flex-1 flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={imageData}
            alt="Golf green"
            onClick={handleImageClick}
            className="max-w-full max-h-full object-contain cursor-crosshair"
          />

          {/* Magnifying glass */}
          {touchPosition && ((!ballPosition || !holePosition) || isDragging) && (
            <div
              className="absolute pointer-events-none z-50"
              style={{
                left: `${touchPosition.x}px`,
                top: `${touchPosition.y}px`,
                transform: 'translate(-50%, calc(-100% - 20px))'
              }}
            >
              <div className="relative w-24 h-24 rounded-full border-4 border-white bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-white/50" />
                  <div className="absolute w-full h-0.5 bg-white/50" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 px-3 py-1 rounded text-white text-sm">
                  {isDragging ? (draggedMarker === 'ball' ? "Flytta boll" : "Flytta hål") : (!ballPosition ? "Boll" : "Hål")}
                </div>
              </div>
            </div>
          )}
          
          {ballPosition && (
            <div
              className="absolute w-10 h-10 rounded-full border-4 border-green-500 bg-green-500/30 transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${ballPosition.x}px`,
                top: `${ballPosition.y}px`,
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onTouchStart={(e) => handleMarkerTouchStart(e, 'ball')}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
          
          {holePosition && (
            <div
              className="absolute w-10 h-10 rounded-full border-4 border-red-500 bg-red-500/30 transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${holePosition.x}px`,
                top: `${holePosition.y}px`,
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none'
              }}
              onTouchStart={(e) => handleMarkerTouchStart(e, 'hole')}
              onContextMenu={(e) => e.preventDefault()}
            />
          )}
        </div>
      </div>

      <div className="p-6 space-y-3 bg-gradient-to-t from-black/90 to-transparent">
        <div className="text-center mb-4">
          <p className="text-white text-lg font-semibold">
            {!ballPosition ? "Tap to mark the ball" : !holePosition ? "Tap to mark the hole" : "Ready to analyze"}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500/30" />
              <span className="text-white text-sm">Ball {ballPosition && "✓"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500/30" />
              <span className="text-white text-sm">Hole {holePosition && "✓"}</span>
            </div>
          </div>
        </div>

        {ballPosition && holePosition && (
          <Button 
            variant="camera" 
            size="lg" 
            onClick={handleConfirm}
            className="w-full"
          >
            <CheckCircle className="mr-2" />
            Analyze Green
          </Button>
        )}
        
        <div className="flex gap-3">
          {(ballPosition || holePosition) && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleResetMarkers}
              className="flex-1"
            >
              Reset Markers
            </Button>
          )}
          <Button 
            variant="outline" 
            size="lg" 
            onClick={onReset}
            className="flex-1"
          >
            <RotateCcw className="mr-2" />
            Retake Photo
          </Button>
        </div>
      </div>
    </div>
  );
};
