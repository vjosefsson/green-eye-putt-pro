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
  const [imageMetadata, setImageMetadata] = useState<{ width: number; height: number } | null>(null);

  const handleCapture = (imageData: string, metadata: { width: number; height: number }) => {
    setCapturedImage(imageData);
    setImageMetadata(metadata);
  };

  const handleMarkerConfirm = (ballPosition: { x: number; y: number }, holePosition: { x: number; y: number }) => {
    setMarkers({ ball: ballPosition, hole: holePosition });
  };

  const handleReset = () => {
    setCapturedImage(null);
    setMarkers(null);
    setImageMetadata(null);
  };

  const handleRetakePhoto = () => {
    setCapturedImage(null);
    setImageMetadata(null);
  };

  return (
    <>
      {!capturedImage ? (
        <CameraCapture onCapture={handleCapture} />
      ) : !markers ? (
        <MarkerSelection 
          imageData={capturedImage}
          onConfirm={handleMarkerConfirm}
          onReset={handleRetakePhoto}
        />
      ) : (
        <AnalysisResults 
          imageData={capturedImage} 
          markers={markers}
          imageMetadata={imageMetadata!}
          onReset={handleReset} 
        />
      )}
    </>
  );
};

export default Index;
