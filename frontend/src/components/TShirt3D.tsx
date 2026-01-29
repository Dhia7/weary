'use client';

import React, { useRef, useMemo, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

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

interface TShirt3DProps {
  tshirtColor: string;
  elements: DesignElement[];
  selectedElement: string | null;
  onElementClick: (elementId: string | null) => void;
  onElementMove: (elementId: string, x: number, y: number) => void;
  onElementRotate?: (elementId: string, rotation: number) => void;
  exportRef?: React.RefObject<{ exportGLB: () => Promise<void> }>;
  modelPath?: string;
}

// Default T-shirt GLB model path
// Note: In Next.js, GLB files in public folder are accessed via absolute path
// cSpell:ignore tshirt
const DEFAULT_TSHIRT_MODEL_PATH = '/models/shirt_baked.glb';

// Helper function to create a canvas texture with text and images
function createDesignTexture(elements: DesignElement[], baseColor: string): Promise<THREE.CanvasTexture> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Fill with base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Load all images first, then draw everything
    const imagePromises = elements
      .filter(el => el.type === 'image')
      .map(element => {
        return new Promise<{ element: DesignElement; img: HTMLImageElement }>((resolveImg, rejectImg) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolveImg({ element, img });
          img.onerror = () => rejectImg(new Error(`Failed to load image: ${element.content}`));
          img.src = element.content;
        });
      });
    
    Promise.all(imagePromises)
      .then(loadedImages => {
        // Draw images
        loadedImages.forEach(({ element, img }) => {
          ctx.save();
          
          // Move to center of image
          const centerX = element.x + element.width / 2;
          const centerY = element.y + element.height / 2;
          ctx.translate(centerX, centerY);
          
          // Apply rotation
          if (element.rotation) {
            ctx.rotate((element.rotation * Math.PI) / 180);
          }
          
          // Draw image centered
          ctx.drawImage(
            img,
            -element.width / 2,
            -element.height / 2,
            element.width,
            element.height
          );
          
          ctx.restore();
        });
        
        // Draw text elements
        elements
          .filter(el => el.type === 'text' && el.content)
          .forEach(element => {
            ctx.save();
            
            // Set text properties
            const fontSize = element.fontSize || 24;
            ctx.font = `${fontSize}px Arial, sans-serif`;
            ctx.fillStyle = element.color || '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Move to text position
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            ctx.translate(centerX, centerY);
            
            // Apply rotation
            if (element.rotation) {
              ctx.rotate((element.rotation * Math.PI) / 180);
            }
            
            // Draw text
            ctx.fillText(element.content, 0, 0);
            
            ctx.restore();
          });
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.flipY = false;
        texture.needsUpdate = true;
        resolve(texture);
      })
      .catch(reject);
  });
}

