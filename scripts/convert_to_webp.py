import os
from PIL import Image
import sys

def convert_to_webp(image_p):
    if not os.path.exists(image_p):
        print(f"File not found: {image_p}")
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
        print("Usage: python convert_to_webp.py <image_path>")
        sys.exit(1)
    
    for img_path in sys.argv[1:]:
        convert_to_webp(img_path)
