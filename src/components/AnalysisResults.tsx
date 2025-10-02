import { useState, useEffect, useRef } from "react";
import { RotateCcw, Loader2, TrendingUp, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface AnalysisResultsProps {
  imageData: string;
  markers: {
    ball: { x: number; y: number };
    hole: { x: number; y: number };
  };
  imageMetadata: {
    width: number;
    height: number;
  };
  onReset: () => void;
}

interface AnalysisData {
  puttingLine: {
    direction: string;
    break: string;
    confidence: string;
  };
  recommendations: string[];
}

export const AnalysisResults = ({ imageData, markers, imageMetadata, onReset }: AnalysisResultsProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    analyzeGreen();
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setDisplayDimensions({
        width: imageRef.current.clientWidth,
        height: imageRef.current.clientHeight,
      });
    }
  };

  const createPuttingPath = () => {
    // Calculate scale factor from actual image to displayed image
    const scaleX = displayDimensions.width / imageMetadata.width;
    const scaleY = displayDimensions.height / imageMetadata.height;
    
    // Convert image pixel coordinates to display coordinates
    const ballX = markers.ball.x * scaleX;
    const ballY = markers.ball.y * scaleY;
    const holeX = markers.hole.x * scaleX;
    const holeY = markers.hole.y * scaleY;
    
    // Calculate control point for bezier curve (simulate break)
    const midX = (ballX + holeX) / 2;
    const midY = (ballY + holeY) / 2;
    
    // Offset perpendicular to the line to create break
    const dx = holeX - ballX;
    const dy = holeY - ballY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const breakAmount = length * 0.15; // 15% break
    
    const controlX = midX + (dy / length) * breakAmount;
    const controlY = midY - (dx / length) * breakAmount;
    
    return `M ${ballX} ${ballY} Q ${controlX} ${controlY} ${holeX} ${holeY}`;
  };

  const analyzeGreen = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log("Sending image for analysis...");
      
      const { data, error: functionError } = await supabase.functions.invoke("analyze-green", {
        body: { imageData, markers }
      });

      if (functionError) {
        throw functionError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      console.log("Analysis received:", data);
      setAnalysis(data);
      toast.success("Analys klar!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Kunde inte analysera green. Försök igen.";
      setError(errorMessage);
      console.error("Analysis error:", err);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Full-screen image with overlay */}
      <div className="absolute inset-0">
        <img 
          ref={imageRef}
          src={imageData} 
          alt="Golf green analysis" 
          className="w-full h-full object-contain"
          onLoad={handleImageLoad}
        />
        
        {displayDimensions.width > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            width={displayDimensions.width}
            height={displayDimensions.height}
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: 'translate(-50%, -50%)'
            }}
          >
            <defs>
              <linearGradient id="puttLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 0.9 }} />
                <stop offset="50%" style={{ stopColor: 'rgba(255, 215, 0, 0.95)', stopOpacity: 0.95 }} />
                <stop offset="100%" style={{ stopColor: 'rgba(255, 255, 255, 0.9)', stopOpacity: 0.9 }} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Putting line with glow effect */}
            {!isAnalyzing && analysis && (
              <>
                {/* Shadow/glow layer */}
                <path
                  d={createPuttingPath()}
                  stroke="rgba(255, 215, 0, 0.6)"
                  strokeWidth="12"
                  fill="none"
                  filter="url(#glow)"
                  className="animate-pulse"
                />
                {/* Main line */}
                <path
                  d={createPuttingPath()}
                  stroke="url(#puttLineGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Animated dash overlay */}
                <path
                  d={createPuttingPath()}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  className="animate-[dash_1s_linear_infinite]"
                />
              </>
            )}
            
            {/* Ball marker */}
            <circle
              cx={(markers.ball.x * displayDimensions.width) / imageMetadata.width}
              cy={(markers.ball.y * displayDimensions.height) / imageMetadata.height}
              r="12"
              fill="rgba(34, 197, 94, 0.3)"
              stroke="rgb(34, 197, 94)"
              strokeWidth="3"
            />
            <circle
              cx={(markers.ball.x * displayDimensions.width) / imageMetadata.width}
              cy={(markers.ball.y * displayDimensions.height) / imageMetadata.height}
              r="4"
              fill="rgb(34, 197, 94)"
            />
            
            {/* Hole marker */}
            <circle
              cx={(markers.hole.x * displayDimensions.width) / imageMetadata.width}
              cy={(markers.hole.y * displayDimensions.height) / imageMetadata.height}
              r="12"
              fill="rgba(239, 68, 68, 0.3)"
              stroke="rgb(239, 68, 68)"
              strokeWidth="3"
            />
            <circle
              cx={(markers.hole.x * displayDimensions.width) / imageMetadata.width}
              cy={(markers.hole.y * displayDimensions.height) / imageMetadata.height}
              r="4"
              fill="rgb(239, 68, 68)"
            />
          </svg>
        )}
      </div>

      {/* Swipeable bottom drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <button className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-background/95 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-border flex items-center gap-2 hover:bg-background/100 transition-colors">
            <ChevronUp className="h-5 w-5" />
            <span className="font-medium">Visa analys</span>
          </button>
        </DrawerTrigger>
        
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Putting-analys</DrawerTitle>
          </DrawerHeader>
          
          <div className="overflow-y-auto px-4 pb-6 space-y-4">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyserar green...</p>
              </div>
            ) : error ? (
              <div className="space-y-4">
                <p className="text-destructive text-center">{error}</p>
                <Button onClick={analyzeGreen} className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Försök igen
                </Button>
              </div>
            ) : analysis ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold">Putting Line Analysis</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold text-sm text-primary mb-1">Riktpunkt</h4>
                    <p className="text-foreground">{analysis.puttingLine.direction}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h4 className="font-semibold text-sm text-primary mb-1">Break-analys</h4>
                    <p className="text-foreground">{analysis.puttingLine.break}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <h4 className="font-semibold text-sm text-accent-foreground mb-1">Säkerhet</h4>
                    <p className="text-foreground">{analysis.puttingLine.confidence}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="font-semibold text-sm mb-3">Rekommendationer</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={onReset} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Analysera en annan green
                </Button>
              </>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
