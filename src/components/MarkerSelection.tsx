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
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!ballPosition) {
      setBallPosition({ x, y });
    } else if (!holePosition) {
      setHolePosition({ x, y });
    }
  };

  const handleConfirm = () => {
    if (ballPosition && holePosition) {
      onConfirm(ballPosition, holePosition);
    }
  };

  const handleReset = () => {
    setBallPosition(null);
    setHolePosition(null);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="relative flex-1 flex items-center justify-center">
        <img
          ref={imageRef}
          src={imageData}
          alt="Golf green"
          onClick={handleImageClick}
          className="max-w-full max-h-full object-contain cursor-crosshair"
        />
        
        {ballPosition && (
          <div
            className="absolute w-8 h-8 rounded-full border-4 border-green-500 bg-green-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
          />
        )}
        
        {holePosition && (
          <div
            className="absolute w-8 h-8 rounded-full border-4 border-red-500 bg-red-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${holePosition.x}%`, top: `${holePosition.y}%` }}
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
              onClick={handleReset}
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
