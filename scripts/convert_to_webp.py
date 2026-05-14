import os
from PIL import Image
import sys

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

def convert_to_webp(image_p):
    if not os.path.exists(image_p):
        print(f"File not found: {image_p}")
        return
    
    # Ignore if already webp
    if image_p.lower().endswith('.webp'):
        print(f"Skipping already webp file: {image_p}")
        return

    webp_path = os.path.splitext(image_p)[0] + ".webp"
    try:
        with Image.open(image_p) as img:
            img.save(webp_path, "webp", quality=80)
            print(f"Converted {image_p} to {webp_path}")
            os.remove(image_p)
            print(f"Removed original {image_p}")
    except Exception as e:
        print(f"Error converting {image_p}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_to_webp.py <image_path_or_dir>")
        sys.exit(1)
    
    for path in sys.argv[1:]:
        if os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                for filename in files:
                    ext = os.path.splitext(filename)[1].lower()
                    if ext in ['.png', '.jpg', '.jpeg', '.heic', '.webp']:
                        convert_to_webp(os.path.join(root, filename))
        else:
            convert_to_webp(path)
