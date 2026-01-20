#!/bin/bash
# Image Optimization Script for Partyworld Theme
# Converts large PNGs to optimized JPEGs/WebP
# 
# Prerequisites:
#   brew install imagemagick webp
#
# Usage:
#   ./scripts/optimize-images.sh

set -e

IMG_DIR="assets/img"
QUALITY=82
MAX_WIDTH=1920

echo "🖼️  Partyworld Image Optimization"
echo "=================================="

# Check for required tools
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Install with: brew install imagemagick"
    exit 1
fi

if ! command -v cwebp &> /dev/null; then
    echo "⚠️  WebP tools not found. Install with: brew install webp"
    echo "   Skipping WebP generation..."
    SKIP_WEBP=true
fi

# Function to optimize a single image
optimize_image() {
    local input="$1"
    local filename=$(basename "$input")
    local dirname=$(dirname "$input")
    local name="${filename%.*}"
    local ext="${filename##*.}"
    
    # Get image info
    local size=$(ls -lh "$input" | awk '{print $5}')
    local dims=$(identify -format "%wx%h" "$input" 2>/dev/null || echo "unknown")
    
    echo ""
    echo "Processing: $input"
    echo "  Current: $size ($dims)"
    
    # Skip if already small (under 50KB)
    local bytes=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input" 2>/dev/null)
    if [ "$bytes" -lt 51200 ]; then
        echo "  ✓ Already optimized (under 50KB)"
        return
    fi
    
    # Convert PNG to JPEG if no transparency
    if [ "$ext" = "png" ] || [ "$ext" = "PNG" ]; then
        # Check for transparency
        local has_alpha=$(identify -format '%[channels]' "$input" 2>/dev/null)
        
        if [[ "$has_alpha" == *"a"* ]]; then
            # Has transparency - optimize as PNG
            local output="${dirname}/${name}-optimized.png"
            convert "$input" -strip -resize "${MAX_WIDTH}x>" "$output"
            echo "  → Optimized PNG: $(ls -lh "$output" | awk '{print $5}')"
        else
            # No transparency - convert to JPEG
            local output="${dirname}/${name}.jpg"
            convert "$input" -strip -quality $QUALITY -resize "${MAX_WIDTH}x>" "$output"
            echo "  → Converted to JPEG: $(ls -lh "$output" | awk '{print $5}')"
        fi
    else
        # Optimize JPEG
        local output="${dirname}/${name}-optimized.jpg"
        convert "$input" -strip -quality $QUALITY -resize "${MAX_WIDTH}x>" "$output"
        echo "  → Optimized JPEG: $(ls -lh "$output" | awk '{print $5}')"
    fi
    
    # Generate WebP version
    if [ -z "$SKIP_WEBP" ]; then
        local webp_output="${dirname}/${name}.webp"
        cwebp -q 80 -resize $MAX_WIDTH 0 "$input" -o "$webp_output" 2>/dev/null
        echo "  → WebP version: $(ls -lh "$webp_output" | awk '{print $5}')"
    fi
}

# Find and optimize large images (over 100KB)
echo ""
echo "Scanning for large images (>100KB)..."

find "$IMG_DIR" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read -r img; do
    bytes=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)
    if [ "$bytes" -gt 102400 ]; then
        optimize_image "$img"
    fi
done

echo ""
echo "✅ Optimization complete!"
echo ""
echo "Next steps:"
echo "1. Review the optimized files in $IMG_DIR"
echo "2. Replace originals with optimized versions"
echo "3. Update templates if filenames changed (PNG→JPG)"
echo "4. For carousel images: Re-upload via BigCommerce admin"
