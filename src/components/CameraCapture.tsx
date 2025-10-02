import { useState, useEffect, useRef } from "react";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { Motion } from "@capacitor/motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "./ui/button";
import { X, Camera, RotateCcw, ChevronRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight as ChevronRightArrow } from "lucide-react";

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
  // Viewport coordinates (original click positions, never modified)
  const [ballViewportPos, setBallViewportPos] = useState<{ x: number; y: number } | null>(null);
  const [holeViewportPos, setHoleViewportPos] = useState<{ x: number; y: number } | null>(null);
  // Preview display coordinates (only for preview rendering)
  const [ballPreviewPos, setBallPreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [holePreviewPos, setHolePreviewPos] = useState<{ x: number; y: number } | null>(null);
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);
  const [viewportDimensions, setViewportDimensions] = useState<{ width: number; height: number } | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<{ pitch: number; roll: number }>({ pitch: 90, roll: 0 });
  const [isDragging, setIsDragging] = useState<'ball' | 'hole' | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const lastHapticStatus = useRef<string>('');
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [touchPosition, setTouchPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInstructions) {
      setIsCameraLoading(true);
      startCamera();
      startMotionTracking();
      document.body.classList.add('camera-active');
    }
    
    return () => {
      stopCamera();
      stopMotionTracking();
      document.body.classList.remove('camera-active');
    };
  }, [showInstructions]);

  useEffect(() => {
    const status = getLevelStatus().status;
    if (isCameraActive && status !== lastHapticStatus.current) {
      lastHapticStatus.current = status;
      
      if (status === 'good') {
        Haptics.impact({ style: ImpactStyle.Light });
      } else if (status === 'ok') {
        Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        Haptics.impact({ style: ImpactStyle.Heavy });
      }
    }
  }, [deviceOrientation, isCameraActive]);

  const startMotionTracking = async () => {
    try {
      // Use DeviceOrientation API directly for better compatibility
      if (typeof DeviceOrientationEvent !== 'undefined') {
        // Request permission for iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission !== 'granted') {
            console.log("Motion permission denied");
            return;
          }
        }
        
        window.addEventListener('deviceorientation', handleOrientation);
      }
    } catch (error) {
      console.log("Motion tracking not available:", error);
    }
  };

  const handleOrientation = (event: DeviceOrientationEvent) => {
    setDeviceOrientation({
      pitch: event.beta || 90,
      roll: event.gamma || 0
    });
  };

  const stopMotionTracking = async () => {
    try {
      window.removeEventListener('deviceorientation', handleOrientation);
      await Motion.removeAllListeners();
    } catch (error) {
      console.log("Error stopping motion tracking:", error);
    }
  };

  const getLevelStatus = () => {
    const { pitch, roll } = deviceOrientation;
    const absRoll = Math.abs(roll);
    const absPitch = Math.abs(pitch - 90);
    
    if (absRoll < 10 && absPitch < 10) return { status: 'good', color: 'bg-green-500', text: 'Perfekt vinkel!' };
    if (absRoll < 20 && absPitch < 20) return { status: 'ok', color: 'bg-yellow-500', text: 'Justera lite' };
    return { status: 'bad', color: 'bg-red-500', text: 'Justera telefonen' };
  };

  const startCamera = async () => {
    try {
      await CameraPreview.start({
        position: 'rear',
        toBack: true,
        enableHighResolution: true,
        disableAudio: true,
      });
      
      setIsCameraActive(true);
      setIsCameraLoading(false);
    } catch (error) {
      console.error("Error starting camera:", error);
      setIsCameraLoading(false);
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
    if (!isCameraActive || capturedImageData || isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Store viewport dimensions on first click
    if (!viewportDimensions) {
      setViewportDimensions({ width: rect.width, height: rect.height });
    }

    console.log("Click viewport coords:", { x, y, viewportDim: { width: rect.width, height: rect.height } });

    if (!ballViewportPos) {
      setBallViewportPos({ x, y });
      Haptics.impact({ style: ImpactStyle.Medium });
    } else if (!holeViewportPos) {
      setHoleViewportPos({ x, y });
      Haptics.impact({ style: ImpactStyle.Medium });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCameraActive || capturedImageData || isDragging) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setTouchPosition({ x, y });

    // Store viewport dimensions
    if (!viewportDimensions) {
      setViewportDimensions({ width: rect.width, height: rect.height });
    }
  };

  const handleTouchMoveForMagnifier = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCameraActive || capturedImageData || isDragging || !touchPosition) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    setTouchPosition({ x, y });
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCameraActive || capturedImageData || isDragging || !touchPosition) return;
    
    console.log("Touch end viewport coords:", touchPosition);

    if (!ballViewportPos) {
      setBallViewportPos({ x: touchPosition.x, y: touchPosition.y });
      Haptics.impact({ style: ImpactStyle.Medium });
    } else if (!holeViewportPos) {
      setHoleViewportPos({ x: touchPosition.x, y: touchPosition.y });
      Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    setTouchPosition(null);
  };

  const handleMarkerTouchStart = (marker: 'ball' | 'hole', e: React.TouchEvent) => {
    e.stopPropagation();
    longPressTimer.current = setTimeout(() => {
      setIsDragging(marker);
      Haptics.impact({ style: ImpactStyle.Heavy });
    }, 500);
  };

  const handleMarkerTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsDragging(null);
  };

  const handleMarkerTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (isDragging === 'ball') {
      setBallViewportPos({ x, y });
    } else if (isDragging === 'hole') {
      setHoleViewportPos({ x, y });
    }
  };

  const handleResetMarkers = () => {
    setBallViewportPos(null);
    setHoleViewportPos(null);
    setBallPreviewPos(null);
    setHolePreviewPos(null);
  };

  const captureImage = async () => {
    if (!ballViewportPos || !holeViewportPos) return;

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
    if (!capturedImageData || !imageMetadata || !ballViewportPos || !holeViewportPos || !viewportDimensions) return;

    // Clean conversion: viewport pixels → image pixels
    const scaleX = imageMetadata.width / viewportDimensions.width;
    const scaleY = imageMetadata.height / viewportDimensions.height;
    
    const ballImageCoords = {
      x: ballViewportPos.x * scaleX,
      y: ballViewportPos.y * scaleY
    };
    
    const holeImageCoords = {
      x: holeViewportPos.x * scaleX,
      y: holeViewportPos.y * scaleY
    };

    console.log("Viewport dimensions:", viewportDimensions);
    console.log("Image metadata:", imageMetadata);
    console.log("Ball viewport→image:", ballViewportPos, "→", ballImageCoords);
    console.log("Hole viewport→image:", holeViewportPos, "→", holeImageCoords);

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
                <h3 className="font-semibold text-foreground">Håll telefonen rakt</h3>
                <p className="text-sm text-muted-foreground">En nivå-indikator guidar dig när kameran är aktiv. Håll telefonen parallellt med marken.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Optimalt avstånd</h3>
                <p className="text-sm text-muted-foreground">Stå cirka 2-3 meter från bollen för att få med hela putting-linjen.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-bold">4</span>
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
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const rect = img.getBoundingClientRect();
                  
                  // Calculate preview positions from viewport coordinates
                  if (ballViewportPos && viewportDimensions) {
                    // viewport → image → preview display
                    const imageX = (ballViewportPos.x / viewportDimensions.width) * imageMetadata.width;
                    const imageY = (ballViewportPos.y / viewportDimensions.height) * imageMetadata.height;
                    
                    const previewX = (imageX / imageMetadata.width) * rect.width;
                    const previewY = (imageY / imageMetadata.height) * rect.height;
                    
                    setBallPreviewPos({ x: previewX, y: previewY });
                  }
                  
                  if (holeViewportPos && viewportDimensions) {
                    // viewport → image → preview display
                    const imageX = (holeViewportPos.x / viewportDimensions.width) * imageMetadata.width;
                    const imageY = (holeViewportPos.y / viewportDimensions.height) * imageMetadata.height;
                    
                    const previewX = (imageX / imageMetadata.width) * rect.width;
                    const previewY = (imageY / imageMetadata.height) * rect.height;
                    
                    setHolePreviewPos({ x: previewX, y: previewY });
                  }
                }}
              />
              
              {ballPreviewPos && (
                <div
                  className="absolute w-8 h-8"
                  style={{
                    left: `${ballPreviewPos.x}px`,
                    top: `${ballPreviewPos.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 rounded-full bg-green-500/30" />
                    <div className="absolute inset-2 rounded-full bg-green-500 border-2 border-white shadow-lg" />
                  </div>
                </div>
              )}

              {holePreviewPos && (
                <div
                  className="absolute w-8 h-8"
                  style={{
                    left: `${holePreviewPos.x}px`,
                    top: `${holePreviewPos.y}px`,
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
                  setBallViewportPos(null);
                  setHoleViewportPos(null);
                  setBallPreviewPos(null);
                  setHolePreviewPos(null);
                  setViewportDimensions(null);
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
          ref={containerRef}
          className="absolute inset-0 cursor-crosshair bg-transparent"
          onClick={handleScreenClick}
          onTouchStart={handleTouchStart}
          onTouchMove={(e) => {
            handleTouchMoveForMagnifier(e);
            handleMarkerTouchMove(e);
          }}
          onTouchEnd={handleTouchEnd}
          style={{ zIndex: 999 }}
        >
          {/* Magnifying glass for precise marker placement */}
          {touchPosition && !ballViewportPos || (touchPosition && ballViewportPos && !holeViewportPos) ? (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${touchPosition.x}px`,
                top: `${touchPosition.y - 100}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1002,
              }}
            >
              <div className="relative w-32 h-32 rounded-full border-4 border-white/80 shadow-2xl overflow-hidden bg-black/20 backdrop-blur-sm">
                {/* Zoomed background */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMiIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+)',
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute w-full h-0.5 bg-primary/80" />
                  <div className="absolute w-0.5 h-full bg-primary/80" />
                  <div className="w-3 h-3 rounded-full border-2 border-primary bg-primary/40" />
                </div>
                {/* Label */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-xs font-medium">
                    {!ballViewportPos ? 'Boll' : 'Hål'}
                  </span>
                </div>
              </div>
              {/* Pointer line to finger */}
              <div 
                className="absolute top-full left-1/2 w-0.5 bg-white/50"
                style={{ height: '100px', transform: 'translateX(-50%)' }}
              />
            </div>
          ) : null}

          {/* Camera loading overlay */}
          {isCameraLoading && (
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-white font-medium">Startar kamera...</p>
              </div>
            </div>
          )}
          {/* Level indicator at top - moved down to avoid Dynamic Island */}
          {isCameraActive && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50">
              <div className={`${getLevelStatus().color} px-6 py-3 rounded-full backdrop-blur-md bg-opacity-90 shadow-lg transition-all duration-300`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {deviceOrientation.roll < -10 && <ChevronLeft className="w-4 h-4 text-white" />}
                    {deviceOrientation.roll > 10 && <ChevronRightArrow className="w-4 h-4 text-white" />}
                    {deviceOrientation.pitch < 80 && <ChevronUp className="w-4 h-4 text-white" />}
                    {deviceOrientation.pitch > 100 && <ChevronDown className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-white font-medium text-sm">{getLevelStatus().text}</span>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <p className="text-white font-medium">Tar bild...</p>
              </div>
            </div>
          )}

          {!ballViewportPos && !holeViewportPos && isCameraActive && (
            <div className="absolute bottom-32 left-0 right-0 px-6 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/20 max-w-sm mx-auto">
                <p className="text-white text-center font-medium">Tryck för att markera bollen</p>
                <p className="text-white/70 text-sm mt-1 text-center">Första tryck = boll, Andra = hål</p>
              </div>
            </div>
          )}

          {ballViewportPos && !holeViewportPos && isCameraActive && (
            <div className="absolute bottom-32 left-0 right-0 px-6 pointer-events-none">
              <div className="bg-black/70 backdrop-blur-md rounded-2xl p-4 border border-white/20 max-w-sm mx-auto">
                <p className="text-white text-center font-medium">Tryck nu för att markera hålet</p>
              </div>
            </div>
          )}

          {ballViewportPos && (
            <div
              className="absolute w-8 h-8"
              style={{
                left: `${ballViewportPos.x}px`,
                top: `${ballViewportPos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                pointerEvents: 'auto',
              }}
              onTouchStart={(e) => handleMarkerTouchStart('ball', e)}
              onTouchEnd={handleMarkerTouchEnd}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-green-500 border-2 border-white shadow-lg" />
              </div>
            </div>
          )}

          {holeViewportPos && (
            <div
              className="absolute w-8 h-8"
              style={{
                left: `${holeViewportPos.x}px`,
                top: `${holeViewportPos.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                pointerEvents: 'auto',
              }}
              onTouchStart={(e) => handleMarkerTouchStart('hole', e)}
              onTouchEnd={handleMarkerTouchEnd}
            >
              <div className="relative w-full h-full">
                <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-red-500 border-2 border-white shadow-lg" />
              </div>
            </div>
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8 pointer-events-auto" style={{ zIndex: 1001 }}>
            {/* Left side button */}
            <Button
              onClick={() => {
                setShowInstructions(true);
                setBallViewportPos(null);
                setHoleViewportPos(null);
                setBallPreviewPos(null);
                setHolePreviewPos(null);
                setCapturedImageData(null);
                setImageMetadata(null);
                setViewportDimensions(null);
              }}
              size="icon"
              variant="ghost"
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 shadow-lg"
            >
              <X className="w-6 h-6 text-white" />
            </Button>

            {/* Center capture button */}
            {ballViewportPos && holeViewportPos ? (
              <button
                onClick={captureImage}
                disabled={isLoading}
                className="relative w-20 h-20 rounded-full bg-white border-4 border-white shadow-2xl disabled:opacity-50 transition-transform active:scale-95 hover:scale-105"
              >
                <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                  <Camera className="w-8 h-8 text-black" />
                </div>
              </button>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/30 border-4 border-white/50 backdrop-blur-sm" />
            )}

            {/* Right side button */}
            {(ballViewportPos || holeViewportPos) ? (
              <Button
                onClick={handleResetMarkers}
                size="icon"
                variant="ghost"
                className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 border border-white/20 shadow-lg"
              >
                <RotateCcw className="w-6 h-6 text-white" />
              </Button>
            ) : (
              <div className="w-14 h-14" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
