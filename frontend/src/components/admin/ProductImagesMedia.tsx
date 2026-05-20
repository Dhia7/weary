'use client';

import { useMemo } from 'react';
import type { VariantDraft } from '@/components/admin/VariantEditor';
import {
  applyImagesToColorVariants,
  getUniqueVariantColors,
  getVariantImagesForColor,
  imagesToUrlLines,
  parseImageUrlLines,
} from '@/lib/utils/productImages';
import { getImageUrl } from '@/lib/utils';

function colorHexForName(variants: VariantDraft[], colorName: string): string | undefined {
  const hex = variants.find(
    (v) => v.color.trim().toLowerCase() === colorName.trim().toLowerCase()
  )?.colorHex;
  return hex ?? undefined;
}

export interface ProductImagesMediaProps {
  imagePreviews: string[];
  mainThumbnailIndex: number;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onMoveImageUp: (index: number) => void;
  onMoveImageDown: (index: number) => void;
  onSetMainThumbnail: (index: number) => void;
  onEditImage?: (index: number) => void;
  uploadInputId?: string;
  videoPreview: string | null;
  onVideoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo?: () => void;
  videoSizeHint?: string;
  hasVariants: boolean;
  variants: VariantDraft[];
  onVariantsChange: (variants: VariantDraft[]) => void;
}

export default function ProductImagesMedia({
  imagePreviews,
  mainThumbnailIndex,
  onImageChange,
  onRemoveImage,
  onMoveImageUp,
  onMoveImageDown,
  onSetMainThumbnail,
  onEditImage,
  uploadInputId = 'image-upload',
  videoPreview,
  onVideoChange,
  onRemoveVideo,
  videoSizeHint = 'MP4, MOV up to 50MB',
  hasVariants,
  variants,
  onVariantsChange,
}: ProductImagesMediaProps) {
  const uniqueColors = useMemo(() => getUniqueVariantColors(variants), [variants]);

  const sharedGalleryHttpUrls = useMemo(
    () =>
      imagePreviews.filter(
        (url) => url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')
      ),
    [imagePreviews]
  );

  const updateColorImages = (colorName: string, imageUrls: string[]) => {
    onVariantsChange(applyImagesToColorVariants(variants, colorName, imageUrls));
  };

  const appendGalleryImageToColor = (colorName: string, url: string) => {
    const current = getVariantImagesForColor(variants, colorName);
    if (current.includes(url)) return;
    updateColorImages(colorName, [...current, url]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Images &amp; Media
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Upload a shared gallery for the product. When variants are enabled, assign images per color
        so the storefront gallery switches when shoppers pick a color.
      </p>

      {/* Shared product gallery */}
      <section className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          Shared product gallery
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Default images for the product and fallback when a color has no dedicated images.
        </p>

        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Product images
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="hidden"
            id={uploadInputId}
            multiple
          />
          <label htmlFor={uploadInputId} className="cursor-pointer">
            <div className="space-y-2">
              <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload images</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG up to 5MB each</p>
            </div>
          </label>
        </div>

        {imagePreviews.length > 0 && (
          <div className="space-y-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                  index === mainThumbnailIndex
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              >
                <div className="flex-shrink-0 relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-16 h-16 object-cover rounded"
                  />
                  {index === mainThumbnailIndex && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">★</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Image {index + 1}
                    {index === mainThumbnailIndex && (
                      <span className="ml-2 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                        Main thumbnail
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Order: {index + 1}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => onSetMainThumbnail(index)}
                    className={`p-1 text-xs rounded ${
                      index === mainThumbnailIndex
                        ? 'bg-indigo-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-800'
                    }`}
                    title="Set as main thumbnail"
                  >
                    ★
                  </button>
                  {onEditImage && (
                    <button
                      type="button"
                      onClick={() => onEditImage(index)}
                      className="p-1 text-indigo-400 hover:text-indigo-600"
                      title="Edit image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onMoveImageUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveImageDown(index)}
                    disabled={index === imagePreviews.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Per-color images */}
      {hasVariants && uniqueColors.length > 0 && (
        <section className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Images by color
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Shoppers see these images when they select a color. One URL per line, or pick from the
            shared gallery after images are uploaded and saved.
          </p>

          <div className="space-y-6">
            {uniqueColors.map((colorName) => {
              const colorImages = getVariantImagesForColor(variants, colorName);
              const hex = colorHexForName(variants, colorName);

              return (
                <div
                  key={colorName}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-gray-50/50 dark:bg-gray-900/30"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-500 shrink-0"
                      style={{ backgroundColor: hex || '#e5e7eb' }}
                      title={colorName}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100">{colorName}</span>
                  </div>

                  {colorImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {colorImages.map((url, i) => (
                        <img
                          key={`${url}-${i}`}
                          src={getImageUrl(url) || url}
                          alt={`${colorName} ${i + 1}`}
                          className="w-14 h-14 object-cover rounded border border-gray-200 dark:border-gray-600"
                        />
                      ))}
                    </div>
                  )}

                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Image URLs for {colorName}
                  </label>
                  <textarea
                    value={imagesToUrlLines(colorImages)}
                    onChange={(e) =>
                      updateColorImages(colorName, parseImageUrlLines(e.target.value))
                    }
                    rows={3}
                    placeholder="https://example.com/red-front.jpg&#10;https://example.com/red-back.jpg"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm font-mono bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />

                  {sharedGalleryHttpUrls.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Add from shared gallery:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sharedGalleryHttpUrls.map((url, i) => (
                          <button
                            key={`${url}-${i}`}
                            type="button"
                            onClick={() => appendGalleryImageToColor(colorName, url)}
                            className="w-12 h-12 rounded overflow-hidden border border-gray-300 dark:border-gray-600 hover:ring-2 hover:ring-indigo-500"
                            title="Add to this color"
                          >
                            <img
                              src={getImageUrl(url) || url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {colorImages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => updateColorImages(colorName, [])}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 dark:text-red-400"
                    >
                      Clear {colorName} images
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Video */}
      <section>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
          Product video
        </h3>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Optional video
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={onVideoChange}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            {videoPreview ? (
              <div className="space-y-2">
                <video
                  src={videoPreview}
                  className="w-full h-48 object-cover rounded-lg mx-auto"
                  controls
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">Click to change video</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload a video</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{videoSizeHint}</p>
              </div>
            )}
          </label>
          {videoPreview && onRemoveVideo && (
            <button
              type="button"
              onClick={onRemoveVideo}
              className="mt-2 px-3 py-1 text-sm text-red-600 hover:text-red-800"
            >
              Remove video
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
