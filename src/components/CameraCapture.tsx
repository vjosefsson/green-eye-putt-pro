import { useState, useEffect } from "react";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { Button } from "./ui/button";
import { X, Camera, RotateCcw, ChevronRight } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (
    imageData: string, 
    ballPosition: { x: number; y: number }, 
    holePosition: { x: number; y: number },
    imageMetadata: { width: number; height: number }
  ) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [showInstructions, setShowInstructions] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [holePosition, setHolePosition] = useState<{ x: number; y: number } | null>(null);
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!showInstructions) {
      startCamera();
      document.body.classList.add('camera-active');
    }
    
    return () => {
      stopCamera();
      document.body.classList.remove('camera-active');
    };
  }, [showInstructions]);

  const startCamera = async () => {
    try {
      await CameraPreview.start({
        position: 'rear',
        toBack: true,
        enableHighResolution: true,
        disableAudio: true,
      });
      
      setIsCameraActive(true);
    } catch (error) {
      console.error("Error starting camera:", error);
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
    if (!isCameraActive || capturedImageData) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
      setIsLoading(true);
      const result = await CameraPreview.capture({ quality: 90 });
      
      // Get actual image dimensions
      const img = new Image();
      const imageDataUrl = `data:image/jpeg;base64,${result.value}`;
      
      img.onload = () => {
        const metadata = { width: img.width, height: img.height };
        setImageMetadata(metadata);
        setCapturedImageData(imageDataUrl);
        
        // Now we have the image loaded, show preview with markers
        setIsLoading(false);
      };
      
      img.src = imageDataUrl;
      await stopCamera();
    } catch (error) {
      console.error("Error capturing image:", error);
      setIsLoading(false);
    }
  };

  const confirmCapture = () => {
    if (!capturedImageData || !imageMetadata || !ballPosition || !holePosition) return;

    // Get the preview container dimensions
    const previewContainer = document.getElementById('image-preview');
    if (!previewContainer) return;

    const rect = previewContainer.getBoundingClientRect();
    
    // Convert screen pixel coordinates to image pixel coordinates
    const scaleX = imageMetadata.width / rect.width;
    const scaleY = imageMetadata.height / rect.height;
    
    const ballImageCoords = {
      x: ballPosition.x * scaleX,
      y: ballPosition.y * scaleY
    };
    
    const holeImageCoords = {
      x: holePosition.x * scaleX,
      y: holePosition.y * scaleY
    };

    onCapture(capturedImageData, ballImageCoords, holeImageCoords, imageMetadata);
  };

  if (showInstructions) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Photo Guide</h2>
            <p className="text-muted-foreground">För bästa resultat, följ dessa tips:</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Stå bakom bollen</h3>
                <p className="text-sm text-muted-foreground">Positionera dig bakom bollen mot hålet för bästa perspektiv</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Håll kameran i ögonhöjd</h3>
                <p className="text-sm text-muted-foreground">Undvik att luta telefonen för mycket - håll den så rakt som möjligt</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Inkludera både boll och hål</h3>
                <p className="text-sm text-muted-foreground">Se till att både bollen och hålet syns tydligt i bilden</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={() => setShowInstructions(false)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6"
            size="lg"
          >
            Fortsätt till kamera
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-transparent">
      {capturedImageData && imageMetadata ? (
        <div className="absolute inset-0 bg-black flex flex-col">
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <div id="image-preview" className="relative">
              <img 
                src={capturedImageData} 
                alt="Captured" 
                className="max-w-full max-h-[80vh] object-contain"
              />
              
              {ballPosition && (
                <div
                  className="absolute w-8 h-8"
                  style={{
                    left: `${ballPosition.x}px`,
                    top: `${ballPosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full bg-green-500/30" />
                    <div className="absolute inset-2 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                  </div>
                </div>
              )}

              {holePosition && (
                <div
                  className="absolute w-8 h-8"
                  style={{
                    left: `${holePosition.x}px`,
                    top: `${holePosition.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full bg-red-500/30" />
                    <div className="absolute inset-2 rounded-full bg-red-500 border-2 border-white shadow-lg" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-card/95 backdrop-blur-xl border-t border-border space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Kontrollera att markeringarna sitter rätt
            </p>
            <div className="flex gap-3">
              <Button
                onClick={confirmCapture}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                size="lg"
              >
                Analysera
              </Button>
              <Button
                onClick={() => {
                  setCapturedImageData(null);
                  setImageMetadata(null);
                  setBallPosition(null);
                  setHolePosition(null);
                  startCamera();
                }}
                variant="outline"
                size="lg"
              >
                Ta om
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 cursor-crosshair bg-transparent"
          onClick={handleScreenClick}
          style={{ zIndex: 999 }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-white font-medium">Capturing image...</p>
              </div>
            </div>
          )}

          {!ballPosition && !holePosition && isCameraActive && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center space-y-4 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <p className="text-white text-lg font-medium">Tryck för att markera bollen</p>
                <p className="text-white/70 text-sm mt-2">Första tryck = boll, Andra = hål</p>
              </div>
            </div>
          )}

          {ballPosition && !holePosition && isCameraActive && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <p className="text-white text-lg font-medium">Tryck nu för att markera hålet</p>
              </div>
            </div>
          )}

          {ballPosition && (
            <div
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                left: `${ballPosition.x}px`,
                top: `${ballPosition.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-green-500 border-2 border-white shadow-lg" />
              </div>
            </div>
          )}

          {holePosition && (
            <div
              className="absolute w-8 h-8 pointer-events-none"
              style={{
                left: `${holePosition.x}px`,
                top: `${holePosition.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
              }}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-red-500 border-2 border-white shadow-lg" />
              </div>
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-4 pointer-events-auto" style={{ zIndex: 1001 }}>
            {ballPosition && holePosition && (
              <>
                <Button
                  onClick={captureImage}
                  size="lg"
                  className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  disabled={isLoading}
                >
                  <Camera className="w-5 h-5" />
                  Ta bild
                </Button>
                
                <Button
                  onClick={handleResetMarkers}
                  size="lg"
                  variant="secondary"
                  className="flex items-center gap-2 shadow-lg"
                >
                  <RotateCcw className="w-5 h-5" />
                  Rensa
                </Button>
              </>
            )}

            <Button
              onClick={() => {
                stopCamera();
                window.location.reload();
              }}
              size="lg"
              variant="destructive"
              className="flex items-center gap-2 shadow-lg"
            >
              <X className="w-5 h-5" />
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