// T-Shirt Mesh Component - Uses GLTF model with nodes and materials
function TShirtMesh({ color, onElementClick, elements = [], modelPath }: {
  color: string;
  onElementClick: (elementId: string | null) => void;
  elements?: DesignElement[];
  modelPath: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  // Import and load the GLB model using useGLTF hook
  // useGLTF caches models, so changing the path will load the new model
  const gltf = useGLTF(modelPath);
  const { scene, nodes } = gltf;
  
  // Debug: Log when model path changes
  useEffect(() => {
    console.log('TShirtMesh: Model path changed to:', modelPath);
    console.log('TShirtMesh: Scene available:', !!scene);
    console.log('TShirtMesh: Nodes available:', nodes ? Object.keys(nodes) : 'none');
    if (scene) {
      console.log('TShirtMesh: Scene children count:', scene.children.length);
    }
  }, [modelPath, scene, nodes]);
  
  // Check if there are any design elements (images or text)
  const hasDesignElements = elements && elements.length > 0;
  
  // Clone and prepare the scene
  const clonedScene = useMemo(() => {
    // Wait for scene or nodes to be available
    if (!scene && (!nodes || Object.keys(nodes).length === 0)) {
      console.warn('Scene and nodes are not available yet, model may still be loading...');
      return null;
    }
    
    if (!scene) {
      console.warn('Scene is null, trying nodes...');
      // Try using nodes if scene is not available
      if (nodes && Object.keys(nodes).length > 0) {
        const nodeKeys = Object.keys(nodes);
        console.log('Available nodes:', nodeKeys);
        
        // Try to create a group from all nodes
        const nodeGroup = new THREE.Group();
        Object.values(nodes).forEach((node) => {
          if (node instanceof THREE.Object3D) {
            nodeGroup.add(node.clone());
          }
        });
        
        if (nodeGroup.children.length > 0) {
          const cloned = nodeGroup;
          cloned.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
              materialsArray.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                  mat.color.set(color);
                  mat.roughness = 0.7;
                  mat.metalness = 0.1;
                }
              });
            }
          });
          
          // Calculate bounding box to center and scale
          const box = new THREE.Box3().setFromObject(cloned);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          cloned.position.x = -center.x;
          cloned.position.y = -center.y;
          cloned.position.z = -center.z;
          
          const maxSize = Math.max(size.x, size.y, size.z);
          const targetSize = 5;
          const scale = targetSize / maxSize;
          cloned.scale.set(scale, scale, scale);
          
          return cloned;
        }
        
        // Fallback: use first node
        const firstNode = Object.values(nodes)[0] as THREE.Object3D;
        if (firstNode) {
          const cloned = firstNode.clone();
          cloned.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
              materialsArray.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                  mat.color.set(color);
                  mat.roughness = 0.7;
                  mat.metalness = 0.1;
                }
              });
            }
          });
          
          // Calculate bounding box to center and scale
          const box = new THREE.Box3().setFromObject(cloned);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          
          cloned.position.x = -center.x;
          cloned.position.y = -center.y;
          cloned.position.z = -center.z;
          
          const maxSize = Math.max(size.x, size.y, size.z);
          const targetSize = 5;
          const scale = targetSize / maxSize;
          cloned.scale.set(scale, scale, scale);
          
          return cloned;
        }
      }
      return null;
    }
    
    try {
      console.log('Cloning scene, children count:', scene.children.length);
      const cloned = scene.clone();
      
      // Reset all transforms to ensure consistent starting point
      cloned.position.set(0, 0, 0);
      cloned.rotation.set(0, 0, 0);
      cloned.scale.set(1, 1, 1);
      
      // Calculate bounding box to center and scale the model
      const box = new THREE.Box3().setFromObject(cloned);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      console.log('Model bounding box:', {
        center: { x: center.x, y: center.y, z: center.z },
        size: { x: size.x, y: size.y, z: size.z },
        modelPath
      });
      
      // Center the model by moving it to origin
      cloned.position.x = -center.x;
      cloned.position.y = -center.y;
      cloned.position.z = -center.z;
      
      // Scale the model to fit nicely - make it larger so it's visible
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 5; // Increased target size for better visibility
      const scale = targetSize / maxSize;
      
      console.log('Scaling model by:', scale, 'Max size:', maxSize, 'Target size:', targetSize);
      cloned.scale.set(scale, scale, scale);
      
      // Recalculate bounding box after scaling to verify final position
      box.setFromObject(cloned);
      const newCenter = box.getCenter(new THREE.Vector3());
      const newSize = box.getSize(new THREE.Vector3());
      
      // Ensure the model is perfectly centered at origin after scaling
      // This accounts for any floating point precision issues
      const offsetX = -newCenter.x;
      const offsetY = -newCenter.y;
      const offsetZ = -newCenter.z;
      
      if (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001 || Math.abs(offsetZ) > 0.001) {
        cloned.position.x += offsetX;
        cloned.position.y += offsetY;
        cloned.position.z += offsetZ;
        console.log('Applied final centering offset:', { offsetX, offsetY, offsetZ });
      }
      
      console.log('After centering and scaling - Center:', newCenter, 'Size:', newSize);
      
      // Apply colored materials and textures to all meshes
      // Only apply color if no design elements are present
      const hasDesign = elements?.some(el => el.type === 'image' || el.type === 'text');
      
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
          materialsArray.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              // Only apply color if no design elements are present
              if (!hasDesign) {
                mat.color.set(color);
              } else {
                mat.color.set('#FFFFFF'); // White base for texture
              }
              mat.roughness = 0.7;
              mat.metalness = 0.1;
              
              // Texture will be applied via useEffect after loading
            }
          });
        }
      });
      
      console.log('Scene cloned successfully');
      return cloned;
    } catch (error) {
      console.error('Error cloning scene:', error);
      return null;
    }
  }, [scene, nodes, color, elements, modelPath]);

  // Apply design texture (images + text) to the shirt material
  useEffect(() => {
    if (!clonedScene) return;
    
    // If there are design elements, create a combined texture
    if (hasDesignElements && elements.length > 0) {
      createDesignTexture(elements, color)
        .then((texture) => {
          texture.flipY = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          // Collect all meshes first
          const meshes: Array<{ mesh: THREE.Mesh; size: number; centerZ: number; name: string }> = [];
          clonedScene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const box = new THREE.Box3().setFromObject(child);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              meshes.push({
                mesh: child,
                size: size.x * size.y * size.z,
                centerZ: center.z,
                name: child.name || ''
              });
            }
          });
          
          // Apply texture to meshes
          // Strategy: Apply to all meshes first to ensure visibility, then refine if needed
          
          if (meshes.length === 0) {
            console.warn('No meshes found in model');
            return;
          }
          
          // For single mesh models (short sleeve), apply to that mesh
          // For multiple mesh models (long sleeve), apply to all meshes to ensure visibility
          const targetMeshes = meshes.map(m => m.mesh);
          
          console.log('Applying texture to meshes:', {
            totalMeshes: meshes.length,
            meshNames: meshes.map(m => m.name || 'unnamed')
          });
          
          // Apply texture to all target meshes
          targetMeshes.forEach((mesh, index) => {
            if (mesh.material) {
              const materialsArray = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              materialsArray.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                  // Use the same texture instance for all meshes
                  mat.map = texture;
                  mat.color.set('#FFFFFF');
                  mat.needsUpdate = true;
                  console.log(`Applied texture to mesh ${index}:`, mesh.name || 'unnamed');
                }
              });
            }
          });
          
          // Note: We're applying to all meshes to ensure visibility
          // If duplication occurs, we can refine by identifying inner meshes later
        })
        .catch((error) => {
          console.error('Error creating design texture:', error);
        });
    } else {
      // If no design elements, restore the color and remove texture
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
          materialsArray.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
              mat.map = null;
              mat.color.set(color);
              mat.needsUpdate = true;
            }
          });
        }
      });
    }
  }, [clonedScene, elements, color, hasDesignElements, modelPath]);

  if (!clonedScene) {
    console.warn('clonedScene is null, model not loaded');
    return null;
  }

  console.log('Rendering TShirtMesh with cloned scene');

  return (
    <group
      ref={groupRef}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        // Only deselect if clicking directly on t-shirt (not through elements)
        // Elements are at z=1.0, so if event originated from t-shirt, it's safe to deselect
        e.stopPropagation();
        onElementClick(null);
      }}
      position={[0, 0, 0]}
      scale={[1, 1, 1]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Image Element Component
function ImageElement({ element, isSelected, onSelect, onMove, onRotate, onDragStart, onDragEnd }: {
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRotate?: (rotation: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationHandleRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Convert 2D coordinates to 3D position on t-shirt
  // Works for both short sleeve and long sleeve models (both scaled to ~5 units)
  const position = useMemo(() => {
    const x = ((element.x / 500) - 0.5) * 5;
    const y = 2.5 - (element.y / 600) * 5;
    return [x, y, 1.0] as [number, number, number]; // Increased z significantly to ensure elements are always clickable above t-shirt
  }, [element.x, element.y]);

  const size = useMemo(() => {
    const width = (element.width / 500) * 5;
    const height = (element.height / 600) * 5;
    return [width, height] as [number, number];
  }, [element.width, element.height]);

  const { raycaster, pointer, camera } = useThree();

  // Helper function to convert 3D intersection to 2D coordinates
  // Works for both short sleeve and long sleeve models
  const convert3DTo2D = useMemo(() => {
    return (intersection: THREE.Vector3) => {
      const x2D = ((intersection.x / 5) + 0.5) * 500;
      const y2D = ((2.5 - intersection.y) / 5) * 600;
      return { x: x2D, y: y2D };
    };
  }, []);

  useFrame(() => {
    if ((isDragging || isRotating) && meshRef.current) {
      raycaster.setFromCamera(pointer, camera);
      // Use a plane at the element's z-position for accurate dragging
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), position[2]);
      const intersection = new THREE.Vector3();
      const intersects = raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersects) {
        if (isRotating && dragStartPos && onRotate) {
          // Calculate rotation based on angle from center to mouse position
          const centerX = element.x + element.width / 2;
          const centerY = element.y + element.height / 2;
          
          const { x: x2D, y: y2D } = convert3DTo2D(intersection);
          
          // Calculate angle from center to current mouse position
          const dx = x2D - centerX;
          const dy = centerY - y2D; // Invert Y for canvas coordinates
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Normalize to 0-360
          const normalizedAngle = angle < 0 ? angle + 360 : angle;
          onRotate(normalizedAngle);
        } else if (isDragging && dragOffset) {
          // Apply drag offset for smooth, accurate positioning
          const { x: x2D, y: y2D } = convert3DTo2D(intersection);
          
          // Apply the offset to maintain relative position during drag
          const newX = x2D - dragOffset.x;
          const newY = y2D - dragOffset.y;
          
          // More flexible clamping - allow slight overflow for better UX
          const padding = 20; // Allow 20px overflow for easier positioning
          const clampedX = Math.max(-padding, Math.min(500 - element.width + padding, newX));
          const clampedY = Math.max(-padding, Math.min(600 - element.height + padding, newY));
          
          onMove(clampedX, clampedY);
        }
      }
    }
  });

  return (
    <group>
      {/* Visible interaction mesh - image is rendered on texture */}
      {/* Made larger for easier clicking - extends beyond visible area */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={(e) => {
          e.stopPropagation();
          
          // Calculate drag offset for smooth positioning
          // Use the raycaster from useThree hook (already available in component scope)
          raycaster.setFromCamera(pointer, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), position[2]);
          const intersection = new THREE.Vector3();
          const intersects = raycaster.ray.intersectPlane(plane, intersection);
          
          if (intersects) {
            const { x: x2D, y: y2D } = convert3DTo2D(intersection);
            // Store offset from element's top-left corner
            setDragOffset({
              x: x2D - element.x,
              y: y2D - element.y
            });
          }
          
          setIsDragging(true);
          onSelect();
          onDragStart?.();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          setIsDragging(false);
          setDragOffset(null);
          onDragEnd?.();
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setIsDragging(false);
          setIsHovered(false);
          setDragOffset(null);
          onDragEnd?.();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Larger geometry for easier clicking - 1.2x size for better clickability */}
        <planeGeometry args={[size[0] * 1.2, size[1] * 1.2]} />
        <meshBasicMaterial 
          color={isSelected ? "#f59e0b" : isHovered ? "#fbbf24" : "#fcd34d"}
          transparent 
          opacity={isSelected ? 0.35 : isHovered ? 0.25 : 0.2} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Background pattern for better visibility */}
      <mesh position={position}>
        <planeGeometry args={size} />
        <meshBasicMaterial 
          color="#fef3c7"
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Selection border - more prominent */}
      {isSelected && (
        <>
          {/* Outer border */}
          <mesh position={position}>
            <planeGeometry args={[size[0] + 0.15, size[1] + 0.15]} />
            <meshBasicMaterial 
              color="#f59e0b" 
              transparent 
              opacity={0.6} 
              side={THREE.DoubleSide}
              wireframe={true}
            />
          </mesh>
          
          {/* Inner border */}
          <mesh position={position}>
            <planeGeometry args={[size[0] + 0.05, size[1] + 0.05]} />
            <meshBasicMaterial 
              color="#f59e0b" 
              transparent 
              opacity={0.7} 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Rotation handle - positioned at top-right corner */}
          {/* White background circle for better visibility */}
          <mesh
            position={[
              position[0] + size[0] / 2 + 0.15,
              position[1] + size[1] / 2 + 0.15,
              position[2] + 0.01
            ]}
          >
            <circleGeometry args={[0.15, 16]} />
            <meshBasicMaterial 
              color="#ffffff" 
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            ref={rotationHandleRef}
            position={[
              position[0] + size[0] / 2 + 0.15,
              position[1] + size[1] / 2 + 0.15,
              position[2] + 0.02
            ]}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsRotating(true);
              setIsDragging(false);
              setDragOffset(null);
              onDragStart?.();
              
              // Store initial position for rotation calculation
              const centerX = element.x + element.width / 2;
              const centerY = element.y + element.height / 2;
              setDragStartPos({ x: centerX, y: centerY });
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              setIsRotating(false);
              setDragStartPos(null);
              onDragEnd?.();
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              setIsRotating(false);
              setDragStartPos(null);
              onDragEnd?.();
            }}
          >
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial 
              color="#f59e0b" 
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner circle for better visibility */}
          <mesh
            position={[
              position[0] + size[0] / 2 + 0.15,
              position[1] + size[1] / 2 + 0.15,
              position[2] + 0.03
            ]}
          >
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial 
              color="#ffffff" 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Corner handles for better visibility */}
          {[
            [size[0] / 2, size[1] / 2], // Top-right
            [-size[0] / 2, size[1] / 2], // Top-left
            [size[0] / 2, -size[1] / 2], // Bottom-right
            [-size[0] / 2, -size[1] / 2], // Bottom-left
          ].map(([offsetX, offsetY], idx) => (
            <mesh
              key={idx}
              position={[
                position[0] + offsetX,
                position[1] + offsetY,
                position[2] + 0.01
              ]}
            >
              <boxGeometry args={[0.08, 0.08, 0.01]} />
              <meshBasicMaterial 
                color="#f59e0b" 
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          
          {/* Drag indicator */}
          <mesh position={[position[0], position[1] - size[1] / 2 - 0.2, position[2] + 0.01]}>
            <planeGeometry args={[size[0] * 0.8, 0.15]} />
            <meshBasicMaterial 
              color="#d97706" 
              transparent 
              opacity={0.8} 
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
      
      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <mesh position={position}>
          <planeGeometry args={[size[0] + 0.05, size[1] + 0.05]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={0.25} 
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Text Element Component - Visible overlay for interaction
// Text is now rendered as part of the shirt texture, this is just for selection/movement
function TextElement({ element, isSelected, onSelect, onMove, onRotate, onDragStart, onDragEnd }: {
  element: DesignElement;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onRotate?: (rotation: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationHandleRef = useRef<THREE.Mesh>(null);

  // Convert 2D coordinates to 3D position on t-shirt
  // Works for both short sleeve and long sleeve models (both scaled to ~5 units)
  const position = useMemo(() => {
    const x = ((element.x / 500) - 0.5) * 5;
    const y = 2.5 - (element.y / 600) * 5;
    return [x, y, 1.0] as [number, number, number]; // Increased z significantly to ensure elements are always clickable above t-shirt
  }, [element.x, element.y]);

  // Calculate size - ensure minimum size for interaction
  const size = useMemo(() => {
    // Use element dimensions or calculate from font size
    const minWidth = 100; // Minimum width for text interaction
    const minHeight = 50; // Minimum height for text interaction
    const width = Math.max(minWidth, element.width || minWidth);
    const height = Math.max(minHeight, element.height || minHeight);
    
    // Convert to 3D space
    const width3D = (width / 500) * 5;
    const height3D = (height / 600) * 5;
    return [width3D, height3D] as [number, number];
  }, [element.width, element.height]);

  const { raycaster, pointer, camera } = useThree();

  // Helper function to convert 3D intersection to 2D coordinates
  // Works for both short sleeve and long sleeve models
  const convert3DTo2D = useMemo(() => {
    return (intersection: THREE.Vector3) => {
      const x2D = ((intersection.x / 5) + 0.5) * 500;
      const y2D = ((2.5 - intersection.y) / 5) * 600;
      return { x: x2D, y: y2D };
    };
  }, []);

  useFrame(() => {
    if ((isDragging || isRotating) && meshRef.current) {
      raycaster.setFromCamera(pointer, camera);
      // Use a plane at the element's z-position for accurate dragging
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), position[2]);
      const intersection = new THREE.Vector3();
      const intersects = raycaster.ray.intersectPlane(plane, intersection);
      
      if (intersects) {
        if (isRotating && dragStartPos && onRotate) {
          // Calculate rotation based on angle from center to mouse position
          const centerX = element.x + (element.width || 100) / 2;
          const centerY = element.y + (element.height || 50) / 2;
          
          const { x: x2D, y: y2D } = convert3DTo2D(intersection);
          
          // Calculate angle from center to current mouse position
          const dx = x2D - centerX;
          const dy = centerY - y2D; // Invert Y for canvas coordinates
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          
          // Normalize to 0-360
          const normalizedAngle = angle < 0 ? angle + 360 : angle;
          onRotate(normalizedAngle);
        } else if (isDragging && dragOffset) {
          // Apply drag offset for smooth, accurate positioning
          const { x: x2D, y: y2D } = convert3DTo2D(intersection);
          
          // Apply the offset to maintain relative position during drag
          const newX = x2D - dragOffset.x;
          const newY = y2D - dragOffset.y;
          
          // Get actual element dimensions for clamping
          const minWidth = 100;
          const minHeight = 50;
          const width = Math.max(minWidth, element.width || minWidth);
          const height = Math.max(minHeight, element.height || minHeight);
          
          // More flexible clamping - allow slight overflow for better UX
          const padding = 20; // Allow 20px overflow for easier positioning
          const clampedX = Math.max(-padding, Math.min(500 - width + padding, newX));
          const clampedY = Math.max(-padding, Math.min(600 - height + padding, newY));
          
          onMove(clampedX, clampedY);
        }
      }
    }
  });

  return (
    <group>
      {/* Visible mesh for interaction - text is rendered on texture */}
      {/* Made larger for easier clicking - extends beyond visible area */}
      <mesh
        ref={meshRef}
        position={position}
        onPointerDown={(e) => {
          e.stopPropagation();
          
          // Calculate drag offset for smooth positioning
          // Use the raycaster from useThree hook (already available in component scope)
          raycaster.setFromCamera(pointer, camera);
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), position[2]);
          const intersection = new THREE.Vector3();
          const intersects = raycaster.ray.intersectPlane(plane, intersection);
          
          if (intersects) {
            const { x: x2D, y: y2D } = convert3DTo2D(intersection);
            // Store offset from element's top-left corner
            setDragOffset({
              x: x2D - element.x,
              y: y2D - element.y
            });
          }
          
          setIsDragging(true);
          onSelect();
          onDragStart?.();
        }}
        onPointerUp={(e) => {
          e.stopPropagation();
          setIsDragging(false);
          setDragOffset(null);
          onDragEnd?.();
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setIsDragging(false);
          setIsHovered(false);
          setDragOffset(null);
          onDragEnd?.();
        }}
        onPointerEnter={() => {
          setIsHovered(true);
        }}
        onPointerMove={(e) => {
          if (isDragging) {
            e.stopPropagation();
          }
        }}
      >
        {/* Larger geometry for easier clicking - 1.2x size for better clickability */}
        <planeGeometry args={[size[0] * 1.2, size[1] * 1.2]} />
        <meshBasicMaterial 
          color={isSelected ? "#3b82f6" : isHovered ? "#60a5fa" : "#93c5fd"}
          transparent 
          opacity={isSelected ? 0.2 : isHovered ? 0.15 : 0.1} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {isSelected && (
        <>
          {/* Outer selection border */}
          <mesh position={position}>
            <planeGeometry args={[size[0] + 0.15, size[1] + 0.15]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              transparent 
              opacity={0.4} 
              side={THREE.DoubleSide}
              wireframe={true}
            />
          </mesh>
          
          {/* Inner selection border */}
          <mesh position={position}>
            <planeGeometry args={[size[0] + 0.05, size[1] + 0.05]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              transparent 
              opacity={0.5} 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Rotation handle - positioned at top-right corner */}
          <mesh
            ref={rotationHandleRef}
            position={[
              position[0] + size[0] / 2 + 0.15,
              position[1] + size[1] / 2 + 0.15,
              position[2] + 0.02
            ]}
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsRotating(true);
              setIsDragging(false);
              setDragOffset(null);
              onDragStart?.();
              
              // Store initial position for rotation calculation
              const centerX = element.x + (element.width || 100) / 2;
              const centerY = element.y + (element.height || 50) / 2;
              setDragStartPos({ x: centerX, y: centerY });
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              setIsRotating(false);
              setDragStartPos(null);
              onDragEnd?.();
            }}
            onPointerLeave={(e) => {
              e.stopPropagation();
              setIsRotating(false);
              setDragStartPos(null);
              onDragEnd?.();
            }}
          >
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner circle for better visibility */}
          <mesh
            position={[
              position[0] + size[0] / 2 + 0.15,
              position[1] + size[1] / 2 + 0.15,
              position[2] + 0.03
            ]}
          >
            <circleGeometry args={[0.07, 16]} />
            <meshBasicMaterial 
              color="#ffffff" 
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Corner handles for better visibility */}
          {[
            [size[0] / 2, size[1] / 2], // Top-right
            [-size[0] / 2, size[1] / 2], // Top-left
            [size[0] / 2, -size[1] / 2], // Bottom-right
            [-size[0] / 2, -size[1] / 2], // Bottom-left
          ].map(([offsetX, offsetY], idx) => (
            <mesh
              key={idx}
              position={[
                position[0] + offsetX,
                position[1] + offsetY,
                position[2] + 0.01
              ]}
            >
              <boxGeometry args={[0.08, 0.08, 0.01]} />
              <meshBasicMaterial 
                color="#3b82f6" 
                side={THREE.DoubleSide}
              />
            </mesh>
          ))}
          
          {/* Drag indicator */}
          <mesh position={[position[0], position[1] - size[1] / 2 - 0.2, position[2] + 0.01]}>
            <planeGeometry args={[size[0] * 0.8, 0.15]} />
            <meshBasicMaterial 
              color="#1e40af" 
              transparent 
              opacity={0.7} 
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
      
      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <mesh position={position}>
          <planeGeometry args={[size[0] + 0.05, size[1] + 0.05]} />
          <meshBasicMaterial 
            color="#60a5fa" 
            transparent 
            opacity={0.2} 
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// Dynamic model preloader hook
function usePreloadModels() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const preloadModels = async () => {
      try {
        const response = await fetch('/api/models');
        const data = await response.json();
        
        if (data.success && data.data?.models) {
          // Preload all discovered models
          data.data.models.forEach((model: { path: string }) => {
            try {
              useGLTF.preload(model.path);
            } catch (error) {
              console.warn(`Failed to preload model ${model.path}:`, error);
            }
          });
        }
      } catch (error) {
        console.warn('Failed to fetch models for preloading:', error);
        // Fallback: preload default models
        try {
          useGLTF.preload(DEFAULT_TSHIRT_MODEL_PATH);
          useGLTF.preload('/models/long_sleeve_t-_shirt.glb');
        } catch (preloadError) {
          console.warn('Failed to preload default models:', preloadError);
        }
      }
    };
    
    preloadModels();
  }, []);
}

