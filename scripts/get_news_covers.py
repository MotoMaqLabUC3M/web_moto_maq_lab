import requests
import re
import os

urls = {
    "ser_cover.jpg": "https://cadenaser.com/cmadrid/2026/02/27/asi-es-la-nueva-moto-de-competicion-creada-por-estudiantes-de-la-uc3m-ser-madrid-sur/",
    "alcabo_cover.jpg": "https://alcabodelacalle.es/?s=MotoMaqLab"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

os.makedirs("assets/img/prensa", exist_ok=True)

for filename, url in urls.items():
    print(f"Fetching {url}")
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        match = re.search(r'<meta property="og:image" content="([^"]+)"', res.text)
        if match:
            img_url = match.group(1).replace("&amp;", "&")
            print(f"Found image: {img_url}")
            img_res = requests.get(img_url, headers=headers)
            if img_res.status_code == 200:
                filepath = os.path.join("assets/img/prensa", filename)
                with open(filepath, "wb") as f:
                    f.write(img_res.content)
                print(f"Saved to {filepath}")
            else:
                print(f"Failed to download image {img_url}")
        else:
            print("No og:image found")
    else:
        print(f"Failed to fetch {url}, status {res.status_code}")
