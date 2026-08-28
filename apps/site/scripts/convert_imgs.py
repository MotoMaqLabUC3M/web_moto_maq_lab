import os
from PIL import Image

def convert_to_webp(input_path, output_path, add_white_bg=False):
    try:
        with Image.open(input_path) as img:
            if add_white_bg and img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.convert('RGBA').split()[3]) # 3 is the alpha channel
                img = background
            
            img.save(output_path, 'WEBP')
            print(f"Successfully converted {input_path} to {output_path}")
            os.remove(input_path)
            print(f"Removed original {input_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

base_dir = r"c:\Users\xurso\Documents\3 - Programas\GitHub\web_moto_maq_lab\assets\img\motostudent"

files_to_convert = [
    ("motostudent_efuel.png", "motostudent_efuel.webp", True),
    ("motostudent_electric.png", "motostudent_electric.webp", True),
    ("motor_ktm_petrol.jpg", "motor_ktm_petrol.webp", False),
    ("ms1_laminado.JPG", "ms1_laminado.webp", False),
    ("ms2_ms7_pruebas.jpg", "ms2_ms7_pruebas.webp", False)
]

for filename, out_filename, add_bg in files_to_convert:
    in_path = os.path.join(base_dir, filename)
    out_path = os.path.join(base_dir, out_filename)
    if os.path.exists(in_path):
        convert_to_webp(in_path, out_path, add_bg)
    else:
        print(f"File not found: {in_path}")