// Preload default models immediately for better performance (fallback)
if (typeof window !== 'undefined') {
  try {
    useGLTF.preload(DEFAULT_TSHIRT_MODEL_PATH);
  } catch (error) {
    // Ignore preload errors
  }
}

// Export function to export the t-shirt design as GLB
export async function exportTShirtAsGLB(
  tshirtColor: string,
  elements: DesignElement[],
  modelPath: string = DEFAULT_TSHIRT_MODEL_PATH
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load the GLB model
      const loader = new GLTFLoader();
      const gltf = await new Promise<GLTF>((resolveLoader, rejectLoader) => {
        loader.load(
          modelPath,
          (gltf: GLTF) => resolveLoader(gltf),
          undefined,
          (error: unknown) => rejectLoader(error)
        );
      });

      const scene = gltf.scene.clone();
      
      // Reset all transforms to ensure consistent starting point
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      
      // Calculate bounding box to center and scale the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model
      scene.position.x = -center.x;
      scene.position.y = -center.y;
      scene.position.z = -center.z;
      
      // Scale the model
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 5;
      const scale = targetSize / maxSize;
      scene.scale.set(scale, scale, scale);
      
      // Recalculate and ensure perfect centering
      box.setFromObject(scene);
      const newCenter = box.getCenter(new THREE.Vector3());
      const offsetX = -newCenter.x;
      const offsetY = -newCenter.y;
      const offsetZ = -newCenter.z;
      
      if (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001 || Math.abs(offsetZ) > 0.001) {
        scene.position.x += offsetX;
        scene.position.y += offsetY;
        scene.position.z += offsetZ;
      }

      // Check if there are design elements
      const hasDesign = elements?.some(el => el.type === 'image' || el.type === 'text');

      // Apply color or texture
      if (hasDesign && elements.length > 0) {
        // Create design texture
        const texture = await createDesignTexture(elements, tshirtColor);
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Apply texture to all meshes
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.map = texture;
                mat.color.set('#FFFFFF');
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      } else {
        // Apply color only
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.color.set(tshirtColor);
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      }

      // Create a new scene for export
      const exportScene = new THREE.Scene();
      exportScene.add(scene);

      // Export as GLB
      const exporter = new GLTFExporter();
      exporter.parse(
        exportScene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            // Download the file
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'my-design.glb';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Export failed: Invalid result format'));
          }
        },
        (error) => {
          reject(error);
        },
        { binary: true }
      );
    } catch (error) {
      reject(error);
    }
  });
}

