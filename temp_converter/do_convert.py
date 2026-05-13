import os
from PIL import Image

def convert_to_webp(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_lower = file.lower()
            if file_lower.endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                file_path = os.path.join(root, file)
                name_without_ext = os.path.splitext(file)[0]
                webp_path = os.path.join(root, name_without_ext + '.webp')
                try:
                    with Image.open(file_path) as img:
                        img.save(webp_path, 'webp')
                    print(f"Converted: {file} -> {name_without_ext}.webp")
                    os.remove(file_path)
                except Exception as e:
                    print(f"Error converting {file}: {e}")

if __name__ == '__main__':
    convert_to_webp(r'c:\Users\xurso\Documents\3 - Programas\GitHub\web_moto_maq_lab\assets\img\patrocinios\maqlab')
    convert_to_webp(r'c:\Users\xurso\Documents\3 - Programas\GitHub\web_moto_maq_lab\assets\img\patrocinios\uc3m')
