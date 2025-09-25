'use client';

import React, { useState, useRef, useCallback } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onClose: () => void;
}

const ImageEditor = ({ imageUrl, onSave, onClose }: ImageEditorProps) => {
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [snapRotate, setSnapRotate] = useState(true);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [outputSize, setOutputSize] = useState<number>(512);
  const [showGrid, setShowGrid] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  console.log('ImageEditor - imageUrl:', imageUrl);
  console.log('ImageEditor - imageUrl type:', typeof imageUrl);
  console.log('ImageEditor - imageUrl length:', imageUrl?.length);
  console.log('ImageEditor - imageLoaded:', imageLoaded);
  console.log('ImageEditor - imageError:', imageError);

  const updatePreview = useCallback(() => {
    if (!previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return;
    }

    // Set canvas size based on selected aspect ratio and output size
    const computeCanvasSize = () => {
      if (aspectRatio === 'free') {
        return { w: 256, h: 192 };
      }
      const [w, h] = aspectRatio.split(':').map(Number);
      const baseW = outputSize;
      const baseH = Math.round((outputSize * h) / w);
      return { w: baseW, h: baseH };
    };
    const { w: canvasW, h: canvasH } = computeCanvasSize();
    canvas.width = canvasW;
    canvas.height = canvasH;

    ctx.imageSmoothingQuality = 'high';
    ctx.save();

    // Apply filters
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
    ctx.filter = filterString;

    // Calculate crop area in pixels
    const cropX = (crop.x / 100) * image.naturalWidth;
    const cropY = (crop.y / 100) * image.naturalHeight;
    const cropWidth = (crop.width / 100) * image.naturalWidth;
    const cropHeight = (crop.height / 100) * image.naturalHeight;

    // If no crop is selected, use full image
    const sourceX = crop.width > 0 ? cropX : 0;
    const sourceY = crop.height > 0 ? cropY : 0;
    const sourceWidth = crop.width > 0 ? cropWidth : image.naturalWidth;
    const sourceHeight = crop.height > 0 ? cropHeight : image.naturalHeight;

    // Calculate destination size to fit canvas while maintaining aspect ratio
    const canvasAspect = canvas.width / canvas.height;
    const imageAspect = sourceWidth / sourceHeight;

    let destWidth, destHeight, destX, destY;

    if (imageAspect > canvasAspect) {
      // Image is wider than canvas
      destWidth = canvas.width;
      destHeight = canvas.width / imageAspect;
      destX = 0;
      destY = (canvas.height - destHeight) / 2;
    } else {
      // Image is taller than canvas
      destHeight = canvas.height;
      destWidth = canvas.height * imageAspect;
      destX = (canvas.width - destWidth) / 2;
      destY = 0;
    }

    // Apply transformations
    const centerX = destX + destWidth / 2;
    const centerY = destY + destHeight / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale * (flipH ? -1 : 1), scale * (flipV ? -1 : 1));

    // Draw the cropped image
    ctx.drawImage(
      image,
      sourceX, sourceY, sourceWidth, sourceHeight, // Source crop area
      -destWidth / 2, -destHeight / 2, destWidth, destHeight // Destination
    );

    ctx.restore();
  }, [scale, rotate, flipH, flipV, brightness, contrast, saturation, hue, crop, aspectRatio, outputSize]);

  const onImageLoad = useCallback(() => {
    console.log('Image loaded successfully');
    setImageLoaded(true);
    setImageError(false);
    // Use setTimeout to ensure the image is fully rendered before updating preview
    setTimeout(() => {
      updatePreview();
    }, 100);
  }, [updatePreview]);

  const onImageError = useCallback(() => {
    console.error('Image failed to load:', imageUrl);
    setImageError(true);
    setImageLoaded(false);
  }, [imageUrl]);

  const onSaveClick = useCallback(() => {
    if (!previewCanvasRef.current || !imgRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const editedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(editedImageUrl);
  }, [onSave]);

  // Crop selection handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !imgRef.current) return;
    
    const imgRect = imgRef.current.getBoundingClientRect();
    
    // Calculate relative position within the image
    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
    
    // Ensure coordinates are within image bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    setIsDragging(true);
    setDragStart({ x: clampedX, y: clampedY });
    setCrop({ x: clampedX, y: clampedY, width: 0, height: 0 });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imgRef.current) return;
    
    const imgRect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - imgRect.left) / imgRect.width) * 100;
    const y = ((e.clientY - imgRect.top) / imgRect.height) * 100;
    
    // Ensure coordinates are within image bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    let width = Math.abs(clampedX - dragStart.x);
    let height = Math.abs(clampedY - dragStart.y);
    let cropX = Math.min(clampedX, dragStart.x);
    let cropY = Math.min(clampedY, dragStart.y);
    
    // Apply aspect ratio constraint if set
    if (aspectRatio !== 'free') {
      const [w, h] = aspectRatio.split(':').map(Number);
      const targetAspect = w / h;
      
      // Calculate which dimension to constrain based on mouse movement
      const deltaX = Math.abs(clampedX - dragStart.x);
      const deltaY = Math.abs(clampedY - dragStart.y);
      
      if (deltaX > deltaY) {
        // Constrain by width
        height = width / targetAspect;
      } else {
        // Constrain by height
        width = height * targetAspect;
      }
      
      // Recalculate position to maintain aspect ratio
      if (clampedX < dragStart.x) {
        cropX = dragStart.x - width;
      }
      if (clampedY < dragStart.y) {
        cropY = dragStart.y - height;
      }
      
      // Ensure crop stays within bounds
      if (cropX < 0) {
        cropX = 0;
        width = dragStart.x;
        height = width / targetAspect;
      }
      if (cropY < 0) {
        cropY = 0;
        height = dragStart.y;
        width = height * targetAspect;
      }
      if (cropX + width > 100) {
        width = 100 - cropX;
        height = width / targetAspect;
      }
      if (cropY + height > 100) {
        height = 100 - cropY;
        width = height * targetAspect;
      }
    }
    
    setCrop({ x: cropX, y: cropY, width, height });
  }, [isDragging, dragStart, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset crop to full image
  const resetCrop = useCallback(() => {
    setCrop({ x: 0, y: 0, width: 100, height: 100 });
  }, []);

  // Apply aspect ratio to crop
  const applyAspectRatio = useCallback((ratio: string) => {
    console.log('Applying aspect ratio:', ratio);
    setAspectRatio(ratio);
    
    if (ratio === 'free') {
      console.log('Free aspect ratio selected');
      return;
    }
    
    const [w, h] = ratio.split(':').map(Number);
    const targetAspect = w / h;
    console.log('Target aspect ratio:', targetAspect);
    
    // Always create a new centered crop with the aspect ratio
    const cropSize = 80; // 80% of image
    let cropWidth, cropHeight;
    
    if (targetAspect >= 1) {
      // Landscape or square
      cropWidth = cropSize;
      cropHeight = cropSize / targetAspect;
    } else {
      // Portrait
      cropHeight = cropSize;
      cropWidth = cropSize * targetAspect;
    }
    
    // Center the crop
    const x = (100 - cropWidth) / 2;
    const y = (100 - cropHeight) / 2;
    
    const newCrop = { 
      x: Math.max(0, x), 
      y: Math.max(0, y), 
      width: Math.min(100, cropWidth), 
      height: Math.min(100, cropHeight) 
    };
    
    console.log('Setting new crop:', newCrop);
    setCrop(newCrop);
  }, []);

  // Auto-set image as loaded if it's a blob URL (already loaded data)
  React.useEffect(() => {
    if (imageUrl && imageUrl.startsWith('blob:')) {
      console.log('Blob URL detected, setting image as loaded');
      setImageLoaded(true);
      setImageError(false);
    }
  }, [imageUrl]);

  // Fallback: if image is still not loaded after 2 seconds, force it to loaded state
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoaded && !imageError && imageUrl) {
        console.log('Fallback: forcing image to loaded state');
        setImageLoaded(true);
        setImageError(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [imageLoaded, imageError, imageUrl]);

  // Update preview when any relevant setting changes
  React.useEffect(() => {
    if (imageLoaded) {
      updatePreview();
    }
  }, [imageLoaded, scale, rotate, brightness, contrast, saturation, hue, crop, flipH, flipV, aspectRatio, outputSize, updatePreview]);

  // Keyboard nudge for crop
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!imageLoaded) return;
    const step = e.shiftKey ? 5 : 1;
    if (e.key === 'ArrowLeft') {
      setCrop(c => ({ ...c, x: Math.max(0, c.x - step) }));
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setCrop(c => ({ ...c, x: Math.min(100 - c.width, c.x + step) }));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setCrop(c => ({ ...c, y: Math.max(0, c.y - step) }));
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setCrop(c => ({ ...c, y: Math.min(100 - c.height, c.y + step) }));
      e.preventDefault();
    }
  }, [imageLoaded]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Product Image
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close image editor"
            title="Close"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <div className="space-y-6">
            {/* Crop Controls */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Crop & Aspect Ratio</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Click and drag on the image to select crop area. Choose aspect ratio for consistent thumbnails.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Aspect Ratio
                  </label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => applyAspectRatio(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    aria-label="Select aspect ratio"
                  >
                    <option value="free">Free</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="16:9">Landscape (16:9)</option>
                    <option value="4:3">Standard (4:3)</option>
                    <option value="3:4">Portrait (3:4)</option>
                    <option value="2:3">Portrait (2:3)</option>
                    <option value="3:2">Landscape (3:2)</option>
                  </select>
                  {aspectRatio !== 'free' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Output Size</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={outputSize}
                          onChange={(e) => setOutputSize(Number(e.target.value))}
                          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          aria-label="Select output size"
                        >
                          <option value={256}>Small</option>
                          <option value={512}>Medium</option>
                          <option value={768}>Large</option>
                          <option value={1024}>XL</option>
                        </select>
                        <span className="text-xs text-gray-500">Width; height adjusts to ratio</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={resetCrop}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    aria-label="Reset crop to full image"
                    title="Reset crop to full image"
                  >
                    Reset Crop
                  </button>
                  <button
                    onClick={() => {
                      if (aspectRatio === 'free') {
                        // For free aspect ratio, create a square crop
                        const cropSize = 80;
                        const x = (100 - cropSize) / 2;
                        const y = (100 - cropSize) / 2;
                        setCrop({ 
                          x: Math.max(0, x), 
                          y: Math.max(0, y), 
                          width: Math.min(100, cropSize), 
                          height: Math.min(100, cropSize) 
                        });
                      } else {
                        // Apply the current aspect ratio
                        applyAspectRatio(aspectRatio);
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    aria-label="Center crop with current aspect ratio"
                    title="Center crop with current aspect ratio"
                  >
                    Center Crop
                  </button>
                  <button
                    onClick={() => setShowGrid(v => !v)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Toggle rule-of-thirds grid"
                  >
                    {showGrid ? 'Hide Grid' : 'Show Grid'}
                  </button>
                </div>
              </div>
            </div>

            {/* Transform Controls */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transform</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Scale: {Math.round(scale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(Number(e.target.value))}
                    className="w-full"
                    aria-label="Image scale"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button className="px-2 py-1 border rounded" onClick={() => setScale(s => Math.max(0.5, +(s - 0.05).toFixed(2)))} aria-label="Zoom out">−</button>
                    <input
                      type="number"
                      min={0.5}
                      max={2}
                      step={0.01}
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-24 border rounded px-2 py-1 bg-white dark:bg-gray-700"
                      aria-label="Scale percent"
                    />
                    <button className="px-2 py-1 border rounded" onClick={() => setScale(s => Math.min(2, +(s + 0.05).toFixed(2)))} aria-label="Zoom in">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rotate: {rotate}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={rotate}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (snapRotate) {
                        const snapped = Math.round(val / 5) * 5; // snap every 5°
                        setRotate(snapped);
                      } else {
                        setRotate(val);
                      }
                    }}
                    className="w-full"
                    aria-label="Image rotation"
                  />
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <button className="px-3 py-1 border rounded" onClick={() => setRotate(r => r - 90)} aria-label="Rotate counterclockwise 90 degrees">⟲ 90°</button>
                    <button className="px-3 py-1 border rounded" onClick={() => setRotate(r => r + 90)} aria-label="Rotate clockwise 90 degrees">⟳ 90°</button>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={snapRotate} onChange={(e) => setSnapRotate(e.target.checked)} />
                      Snap 5°
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={flipH} onChange={(e) => setFlipH(e.target.checked)} aria-label="Flip horizontally" />
                      Flip H
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={flipV} onChange={(e) => setFlipV(e.target.checked)} aria-label="Flip vertically" />
                      Flip V
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Adjustments */}
            <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Color Adjustments</h3>
              
              {/* Preset Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setBrightness(100);
                      setContrast(100);
                      setSaturation(100);
                      setHue(0);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Reset to original colors"
                  >
                    Original
                  </button>
                  <button
                    onClick={() => {
                      setBrightness(110);
                      setContrast(110);
                      setSaturation(120);
                      setHue(0);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Apply vibrant color enhancement"
                  >
                    Vibrant
                  </button>
                  <button
                    onClick={() => {
                      setBrightness(90);
                      setContrast(120);
                      setSaturation(80);
                      setHue(0);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Vintage
                  </button>
                  <button
                    onClick={() => {
                      setBrightness(120);
                      setContrast(90);
                      setSaturation(60);
                      setHue(0);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Soft
                  </button>
                  <button
                    onClick={() => {
                      setBrightness(80);
                      setContrast(130);
                      setSaturation(140);
                      setHue(0);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Dramatic
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Brightness: {brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full"
                    aria-label="Image brightness"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contrast: {contrast}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full"
                    aria-label="Image contrast"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Saturation: {saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full"
                    aria-label="Image saturation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hue: {hue}°
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="1"
                    value={hue}
                    onChange={(e) => setHue(Number(e.target.value))}
                    className="w-full"
                    aria-label="Image hue"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image Editor */}
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                {imageError ? (
                  <div className="p-8 text-center">
                    <p className="text-red-600 dark:text-red-400 mb-2">Failed to load image</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">URL: {imageUrl}</p>
                    <button
                      onClick={() => {
                        setImageError(false);
                        setImageLoaded(false);
                        if (imgRef.current) {
                          imgRef.current.src = imageUrl;
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      aria-label="Retry loading image"
                    >
                      Retry
                    </button>
                  </div>
                ) : !imageLoaded ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading image...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">URL: {imageUrl}</p>
                  </div>
                ) : (
                  <div className="p-4 flex justify-center">
                    <div 
                      ref={containerRef}
                      className="relative inline-block cursor-crosshair"
                      tabIndex={0}
                      onKeyDown={handleKeyDown}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <img
                        ref={imgRef}
                        alt="Product image"
                        src={imageUrl}
                        onLoad={onImageLoad}
                        onError={onImageError}
                        className="max-w-full max-h-96 object-contain transition-transform duration-200"
                        // Intentionally avoid CSS transforms/filters here so crop overlay aligns
                      />
                      
                      {/* Crop Overlay */}
                      {crop.width > 0 && crop.height > 0 && (
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none"
                          style={{
                            left: `${crop.x}%`,
                            top: `${crop.y}%`,
                            width: `${crop.width}%`,
                            height: `${crop.height}%`,
                          }}
                        >
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
                          {showGrid && (
                            <>
                              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                <div className="border-r border-b border-blue-400/50"></div>
                                <div className="border-r border-b border-blue-400/50"></div>
                                <div className="border-b border-blue-400/50"></div>
                                <div className="border-r border-b border-blue-400/50"></div>
                                <div className="border-r border-b border-blue-400/50"></div>
                                <div className="border-b border-blue-400/50"></div>
                                <div className="border-r border-blue-400/50"></div>
                                <div className="border-r border-blue-400/50"></div>
                                <div></div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="lg:w-64">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                Preview
              </h3>
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-48 object-cover"
                  aria-label="Image preview"
                />
                {aspectRatio !== 'free' && (
                  <div className="p-2 text-xs text-gray-500">Output: {outputSize}px × {Math.round(outputSize * (aspectRatio.split(':').map(Number)[1] / aspectRatio.split(':').map(Number)[0]))}px</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSaveClick}
              disabled={!imageLoaded}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <CheckIcon className="w-4 h-4" />
              <span>Apply Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
