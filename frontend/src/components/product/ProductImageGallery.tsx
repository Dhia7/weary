'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
} from '@heroicons/react/24/outline';
import { getImageUrl } from '@/lib/utils';

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

export interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  fallbackEmoji?: string;
  /** Shown above thumbnails when viewing a color-specific gallery */
  mediaLabel?: string;
  galleryKey?: string;
}

export default function ProductImageGallery({
  images,
  alt,
  fallbackEmoji = '👕',
  mediaLabel,
  galleryKey,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(MIN_ZOOM);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const resetZoom = useCallback(() => {
    setZoomLevel(MIN_ZOOM);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    setSelectedImageIndex(0);
    resetZoom();
  }, [galleryKey, images.join('|'), resetZoom]);

  useEffect(() => {
    if (selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  const calculatePanBounds = useCallback((zoom: number) => {
    if (!containerRef.current) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    const scaledWidth = containerWidth * zoom;
    const scaledHeight = containerHeight * zoom;
    const overflowX = (scaledWidth - containerWidth) / 2;
    const overflowY = (scaledHeight - containerHeight) / 2;

    return {
      minX: -overflowX,
      maxX: overflowX,
      minY: -overflowY,
      maxY: overflowY,
    };
  }, []);

  const constrainPan = useCallback(
    (x: number, y: number, zoom: number) => {
      const bounds = calculatePanBounds(zoom);
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
      };
    },
    [calculatePanBounds]
  );

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.min(prev + ZOOM_STEP, MAX_ZOOM);
      if (newZoom > prev) {
        setPanPosition((current) => constrainPan(current.x, current.y, newZoom));
      }
      return newZoom;
    });
  }, [constrainPan]);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      if (newZoom < prev) {
        setPanPosition((current) => constrainPan(current.x, current.y, newZoom));
        if (newZoom === MIN_ZOOM) {
          setPanPosition({ x: 0, y: 0 });
        }
      }
      return newZoom;
    });
  }, [constrainPan]);

  const handleZoomTo = useCallback(
    (newZoom: number) => {
      const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      setZoomLevel(clampedZoom);
      if (clampedZoom === MIN_ZOOM) {
        setPanPosition({ x: 0, y: 0 });
      } else {
        setPanPosition((current) => constrainPan(current.x, current.y, clampedZoom));
      }
    },
    [constrainPan]
  );

  const handleImageClick = (e: React.MouseEvent) => {
    if (zoomLevel === MIN_ZOOM && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newZoom = 2.5;
      setZoomLevel(newZoom);
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const panX = (centerX - x) * newZoom;
      const panY = (centerY - y) * newZoom;
      setPanPosition(constrainPan(panX, panY, newZoom));
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > MIN_ZOOM) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - panPosition.x,
        y: e.clientY - panPosition.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > MIN_ZOOM) {
      e.preventDefault();
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      setPanPosition(constrainPan(newX, newY, zoomLevel));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));

    if (newZoom !== zoomLevel) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const zoomPointX = (x - centerX) / zoomLevel;
      const zoomPointY = (y - centerY) / zoomLevel;
      const newPanX = panPosition.x - zoomPointX * (newZoom - zoomLevel);
      const newPanY = panPosition.y - zoomPointY * (newZoom - zoomLevel);
      setZoomLevel(newZoom);
      setPanPosition(constrainPan(newPanX, newPanY, newZoom));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          resetZoom();
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
          e.preventDefault();
          handleZoomOut();
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, resetZoom]);

  const displayImage = images.length > 0 ? images[selectedImageIndex] : undefined;

  return (
    <div className="space-y-4">
      {mediaLabel && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{mediaLabel}</p>
      )}

      <div className="relative">
        <div
          ref={containerRef}
          className={`aspect-square bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm relative group ${
            zoomLevel > MIN_ZOOM
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onClick={handleImageClick}
        >
          {displayImage ? (
            <Image
              src={getImageUrl(displayImage) || ''}
              alt={alt}
              fill
              className="object-cover transition-transform duration-200 ease-out select-none"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                transformOrigin: 'center center',
                pointerEvents: zoomLevel > MIN_ZOOM ? 'none' : 'auto',
              }}
              sizes="(max-width: 768px) 100vw, 50vw"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
              <span className="text-8xl">{fallbackEmoji}</span>
            </div>
          )}

          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className="bg-black/70 dark:bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
              {Math.round(zoomLevel * 100)}%
            </div>
            <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={zoomLevel >= MAX_ZOOM}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Zoom in"
                title="Zoom in"
              >
                <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="h-px bg-gray-200 dark:bg-gray-600" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={zoomLevel <= MIN_ZOOM}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Zoom out"
                title="Zoom out"
              >
                <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              {zoomLevel > MIN_ZOOM && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-gray-600" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetZoom();
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs text-gray-700 dark:text-gray-300 font-medium"
                    aria-label="Reset zoom"
                    title="Reset zoom"
                  >
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {zoomLevel === MIN_ZOOM && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/70 dark:bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm shadow-lg">
                Click to zoom • Scroll to zoom • Use controls
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 px-2">
          <div className="flex items-center gap-3">
            <MagnifyingGlassMinusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={ZOOM_STEP}
              value={zoomLevel}
              onChange={(e) => handleZoomTo(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
              aria-label="Zoom level"
            />
            <MagnifyingGlassPlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-right">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>

        {zoomLevel > MIN_ZOOM && (
          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Drag to pan • Scroll to zoom • Click Reset or press ESC to reset
          </p>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={selectedImageIndex === index ? 'true' : undefined}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                selectedImageIndex === index
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <Image
                src={getImageUrl(image) || ''}
                alt={`${alt} - Image ${index + 1}`}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
