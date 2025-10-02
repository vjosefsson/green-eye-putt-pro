import { useState, useEffect, useRef } from "react";
import { CameraPreview } from "@capacitor-community/camera-preview";
import { Motion } from "@capacitor/motion";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Button } from "./ui/button";
import { X, Camera, Loader2, ChevronRight } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string, imageMetadata: { width: number; height: number }) => void;
}

export const CameraCapture = ({ onCapture }: CameraCaptureProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ pitch: 0, roll: 0 });
  const [showInstructions, setShowInstructions] = useState(true);
  const lastHapticStatus = useRef<string>('');

  useEffect(() => {
    if (!showInstructions) {
      setIsStartingCamera(true);
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
      if (typeof DeviceOrientationEvent !== 'undefined') {
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

  const startCamera = async () => {
    try {
      await CameraPreview.start({
        position: 'rear',
        toBack: true,
        enableHighResolution: true,
        disableAudio: true,
      });
      
      setIsCameraActive(true);
      setIsStartingCamera(false);
    } catch (error) {
      console.error("Error starting camera:", error);
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

  const getLevelStatus = () => {
    const { pitch, roll } = deviceOrientation;
    const absRoll = Math.abs(roll);
    const absPitch = Math.abs(pitch - 90);
    
    if (absRoll < 10 && absPitch < 10) return { status: 'good', color: 'bg-green-500', text: 'Perfekt vinkel!' };
    if (absRoll < 20 && absPitch < 20) return { status: 'ok', color: 'bg-yellow-500', text: 'Justera lite' };
    return { status: 'bad', color: 'bg-red-500', text: 'Justera telefonen' };
  };

  const captureImage = async () => {
    try {
      setIsCapturing(true);
      
      const result = await CameraPreview.capture({ quality: 90 });
      const base64Image = `data:image/jpeg;base64,${result.value}`;
      
      await stopCamera();
      
      // Get image dimensions
      const img = new Image();
      img.src = base64Image;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const metadata = { width: img.width, height: img.height };
      
      console.log("Image captured with dimensions:", metadata);
      
      onCapture(base64Image, metadata);
      
    } catch (error) {
      console.error("Failed to capture image:", error);
    } finally {
      setIsCapturing(false);
    }
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
      {/* Camera loading indicator */}
      {isStartingCamera && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto" />
            <p className="text-white text-lg">Startar kamera...</p>
          </div>
        </div>
      )}

      {/* Main camera view */}
      {!showInstructions && (
        <div className="fixed inset-0 bg-black" style={{ zIndex: 999 }}>
          {/* Level indicator */}
          {isCameraActive && (
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className={`${getLevelStatus().color} px-6 py-3 rounded-full shadow-lg`}>
                <p className="text-white font-semibold text-sm">{getLevelStatus().text}</p>
              </div>
            </div>
          )}

          {/* Camera controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  await stopCamera();
                  window.location.href = '/';
                }}
                className="rounded-full w-12 h-12"
              >
                <X className="w-6 h-6" />
              </Button>

              <Button
                variant="camera"
                size="lg"
                onClick={captureImage}
                disabled={isCapturing}
                className="flex-1 max-w-xs"
              >
                {isCapturing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 mr-2" />
                    Take Photo
                  </>
                )}
              </Button>

              <div className="w-12 h-12"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
