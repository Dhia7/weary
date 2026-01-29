import { NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Path to the public/models directory
    const modelsDir = join(process.cwd(), 'public', 'models');
    
    // Check if directory exists
    if (!existsSync(modelsDir)) {
      console.warn(`Models directory not found: ${modelsDir}`);
      return NextResponse.json({
        success: true,
        data: { models: [] }
      });
    }
    
    // Read all files in the directory
    const files = await readdir(modelsDir);
    
    // Filter for .glb files and create model objects
    const models = files
      .filter(file => file.toLowerCase().endsWith('.glb'))
      .map(file => {
        const path = `/models/${file}`;
        // Generate a friendly name from filename
        // Remove .glb extension, replace underscores/hyphens with spaces, capitalize words
        let name = file
          .replace(/\.glb$/i, '')
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => {
            // Handle special cases like "3d" -> "3D", "t" -> "T"
            if (word.toLowerCase() === '3d') return '3D';
            if (word.toLowerCase() === 't') return 'T';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
          })
          .join(' ');
        
        // Clean up common patterns
        name = name
          .replace(/\bT Shirt\b/gi, 'T-Shirt')
          .replace(/\b3d Model\b/gi, '3D Model')
          .replace(/\bModel\b/gi, ''); // Remove "Model" suffix if present
        
        // Handle special cases for better display names
        if (name.toLowerCase().includes('shirt baked')) {
          name = 'Short Sleeve T-Shirt';
        } else if (name.toLowerCase().includes('long sleeve')) {
          name = name.replace(/\bLong Sleeve\b/gi, 'Long Sleeve');
        } else if (name.toLowerCase().includes('hoodie')) {
          name = name.replace(/\bHoodie\b/gi, 'Hoodie');
        }
        
        name = name.trim();
        
        return {
          path,
          name,
          filename: file
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    
    return NextResponse.json({
      success: true,
      data: { models }
    });
  } catch (error) {
    console.error('Error reading models directory:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to list models' },
      { status: 500 }
    );
  }
}

