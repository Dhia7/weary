'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import TShirt3D, { exportTShirtAsPNG, exportTShirtAsPNGBlob } from '@/components/TShirt3D';
import { useOrderNotification } from '@/lib/contexts/OrderNotificationContext';
import { 
  Upload, 
  Type, 
  Trash2, 
  Download, 
  Palette,
  X,
  Save,
  RotateCw,
  User,
  MapPin,
  Mail,
  Shirt
} from 'lucide-react';

interface DesignElement {
  id: string;
  type: 'text' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  rotation?: number;
}

// Helper function to determine text color based on background brightness
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate brightness using relative luminance formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return black for light colors, white for dark colors
  return brightness > 128 ? '#000000' : '#FFFFFF';
}

export default function DesignerPage() {
  const { showPersonalizedTShirtOrderSuccess, showError } = useOrderNotification();
  const [tshirtColor, setTshirtColor] = useState('#FFFFFF');
  const [elements, setElements] = useState<DesignElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [showTextModal, setShowTextModal] = useState(false);
  const [newText, setNewText] = useState('');
  const [newTextColor, setNewTextColor] = useState('#000000');
  const [newTextSize, setNewTextSize] = useState(24);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState('/models/shirt_baked.glb');
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    phoneAlt: '',
    email: '',
  });
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [orderNotes, setOrderNotes] = useState('');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<Array<{ path: string; name: string }>>([
    { path: '/models/shirt_baked.glb', name: 'Short Sleeve T-Shirt' }
  ]);
  const [modelsLoading, setModelsLoading] = useState(true);

  const tshirtColors = [
    '#FFFFFF', '#000000', '#FF0000', '#0000FF', '#00FF00',
    '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#FFA500'
  ];

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const response = await fetch('/api/models');
        const data = await response.json();
        
        if (data.success && data.data?.models && data.data.models.length > 0) {
          setAvailableModels(data.data.models);
          // Set the first model as default if current selection is not available
          setSelectedModel(prevModel => {
            const currentModelExists = data.data.models.some((m: { path: string }) => m.path === prevModel);
            return currentModelExists ? prevModel : data.data.models[0].path;
          });
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        // Keep default models on error
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        e.target.value = ''; // Reset input
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB.');
        e.target.value = ''; // Reset input
        return;
      }
      
      const reader = new FileReader();
      
      reader.onerror = () => {
        alert('Error reading image file. Please try again.');
        e.target.value = ''; // Reset input
      };
      
      reader.onload = (event) => {
        if (!event.target?.result) {
          alert('Failed to load image. Please try again.');
          e.target.value = ''; // Reset input
          return;
        }
        
        const imageResult = event.target.result as string;
        
        const img = new Image();
        
        img.onerror = () => {
          alert('Invalid image file. Please try a different image.');
          e.target.value = ''; // Reset input
        };
        
        img.onload = () => {
          try {
            const aspectRatio = img.width / img.height;
            
            // Use same sizing and positioning for all shirt types
            // This ensures consistent behavior across all models
            const maxWidth = 200;
            const maxHeight = 200;
            
            let width = maxWidth;
            let height = maxHeight;
            
            // Maintain aspect ratio
            if (aspectRatio > 1) {
              // Landscape: fit to width
              height = maxWidth / aspectRatio;
              if (height > maxHeight) {
                height = maxHeight;
                width = maxHeight * aspectRatio;
              }
            } else {
              // Portrait: fit to height
              width = maxHeight * aspectRatio;
              if (width > maxWidth) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
              }
            }

            // Use same positioning for all shirt types (centered on chest area)
            const x = 50;
            const y = 150;

            const newElement: DesignElement = {
              id: Date.now().toString(),
              type: 'image',
              content: imageResult,
              x: x,
              y: y,
              width: width,
              height: height,
              rotation: 0, // Initialize rotation
            };
            
            setElements(prevElements => [...prevElements, newElement]);
            
            // Reset input to allow uploading the same file again
            e.target.value = '';
          } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try again.');
            e.target.value = ''; // Reset input
          }
        };
        
        img.src = event.target.result as string;
      };
      
      reader.readAsDataURL(file);
    } else {
      // Reset input if no file selected
      e.target.value = '';
    }
  };

  const handleAddText = () => {
    if (newText.trim()) {
      const newElement: DesignElement = {
        id: Date.now().toString(),
        type: 'text',
        content: newText,
        x: 150,
        y: 200,
        width: 200,
        height: 50,
        fontSize: newTextSize,
        fontFamily: 'Arial',
        color: newTextColor,
        rotation: 0, // Initialize rotation
      };
      setElements([...elements, newElement]);
      setNewText('');
      setShowTextModal(false);
    }
  };

  const handleElementMove = (elementId: string, x: number, y: number) => {
    setElements(elements.map(el => 
      el.id === elementId 
        ? { ...el, x: Math.max(0, Math.min(x, 500 - el.width)), y: Math.max(0, Math.min(y, 600 - el.height)) }
        : el
    ));
  };

  const handleElementRotate = (elementId: string, rotation: number) => {
    setElements(elements.map(el =>
      el.id === elementId ? { ...el, rotation } : el
    ));
  };

  const handleDelete = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  const handleExport = async () => {
    try {
      await exportTShirtAsPNG(tshirtColor, elements, selectedModel);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export design. Please try again.');
    }
  };

  const handleSaveAndOrder = async () => {
    // Always show modal to collect information (even for logged-in users, in case they want different shipping address)
    setShowOrderModal(true);
    setOrderError(null);
  };

  const validateOrderForm = (): boolean => {
    if (!billing.firstName || !billing.lastName || !billing.phone || !billing.email) {
      setOrderError('Please fill in all required billing information (First Name, Last Name, Phone, Email).');
      return false;
    }
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      setOrderError('Please fill in all required shipping address fields.');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(billing.email)) {
      setOrderError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const submitOrder = async () => {
    if (!validateOrderForm()) {
      return;
    }

    try {
      setOrderError(null);
      
      // Export the design as PNG blob using the 3D renderer
      const designBlob = await exportTShirtAsPNGBlob(tshirtColor, elements, selectedModel);

      // Create FormData and send to backend
      const formData = new FormData();
      formData.append('design', designBlob, 'personalized-tshirt-design.png');
      formData.append('tshirtColor', tshirtColor);
      formData.append('shippingAddress', JSON.stringify(shippingAddress));
      formData.append('billingInfo', JSON.stringify(billing));
      if (orderNotes.trim()) {
        formData.append('notes', orderNotes.trim());
      }
      
      // Get API base URL - use /api for client-side (Next.js rewrites)
      const API_BASE_URL = typeof window !== 'undefined' 
        ? '/api' 
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');
      
      // Get auth token if user is logged in
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/products/personalized-tshirt-order`, {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || 'Failed to submit order. Please try again.';
        setOrderError(errorMsg);
        showError(errorMsg);
        return;
      }

      // Success!
      setShowOrderModal(false);
      setOrderError(null);
      // Reset form
      setBilling({
        firstName: '',
        lastName: '',
        phone: '',
        phoneAlt: '',
        email: '',
      });
      setShippingAddress({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
      });
      setOrderNotes('');
      
      // Show success notification
      showPersonalizedTShirtOrderSuccess();
      
      // Optionally redirect or reset the design
      // router.push('/products');
    } catch (error) {
      console.error('Error saving and ordering:', error);
      const errorMsg = 'Failed to submit order. Please try again.';
      setOrderError(errorMsg);
      showError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Design Your T-Shirt
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create your custom t-shirt design. Upload images, add text, and personalize it your way!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Design Canvas */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="relative mx-auto" style={{ width: '100%', height: '600px' }}>
                {elements.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 z-10 pointer-events-none">
                    <div className="text-center bg-white/80 dark:bg-gray-800/80 px-6 py-4 rounded-lg">
                      <p className="text-lg mb-2 font-semibold">Start Designing!</p>
                      <p className="text-sm">Upload an image or add text to begin</p>
                      <p className="text-xs mt-2 text-gray-500">Drag to rotate • Scroll to zoom</p>
                    </div>
                  </div>
                )}
                <TShirt3D
                  tshirtColor={tshirtColor}
                  elements={elements}
                  selectedElement={selectedElement}
                  onElementClick={setSelectedElement}
                  onElementMove={handleElementMove}
                  onElementRotate={handleElementRotate}
                  modelPath={selectedModel}
                />
              </div>
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                <p className="flex items-center justify-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Drag to rotate • Scroll to zoom • Click elements to select
                </p>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 sticky top-20">
              {/* Shirt Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Shirt className="w-4 h-4 mr-1" />
                  Shirt Style
                  {modelsLoading && (
                    <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                  )}
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={modelsLoading}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {availableModels.map(model => (
                    <option key={model.path} value={model.path}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* T-Shirt Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                  <Palette className="w-4 h-4 mr-1" />
                  T-Shirt Color
                </label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {tshirtColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setTshirtColor(color)}
                      className={`w-10 h-10 rounded border-2 transition-all ${
                        tshirtColor === color ? 'border-indigo-600 ring-2 ring-indigo-300 scale-110' : 'border-gray-300 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={tshirtColor}
                  onChange={(e) => setTshirtColor(e.target.value)}
                  className="w-full h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                />
              </div>

              {/* Add Elements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Elements
                </label>
                <div className="space-y-2">
                  <label 
                    htmlFor="image-upload-input"
                    className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Image
                    <input
                      id="image-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Upload image"
                    />
                  </label>
                  <button
                    onClick={() => setShowTextModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Type className="w-5 h-5 mr-2" />
                    Add Text
                  </button>
                </div>
              </div>

              {/* Text Elements List */}
              {elements.filter(el => el.type === 'text').length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Text Elements
                  </label>
                  <div className="space-y-2">
                    {elements.filter(el => el.type === 'text').map((element) => (
                      <div
                        key={element.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                            {element.content}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {element.fontSize || 24}px • {element.color || '#000000'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setElements(elements.filter(el => el.id !== element.id));
                            if (selectedElement === element.id) {
                              setSelectedElement(null);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 transition-colors p-1"
                          title="Delete text"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Images List */}
              {elements.filter(el => el.type === 'image').length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Uploaded Images
                  </label>
                  <div className="space-y-3">
                    {elements.filter(el => el.type === 'image').map((element) => (
                      <div
                        key={element.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={element.content}
                            alt="Uploaded"
                            className="w-12 h-12 object-cover rounded"
                            style={{
                              transform: `rotate(${element.rotation || 0}deg)`
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                              Image {element.id.slice(-4)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {element.width} × {element.height}px
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setElements(elements.filter(el => el.id !== element.id));
                              if (selectedElement === element.id) {
                                setSelectedElement(null);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 transition-colors p-1"
                            title="Delete image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Rotation Control */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-gray-600 dark:text-gray-400">
                              Rotation: {element.rotation || 0}°
                            </label>
                            <button
                              onClick={() => {
                                setElements(elements.map(el =>
                                  el.id === element.id
                                    ? { ...el, rotation: ((el.rotation || 0) + 90) % 360 }
                                    : el
                                ));
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                              title="Rotate 90°"
                            >
                              <RotateCw className="w-3 h-3 inline mr-1" />
                              Rotate
                            </button>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            step="1"
                            value={element.rotation || 0}
                            onChange={(e) => {
                              setElements(elements.map(el =>
                                el.id === element.id
                                  ? { ...el, rotation: parseInt(e.target.value) }
                                  : el
                              ));
                            }}
                            className="w-full"
                          />
                          
                          {/* Texture Scale Controls */}
                          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <label className="text-xs text-gray-600 dark:text-gray-400 block">
                              Texture Scale
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-500 block mb-1">
                                  Width: {element.width}px
                                </label>
                                <input
                                  type="range"
                                  min="50"
                                  max="500"
                                  step="10"
                                  value={element.width}
                                  onChange={(e) => {
                                    setElements(elements.map(el =>
                                      el.id === element.id
                                        ? { ...el, width: parseInt(e.target.value) }
                                        : el
                                    ));
                                  }}
                                  className="w-full"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 dark:text-gray-500 block mb-1">
                                  Height: {element.height}px
                                </label>
                                <input
                                  type="range"
                                  min="50"
                                  max="600"
                                  step="10"
                                  value={element.height}
                                  onChange={(e) => {
                                    setElements(elements.map(el =>
                                      el.id === element.id
                                        ? { ...el, height: parseInt(e.target.value) }
                                        : el
                                    ));
                                  }}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Element Controls */}
              {selectedElement && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected Element
                    </span>
                    <button
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Delete element"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {elements.find(el => el.id === selectedElement)?.type === 'text' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Text Content
                        </label>
                        <input
                          type="text"
                          value={elements.find(el => el.id === selectedElement)?.content || ''}
                          onChange={(e) => {
                            setElements(elements.map(el =>
                              el.id === selectedElement ? { ...el, content: e.target.value } : el
                            ));
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter text"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={elements.find(el => el.id === selectedElement)?.color || '#000000'}
                          onChange={(e) => {
                            setElements(elements.map(el =>
                              el.id === selectedElement ? { ...el, color: e.target.value } : el
                            ));
                          }}
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Font Size: {elements.find(el => el.id === selectedElement)?.fontSize || 24}px
                        </label>
                        <input
                          type="range"
                          min="12"
                          max="72"
                          value={elements.find(el => el.id === selectedElement)?.fontSize || 24}
                          onChange={(e) => {
                            setElements(elements.map(el =>
                              el.id === selectedElement ? { ...el, fontSize: parseInt(e.target.value) } : el
                            ));
                          }}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs text-gray-600 dark:text-gray-400">
                            Rotation: {elements.find(el => el.id === selectedElement)?.rotation || 0}°
                          </label>
                          <button
                            onClick={() => {
                              setElements(elements.map(el =>
                                el.id === selectedElement
                                  ? { ...el, rotation: ((el.rotation || 0) + 90) % 360 }
                                  : el
                              ));
                            }}
                            className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Rotate 90°"
                          >
                            <RotateCw className="w-3 h-3 inline mr-1" />
                            Rotate 90°
                          </button>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={elements.find(el => el.id === selectedElement)?.rotation || 0}
                          onChange={(e) => {
                            setElements(elements.map(el =>
                              el.id === selectedElement ? { ...el, rotation: parseInt(e.target.value) } : el
                            ));
                          }}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  {elements.find(el => el.id === selectedElement)?.type === 'image' && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Drag to reposition the image on the t-shirt
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <button
                  onClick={handleExport}
                  disabled={elements.length === 0}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-all shadow-md hover:shadow-lg ${
                    elements.length === 0 
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-50' 
                      : 'hover:opacity-90'
                  }`}
                  style={elements.length === 0 ? {} : {
                    backgroundColor: tshirtColor,
                    color: getContrastColor(tshirtColor),
                  }}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export Design
                </button>
                <button
                  onClick={handleSaveAndOrder}
                  disabled={elements.length === 0}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                    elements.length === 0 
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-50' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save & Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Information Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 shadow-xl my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Complete Your Personalized T-Shirt Order
              </h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setOrderError(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {orderError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{orderError}</p>
              </div>
            )}

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Billing Information */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Billing Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billing.firstName}
                      onChange={(e) => setBilling({...billing, firstName: e.target.value})}
                      placeholder="John"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billing.lastName}
                      onChange={(e) => setBilling({...billing, lastName: e.target.value})}
                      placeholder="Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={billing.phone}
                      onChange={(e) => setBilling({...billing, phone: e.target.value})}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Alternate Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={billing.phoneAlt}
                      onChange={(e) => setBilling({...billing, phoneAlt: e.target.value})}
                      placeholder="+1234567890"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={billing.email}
                      onChange={(e) => setBilling({...billing, email: e.target.value})}
                      placeholder="john.doe@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Shipping Address</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      placeholder="123 Main Street"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      placeholder="New York"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                      placeholder="NY"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP/Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, zipCode: e.target.value})}
                      placeholder="10001"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      placeholder="United States"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Notes (Optional)</h4>
                </div>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any special instructions or notes for your order..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setOrderError(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitOrder}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                <Save className="w-4 h-4 inline mr-2" />
                Submit Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Text
              </h3>
              <button
                onClick={() => setShowTextModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter your text"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={newTextColor}
                    onChange={(e) => setNewTextColor(e.target.value)}
                    className="w-full h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Size: {newTextSize}px
                  </label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={newTextSize}
                    onChange={(e) => setNewTextSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              <button
                onClick={handleAddText}
                disabled={!newText.trim()}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Add Text
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

