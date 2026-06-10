import os
from PIL import Image

in_path = r"c:\Users\xurso\Documents\3 - Programas\GitHub\web_moto_maq_lab\assets\img\motostudent\MS1_Laminado_2.JPG"
out_path = r"c:\Users\xurso\Documents\3 - Programas\GitHub\web_moto_maq_lab\assets\img\motostudent\MS1_Laminado_2.webp"

if os.path.exists(in_path):
    with Image.open(in_path) as img:
        img.save(out_path, 'WEBP')
        print(f"Successfully converted {in_path} to {out_path}")
        os.remove(in_path)
        print(f"Removed original {in_path}")
else:
    print(f"File not found: {in_path}")