// Export function to export the t-shirt design as PNG blob (rendered from 3D model)
export async function exportTShirtAsPNGBlob(
  tshirtColor: string,
  elements: DesignElement[],
  modelPath: string = DEFAULT_TSHIRT_MODEL_PATH
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load the GLB model
      const loader = new GLTFLoader();
      const gltf = await new Promise<GLTF>((resolveLoader, rejectLoader) => {
        loader.load(
          modelPath,
          (gltf: GLTF) => resolveLoader(gltf),
          undefined,
          (error: unknown) => rejectLoader(error)
        );
      });

      const scene = gltf.scene.clone();
      
      // Reset all transforms to ensure consistent starting point
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      
      // Calculate bounding box to center and scale the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model
      scene.position.x = -center.x;
      scene.position.y = -center.y;
      scene.position.z = -center.z;
      
      // Scale the model
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 5;
      const scale = targetSize / maxSize;
      scene.scale.set(scale, scale, scale);
      
      // Recalculate and ensure perfect centering
      box.setFromObject(scene);
      const newCenter = box.getCenter(new THREE.Vector3());
      const offsetX = -newCenter.x;
      const offsetY = -newCenter.y;
      const offsetZ = -newCenter.z;
      
      if (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001 || Math.abs(offsetZ) > 0.001) {
        scene.position.x += offsetX;
        scene.position.y += offsetY;
        scene.position.z += offsetZ;
      }

      // Check if there are design elements
      const hasDesign = elements?.some(el => el.type === 'image' || el.type === 'text');

      // Apply color or texture
      if (hasDesign && elements.length > 0) {
        // Create design texture
        const texture = await createDesignTexture(elements, tshirtColor);
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Apply texture to all meshes
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.map = texture;
                mat.color.set('#FFFFFF');
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      } else {
        // Apply color only
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.color.set(tshirtColor);
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      }

      // Create a new scene for rendering
      const renderScene = new THREE.Scene();
      renderScene.add(scene);

      // Set up lights (matching the viewer)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight1.position.set(5, 5, 5);
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight2.position.set(-5, 3, -5);
      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      pointLight.position.set(0, 2, 5);

      renderScene.add(ambientLight);
      renderScene.add(directionalLight1);
      renderScene.add(directionalLight2);
      renderScene.add(pointLight);

      // Create camera (matching the viewer)
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);

      // Create renderer
      const renderWidth = 2000;
      const renderHeight = 2000;
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      renderer.setSize(renderWidth, renderHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Render the scene
      renderer.render(renderScene, camera);

      // Get the canvas and convert to PNG blob
      const canvas = renderer.domElement;
      canvas.toBlob((blob) => {
        renderer.dispose();
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

// Export function to export the t-shirt design as PNG (rendered from 3D model)
export async function exportTShirtAsPNG(
  tshirtColor: string,
  elements: DesignElement[],
  modelPath: string = DEFAULT_TSHIRT_MODEL_PATH
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Load the GLB model
      const loader = new GLTFLoader();
      const gltf = await new Promise<GLTF>((resolveLoader, rejectLoader) => {
        loader.load(
          modelPath,
          (gltf: GLTF) => resolveLoader(gltf),
          undefined,
          (error: unknown) => rejectLoader(error)
        );
      });

      const scene = gltf.scene.clone();
      
      // Reset all transforms to ensure consistent starting point
      scene.position.set(0, 0, 0);
      scene.rotation.set(0, 0, 0);
      scene.scale.set(1, 1, 1);
      
      // Calculate bounding box to center and scale the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      
      // Center the model
      scene.position.x = -center.x;
      scene.position.y = -center.y;
      scene.position.z = -center.z;
      
      // Scale the model
      const maxSize = Math.max(size.x, size.y, size.z);
      const targetSize = 5;
      const scale = targetSize / maxSize;
      scene.scale.set(scale, scale, scale);
      
      // Recalculate and ensure perfect centering
      box.setFromObject(scene);
      const newCenter = box.getCenter(new THREE.Vector3());
      const offsetX = -newCenter.x;
      const offsetY = -newCenter.y;
      const offsetZ = -newCenter.z;
      
      if (Math.abs(offsetX) > 0.001 || Math.abs(offsetY) > 0.001 || Math.abs(offsetZ) > 0.001) {
        scene.position.x += offsetX;
        scene.position.y += offsetY;
        scene.position.z += offsetZ;
      }

      // Check if there are design elements
      const hasDesign = elements?.some(el => el.type === 'image' || el.type === 'text');

      // Apply color or texture
      if (hasDesign && elements.length > 0) {
        // Create design texture
        const texture = await createDesignTexture(elements, tshirtColor);
        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Apply texture to all meshes
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.map = texture;
                mat.color.set('#FFFFFF');
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      } else {
        // Apply color only
        scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const materialsArray = Array.isArray(child.material) ? child.material : [child.material];
            materialsArray.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
                mat.color.set(tshirtColor);
                mat.roughness = 0.7;
                mat.metalness = 0.1;
                mat.needsUpdate = true;
              }
            });
          }
        });
      }

      // Create a new scene for rendering
      const renderScene = new THREE.Scene();
      renderScene.add(scene);

      // Set up lights (matching the viewer)
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight1.position.set(5, 5, 5);
      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
      directionalLight2.position.set(-5, 3, -5);
      const pointLight = new THREE.PointLight(0xffffff, 0.8);
      pointLight.position.set(0, 2, 5);

      renderScene.add(ambientLight);
      renderScene.add(directionalLight1);
      renderScene.add(directionalLight2);
      renderScene.add(pointLight);

      // Create camera (matching the viewer)
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
      camera.position.set(0, 0, 6);
      camera.lookAt(0, 0, 0);

      // Create renderer
      const renderWidth = 2000;
      const renderHeight = 2000;
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true 
      });
      renderer.setSize(renderWidth, renderHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      // Render the scene
      renderer.render(renderScene, camera);

      // Get the canvas and convert to PNG
      const canvas = renderer.domElement;
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'my-design.png';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Cleanup
          renderer.dispose();
          resolve();
        } else {
          renderer.dispose();
          reject(new Error('Failed to create PNG blob'));
        }
      }, 'image/png');
    } catch (error) {
      reject(error);
    }
  });
}

