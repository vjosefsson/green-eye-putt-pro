import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { MarkerSelection } from "@/components/MarkerSelection";
import { AnalysisResults } from "@/components/AnalysisResults";

interface Markers {
  ball: { x: number; y: number };
  hole: { x: number; y: number };
}

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Markers | null>(null);

  const handleCapture = (imageData: string) => {
    setCapturedImage(imageData);
  };

  const handleMarkersConfirm = (ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => {
    setMarkers({ ball: ballPosition, hole: holePosition });
  };

  const handleReset = () => {
    setCapturedImage(null);
    setMarkers(null);
  };

  return (
    <>
      {!capturedImage ? (
        <CameraCapture onCapture={handleCapture} />
      ) : !markers ? (
        <MarkerSelection 
          imageData={capturedImage} 
          onConfirm={handleMarkersConfirm}
          onReset={handleReset}
        />
      ) : (
        <AnalysisResults 
          imageData={capturedImage} 
          markers={markers}
          onReset={handleReset} 
        />
      )}
    </>
  );
};

export default Index;
