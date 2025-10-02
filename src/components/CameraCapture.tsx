import { useState, useEffect } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraPreview } from "@capacitor-community/camera-preview";

interface CameraCaptureProps {
  onCapture: (imageData: string, ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [holePosition, setHolePosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setIsStartingCamera(true);
    
    try {
      console.log("Starting camera preview...");
      
      await CameraPreview.start({
        position: 'rear',
        enableHighResolution: true,
        disableAudio: true,
        width: window.innerWidth,
        height: window.innerHeight,
        x: 0,
        y: 0,
      });
      
      console.log("Camera preview started");
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (error) {
      console.error("Error starting camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
      setIsStartingCamera(false);
    }
  };

  const stopCamera = async () => {
    try {
      await CameraPreview.stop();
      setIsCameraActive(false);
    } catch (error) {
      console.error("Error stopping camera:", error);
    }
  };

  const handleScreenClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!ballPosition) {
      setBallPosition({ x, y });
    } else if (!holePosition) {
      setHolePosition({ x, y });
    }
  };

  const handleResetMarkers = () => {
    setBallPosition(null);
    setHolePosition(null);
  };

  const captureImage = async () => {
    if (!ballPosition || !holePosition) return;
    
    try {
      console.log("Capturing image...");
      const result = await CameraPreview.capture({
        quality: 90,
      });
      
      console.log("Image captured successfully");
      const imageData = `data:image/jpeg;base64,${result.value}`;
      
      await stopCamera();
      onCapture(imageData, ballPosition, holePosition);
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("Unable to capture image. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0">
      {/* Overlay UI */}
      <div 
        className="absolute inset-0 cursor-crosshair"
        onClick={handleScreenClick}
        style={{ zIndex: 999 }}
      >
        {isStartingCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              <Camera className="w-12 h-12 mb-3 text-primary mx-auto animate-pulse" />
              <p className="text-white text-lg">Starting camera...</p>
            </div>
          </div>
        )}
        
        {/* Guide overlay */}
        {isCameraActive && !ballPosition && !holePosition && (
          <div className="absolute inset-0 border-4 border-primary/20 pointer-events-none">
            <div className="absolute inset-4 border-2 border-primary/40 border-dashed" />
          </div>
        )}

        {/* Ball marker */}
        {ballPosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-green-500 bg-green-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
            style={{ left: `${ballPosition.x}%`, top: `${ballPosition.y}%` }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse" />
          </div>
        )}
        
        {/* Hole marker */}
        {holePosition && (
          <div
            className="absolute w-10 h-10 rounded-full border-4 border-red-500 bg-red-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-scale-in"
            style={{ left: `${holePosition.x}%`, top: `${holePosition.y}%` }}
          >
            <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-pulse" />
          </div>
        )}

        {/* Instructions */}
        {isCameraActive && (
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="text-center">
              <p className="text-white text-lg font-semibold animate-fade-in">
                {!ballPosition ? "Tap to mark the ball position" : !holePosition ? "Tap to mark the hole" : "Ready to capture!"}
              </p>
              <div className="flex items-center justify-center gap-4 mt-3">
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
          </div>
        )}

        {/* Bottom controls */}
        {isCameraActive && (
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3 bg-gradient-to-t from-black/90 to-transparent pointer-events-auto">
            {ballPosition && holePosition && (
              <Button 
                variant="camera" 
                size="lg" 
                onClick={captureImage}
                className="w-full animate-fade-in"
              >
                <Camera className="mr-2" />
                Capture & Analyze
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
                onClick={stopCamera}
                className="flex-1"
              >
                <RotateCcw className="mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
