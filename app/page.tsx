"use client";

import React, { useEffect, useState, useRef, RefObject } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import Konva from 'konva';

interface Layer {
  id: number;
  image: HTMLImageElement;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function Home() {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [background, setBackground] = useState<HTMLImageElement | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [renderedImage, setRenderedImage] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [harmonizedImage, setHarmonizedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animationText, setAnimationText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [animationStatus, setAnimationStatus] = useState<string>('');

  // New state for image source dialog
  const [showImageSourceDialog, setShowImageSourceDialog] = useState(false);
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'generate'>('upload');
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImageTarget, setCurrentImageTarget] = useState<'background' | 'layer'>('background');

  // Show the image source dialog for background selection
  const handleBackgroundClick = () => {
    setCurrentImageTarget('background');
    setImageSourceType('upload');
    setGeneratePrompt('');
    setShowImageSourceDialog(true);
  };

  // Show the image source dialog for layer import
  const handleAddImageClick = () => {
    setCurrentImageTarget('layer');
    setImageSourceType('upload');
    setGeneratePrompt('');
    setShowImageSourceDialog(true);
  };

  // Handle file upload from the dialog
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        if (currentImageTarget === 'background') {
          setBackground(img as HTMLImageElement);
        } else {
          const id = Date.now();
          setLayers((prevLayers) => [...prevLayers, { id, image: img, x: 50, y: 50, rotation: 0, scale: 1 }]);
        }
        setShowImageSourceDialog(false);
        // Reset the file input
        e.target.value = '';
      };
    }
  };

  // Handle image generation from text
  const handleImageGeneration = async () => {
    if (!generatePrompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/gen/imagegen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: generatePrompt.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      if (data.success && data.image) {
        // Convert base64 to image
        const img = new window.Image();
        img.src = `data:image/png;base64,${data.image}`;
        img.onload = () => {
          if (currentImageTarget === 'background') {
            setBackground(img as HTMLImageElement);
          } else {
            const id = Date.now();
            setLayers((prevLayers) => [...prevLayers, { id, image: img, x: 50, y: 50, rotation: 0, scale: 1 }]);
          }
          setShowImageSourceDialog(false);
          setGeneratePrompt('');
        };
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError((error as Error).message || 'Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Close the image source dialog
  const closeImageSourceDialog = () => {
    setShowImageSourceDialog(false);
    setGeneratePrompt('');
    setError(null);
  };

  // Original handlers (keeping for compatibility - these won't be used in UI but needed for compilation)
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        setBackground(img as HTMLImageElement);
      };
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const id = Date.now();
        setLayers((prevLayers) => [...prevLayers, { id, image: img, x: 50, y: 50, rotation: 0, scale: 1 }]);
      };
    }
  };

  const handleDragEnd = (e: any, id: number) => {
    const { x, y } = e.target.attrs;
    setLayers((prevLayers) =>
      prevLayers.map((layer) => (layer.id === id ? { ...layer, x, y } : layer))
    );
  };

  const handleTransformEnd = (e: any, id: number) => {
    const node = e.target;
    const scaleX = node.scaleX();
    setLayers((prevLayers) =>
      prevLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              x: node.x(),
              y: node.y(),
              rotation: node.rotation(),
              scale: scaleX,
            }
          : layer
      )
    );
  };

  const handleGenerate = () => {
    if (stageRef.current) {
      // Temporarily deselect any selected node to hide the transformer
      const currentSelectedId = selectedId;
      setSelectedId(null);
      
      // Wait for React to update the DOM
      setTimeout(() => {
        if (stageRef.current) {
          const uri = stageRef.current.toDataURL();
          setRenderedImage(uri);
          setShowModal(true);
          
          // Restore selection if needed
          if (currentSelectedId !== null) {
            setSelectedId(currentSelectedId);
          }
        }
      }, 50);
    }
  };

  const handleDownload = (imageUrl: string, filename = "collage.png") => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.download = filename;
      link.href = imageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmitToBackend = async () => {
    if (!renderedImage) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert dataURL to blob
      const response = await fetch(renderedImage);
      const blob = await response.blob();
      
      // Create FormData and append image and instructions
      const formData = new FormData();
      formData.append('image', blob, 'collage.png');
      formData.append('instructions', instructions);
      
      // Submit to backend
      const result = await fetch('/api/gen/harmonize', {
        method: 'POST',
        body: formData,
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || 'Failed to generate harmonized image');
      }
      
      // Handle response with base64 image data
      const data = await result.json();
      if (data.success && data.image) {
        // Set the harmonized image with proper base64 data URL
        setHarmonizedImage(`data:image/png;base64,${data.image}`);
        // Close instruction modal and show result modal
        setShowModal(false);
        setShowResultModal(true);
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError((error as Error).message || 'Failed to generate image. Please try again.');
      // Close the modal when there's an error
      setTimeout(() => {
        setShowModal(false);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnimation = async () => {
    if (!harmonizedImage || !animationText.trim()) return;
    
    setIsAnimating(true);
    setPredictionId(null);
    setVideoUrl(null);
    setAnimationStatus('Starting prediction...');
    
    try {
      // Convert data URL to blob
      const response = await fetch(harmonizedImage);
      const blob = await response.blob();
      
      // Create FormData and append image and animation text
      const formData = new FormData();
      formData.append('image', blob, 'harmonized.png');
      formData.append('text', animationText);
      
      // Submit to animation endpoint
      const result = await fetch('/api/gen/animate', {
        method: 'POST',
        body: formData,
      });
      
      if (!result.ok) {
        const errorData = await result.json();
        throw new Error(errorData.error || 'Animation failed');
      }
      
      // Handle successful animation start
      const data = await result.json();
      if (data.success && data.predictionId) {
        setPredictionId(data.predictionId);
        setAnimationStatus('Processing animation...');
        
        // Start polling for status updates
        const interval = setInterval(async () => {
          await checkAnimationStatus(data.predictionId);
        }, 5000); // Check every 5 seconds
        
        setPollingInterval(interval);
        
      } else {
        throw new Error(data.error || 'Animation failed');
      }
    } catch (error) {
      console.error('Error creating animation:', error);
      alert((error as Error).message || 'Failed to create animation. Please try again.');
      setIsAnimating(false);
      setAnimationStatus('');
    }
  };

  const formatStatus = (status: string): string => {
    switch (status) {
      case 'starting':
        return 'Starting animation process...';
      case 'processing':
        return 'Processing your animation...';
      case 'succeeded':
        return 'Animation completed!';
      case 'failed':
        return 'Animation failed';
      default:
        return `Status: ${status}`;
    }
  };

  const checkAnimationStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/gen/animate?id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to check animation status');
      }
      
      const data = await response.json();
      setAnimationStatus(formatStatus(data.status));
      
      if (data.status === 'completed' && data.videoUrl) {
        // Animation is ready
        setVideoUrl(data.videoUrl);
        setIsAnimating(false);
        setAnimationStatus('');
        
        // Stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
      } else if (data.status === 'failed') {
        // Animation failed
        throw new Error(data.error || 'Animation generation failed');
      } else {
        // Still processing, update status with more detail
        setAnimationStatus(formatStatus(data.status || 'processing'));
      }
      
    } catch (error) {
      console.error('Error checking animation status:', error);
      alert('Failed to check animation status: ' + (error as Error).message);
      setIsAnimating(false);
      setAnimationStatus('');
      
      // Stop polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const closeModal = () => {
    setShowModal(false);
    setInstructions('');
    setError(null);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setHarmonizedImage(null);
    setAnimationText('');
  };

  useEffect(() => {
    if (selectedId && transformerRef.current) {
      const stage = transformerRef.current.getStage();
      const selectedNode = stage!.findOne(`#layer-${selectedId}`);
      if (selectedNode) {
        transformerRef.current!.nodes([selectedNode]);
        transformerRef.current!.getLayer()!.batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-[#18181b] dark:to-[#23272f] p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-extrabold mb-8 text-center tracking-tight text-gray-900 dark:text-white drop-shadow-lg">PortraitMix Image Editor</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1 flex flex-col gap-4 bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-xl p-6 border border-gray-200 dark:border-gray-800">
            <button 
              onClick={handleBackgroundClick}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Select Background Image
            </button>
            {background && <span className="text-sm text-green-600 font-medium flex items-center gap-1"><svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Background selected</span>}
            <button 
              onClick={handleAddImageClick}
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white py-3 px-6 rounded-xl font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Import an Image
            </button>
            {layers.length > 0 && <span className="text-sm text-blue-600 font-medium flex items-center gap-1"><svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{layers.length} layer(s) added</span>}
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="border border-gray-300 dark:border-gray-700 rounded-2xl overflow-hidden shadow-lg bg-white/70 dark:bg-gray-900/70" style={{ width: "800px", height: "600px" }}>
              <Stage width={800} height={600} ref={stageRef}>
                <Layer>
                  {background && (
                    <KonvaImage image={background} width={800} height={600} />
                  )}
                  {layers.map((layer) => (
                    <KonvaImage
                      key={layer.id}
                      id={`layer-${layer.id}`}
                      image={layer.image}
                      x={layer.x}
                      y={layer.y}
                      rotation={layer.rotation}
                      scaleX={layer.scale}
                      scaleY={layer.scale}
                      draggable
                      onClick={() => setSelectedId(layer.id)}
                      onTap={() => setSelectedId(layer.id)}
                      onDragEnd={(e) => handleDragEnd(e, layer.id)}
                      onTransformEnd={(e) => handleTransformEnd(e, layer.id)}
                    />
                  ))}
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 20 || newBox.height < 20) {
                        return oldBox;
                      }
                      return newBox;
                    }}
                  />
                </Layer>
              </Stage>
            </div>
            <button 
              onClick={handleGenerate} 
              disabled={!background}
              className={`mt-6 py-3 px-8 rounded-xl text-lg font-bold shadow-lg transition-all duration-200 flex items-center gap-2 ${background ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* Instructions Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-4/5 max-w-3xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">Generated Image</h2>
            
            {error && (
              <div className="bg-red-500 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <div className="text-center mb-4">
              <img 
                src={renderedImage} 
                alt="Rendered collage" 
                className="max-w-full max-h-[50vh] object-contain mx-auto rounded" 
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="instructions" className="block mb-2">
                Instructions:
              </label>
              <input
                id="instructions"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Optional instructions (Ex: cartoon style)"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleDownload(renderedImage)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                  disabled={isSubmitting}
                >
                  Download
                </button>
                
                <button
                  onClick={handleSubmitToBackend}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded flex items-center ${isSubmitting ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && harmonizedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-4/5 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Harmonized Image</h2>
              <button 
                onClick={closeResultModal}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <img 
                src={harmonizedImage} 
                alt="Harmonized image" 
                className="max-w-full max-h-[60vh] object-contain mx-auto rounded shadow-lg" 
              />
              <p className="text-green-400 mt-3">✓ Image successfully harmonized</p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="animation-text" className="block mb-2 font-medium">
                Animation Description:
              </label>
              <input
                id="animation-text"
                type="text"
                value={animationText}
                onChange={(e) => setAnimationText(e.target.value)}
                placeholder="Describe how you want the image to be animated (e.g., 'zoom in slowly')"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
              />
            </div>
            
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => handleDownload(harmonizedImage, "harmonized-collage.png")}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download
              </button>
              
              <button
                onClick={handleSubmitAnimation}
                disabled={isAnimating || !animationText.trim()}
                className={`px-6 py-3 rounded-lg flex items-center ${
                  animationText.trim() && !isAnimating 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-600 cursor-not-allowed'
                }`}
              >
                {isAnimating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {animationStatus || 'Processing...'}
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    Animate
                  </>
                )}
              </button>
            </div>
            
            {/* Show video if available */}
            {videoUrl && (
              <div className="mt-6 w-full">
                <h3 className="text-lg font-medium mb-2">Your Animation:</h3>
                <div className="relative pt-[56.25%] w-full">
                  <video 
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                  />
                </div>
                <div className="mt-3">
                  <a 
                    href={videoUrl} 
                    download="animation.mp4"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Download Animation
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Image Source Dialog */}
      {showImageSourceDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {currentImageTarget === 'background' ? 'Select Background Image' : 'Import Image'}
            </h2>
            
            {error && (
              <div className="bg-red-500 text-white p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {/* Options */}
            <div className="mb-4">
              <div className="flex flex-col gap-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="imageSource"
                    value="upload"
                    checked={imageSourceType === 'upload'}
                    onChange={(e) => setImageSourceType(e.target.value as 'upload' | 'generate')}
                    className="mr-2"
                  />
                  Load from computer
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="imageSource"
                    value="generate"
                    checked={imageSourceType === 'generate'}
                    onChange={(e) => setImageSourceType(e.target.value as 'upload' | 'generate')}
                    className="mr-2"
                  />
                  Generate image
                </label>
              </div>
            </div>
            
            {/* Text input for generation */}
            <div className="mb-4">
              <input
                type="text"
                value={generatePrompt}
                onChange={(e) => setGeneratePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                disabled={imageSourceType === 'upload'}
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={closeImageSourceDialog}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                disabled={isGenerating}
              >
                Cancel
              </button>
              
              <div className="flex gap-2">
                {imageSourceType === 'upload' && (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="dialog-file-upload"
                    />
                    <label
                      htmlFor="dialog-file-upload"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded cursor-pointer"
                    >
                      Choose File
                    </label>
                  </>
                )}
                
                {imageSourceType === 'generate' && (
                  <button
                    onClick={handleImageGeneration}
                    disabled={isGenerating || !generatePrompt.trim()}
                    className={`px-4 py-2 rounded flex items-center ${
                      generatePrompt.trim() && !isGenerating 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