export default function TShirt3D({ tshirtColor, elements, selectedElement, onElementClick, onElementMove, onElementRotate, modelPath = DEFAULT_TSHIRT_MODEL_PATH }: TShirt3DProps) {
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  
  // Preload all available models
  usePreloadModels();

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading 3D scene...</p>
          </div>
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 50 }}
          gl={{ 
            antialias: true, 
            alpha: true
          }}
          style={{ width: '100%', height: '100%' }}
          onCreated={({ camera }) => {
            camera.lookAt(0, 0, 0);
          }}
        >
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />
          <directionalLight position={[-5, 3, -5]} intensity={0.6} />
          <pointLight position={[0, 2, 5]} intensity={0.8} />
          
          <Suspense fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#cccccc" />
            </mesh>
          }>
            <TShirtMesh
              key={modelPath}
              color={tshirtColor}
              onElementClick={onElementClick}
              elements={elements}
              modelPath={modelPath}
            />
          </Suspense>
          
          {elements.map((element) => (
            element.type === 'image' ? (
              <Suspense key={element.id} fallback={null}>
                <ImageElement
                  element={element}
                  isSelected={selectedElement === element.id}
                  onSelect={() => onElementClick(element.id)}
                  onMove={(x, y) => onElementMove(element.id, x, y)}
                  onRotate={onElementRotate ? (rotation) => onElementRotate(element.id, rotation) : undefined}
                  onDragStart={() => setIsDraggingAny(true)}
                  onDragEnd={() => setIsDraggingAny(false)}
                />
              </Suspense>
            ) : (
              <Suspense key={element.id} fallback={null}>
                <TextElement
                  element={element}
                  isSelected={selectedElement === element.id}
                  onSelect={() => onElementClick(element.id)}
                  onMove={(x, y) => onElementMove(element.id, x, y)}
                  onRotate={onElementRotate ? (rotation) => onElementRotate(element.id, rotation) : undefined}
                  onDragStart={() => setIsDraggingAny(true)}
                  onDragEnd={() => setIsDraggingAny(false)}
                />
              </Suspense>
            )
          ))}
          
          <OrbitControls
            enablePan={false}
            enableZoom={!isDraggingAny}
            enableRotate={!isDraggingAny}
            minDistance={3}
            maxDistance={10}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI - Math.PI / 4}
            enableDamping={true}
            dampingFactor={0.05}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}

