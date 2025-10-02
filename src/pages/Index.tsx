import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { AnalysisResults } from "@/components/AnalysisResults";

interface Markers {
  ball: { x: number; y: number };
  hole: { x: number; y: number };
}

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markers, setMarkers] = useState<Markers | null>(null);

  const handleCapture = (imageData: string, ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => {
    setCapturedImage(imageData);
    setMarkers({ ball: ballPosition, hole: holePosition });
  };

  const handleReset = () => {
    setCapturedImage(null);
    setMarkers(null);
  };

  return (
    <>
      {!capturedImage || !markers ? (
        <CameraCapture onCapture={handleCapture} />
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
