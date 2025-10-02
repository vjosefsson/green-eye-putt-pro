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
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

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
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setTouchPosition({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMarkerDrag(e);
      return;
    }
    
    if (!touchPosition) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
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

    if (touchPosition && imageRef.current && !isDragging) {
      const rect = imageRef.current.getBoundingClientRect();
      const x = ((touchPosition.x - (rect.left - containerRef.current!.getBoundingClientRect().left)) / rect.width) * 100;
      const y = ((touchPosition.y - (rect.top - containerRef.current!.getBoundingClientRect().top)) / rect.height) * 100;

      if (!ballPosition) {
        setBallPosition({ x, y });
      } else if (!holePosition) {
        setHolePosition({ x, y });
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
    }, 500);
  };

  const handleMarkerDrag = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !draggedMarker || !imageRef.current) return;

    const touch = e.touches[0];
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;

    if (draggedMarker === 'ball') {
      setBallPosition({ x, y });
    } else {
      setHolePosition({ x, y });
    }
  };

  const handleConfirm = () => {
    if (ballPosition && holePosition) {
      onConfirm(ballPosition, holePosition);
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
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        <img
          ref={imageRef}
          src={imageData}
          alt="Golf green"
          onClick={handleImageClick}
          className="max-w-full max-h-full object-contain cursor-crosshair"
        />

        {/* Magnifying glass */}
        {touchPosition && (!ballPosition || !holePosition) && !isDragging && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: `${touchPosition.x}px`,
              top: `${touchPosition.y - 100}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="relative w-24 h-24 rounded-full border-4 border-white bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-full bg-white/50" />
                <div className="absolute w-full h-0.5 bg-white/50" />
              </div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 px-3 py-1 rounded text-white text-sm">
                {!ballPosition ? "Boll" : "Hål"}
              </div>
            </div>
          </div>
        )}
        
        {ballPosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-green-500 bg-green-500/30 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
            onTouchStart={(e) => handleMarkerTouchStart(e, 'ball')}
          />
        )}
        
        {holePosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-red-500 bg-red-500/30 transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${holePosition.x}%`, top: `${holePosition.y}%` }}
            onTouchStart={(e) => handleMarkerTouchStart(e, 'hole')}
          />
        )}
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
