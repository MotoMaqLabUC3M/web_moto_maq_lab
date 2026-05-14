import os
from PIL import Image

def convert_to_webp(folder_path):
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_lower = file.lower()
            if file_lower.endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                file_path = os.path.join(root, file)
                # Nombre del nuevo archivo webp
                name_without_ext = os.path.splitext(file)[0]
                webp_path = os.path.join(root, name_without_ext + '.webp')
                
                try:
                    with Image.open(file_path) as img:
                        # Convertir a RGB si es necesario (ej: RGBA o paleta para JPEG no soporta alpha, pero WEBP sí soporta alpha, 
                        # aunque si es RGBA se guarda bien en webp).
                        img.save(webp_path, 'webp')
                    print(f"Converted: {file} -> {name_without_ext}.webp")
                    
                    # Eliminar el archivo original
                    os.remove(file_path)
                    print(f"Deleted original: {file}")
                except Exception as e:
                    print(f"Error converting {file}: {e}")

if __name__ == '__main__':
    convert_to_webp('d:\\2-Moto\\web_moto_maq_lab\\assets\\img\\equipo')
