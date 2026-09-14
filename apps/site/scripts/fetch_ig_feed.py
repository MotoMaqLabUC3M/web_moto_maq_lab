import os
import json
import requests
from datetime import datetime
try:
    import instaloader
except ImportError:
    print("instaloader not installed. Run: pip install instaloader")
    exit(1)

# Configuracion
USERNAME = "motomaqlabuc3m"
MAX_POSTS = 4
CACHE_DIR = "assets/img/ig_cache"
DATA_FILE = "assets/data/ig_feed.json"

# Asegurar directorios
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

# Limpiar cache antigua para no acumular archivos
for f in os.listdir(CACHE_DIR):
    os.remove(os.path.join(CACHE_DIR, f))

# Inicializar Instaloader
L = instaloader.Instaloader()
try:
    profile = instaloader.Profile.from_username(L.context, USERNAME)
except Exception as e:
    print(f"Error fetching profile: {e}")
    exit(1)

posts_data = []

print(f"Fetching latest {MAX_POSTS} posts from {USERNAME}...")
for i, post in enumerate(profile.get_posts()):
    if i >= MAX_POSTS:
        break
        
    print(f"Processing post {i+1} ({post.shortcode})...")
    
    # Determinar tipo y URL del medio
    is_video = post.is_video
    media_url = post.video_url if is_video else post.url
    extension = "mp4" if is_video else "jpg"
    
    # Nombre del archivo local
    filename = f"{post.shortcode}.{extension}"
    filepath = os.path.join(CACHE_DIR, filename)
    
    # Descargar el medio directamente para evitar archivos basura de instaloader
    try:
        response = requests.get(media_url, stream=True)
        response.raise_for_status()
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
    except Exception as e:
        print(f"Failed to download media for {post.shortcode}: {e}")
        continue

    # Agregar a los datos
    posts_data.append({
        "id": post.shortcode,
        "type": "video" if is_video else "photo",
        "likes": post.likes,
        "comments": post.comments,
        "src": f"assets/img/ig_cache/{filename}",
        "url": f"https://www.instagram.com/p/{post.shortcode}/"
    })

# Guardar el JSON
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(posts_data, f, indent=4, ensure_ascii=False)

print(f"Successfully saved {len(posts_data)} posts to {DATA_FILE}")
