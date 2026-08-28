import requests
import re
import os

domains = {
    "alcabo_cover.jpg": "https://alcabodelacalle.es/",
    "leganes_cover.jpg": "https://leganesactivo.com/",
    "uc3m_cover.jpg": "https://www.uc3m.es/"
}

headers = {"User-Agent": "Mozilla/5.0"}
os.makedirs("assets/img/prensa", exist_ok=True)

for name, url in domains.items():
    print(f"Fetching {url}")
    try:
        res = requests.get(url, headers=headers, timeout=5)
        match = re.search(r'<meta property="og:image" content="([^"]+)"', res.text)
        if match:
            img_url = match.group(1).replace("&amp;", "&")
            print(f"Found og:image: {img_url}")
            img_res = requests.get(img_url, headers=headers, timeout=5)
            with open(f"assets/img/prensa/{name}", "wb") as f:
                f.write(img_res.content)
            print(f"Saved {name}")
        else:
            print(f"No og:image on {url}")
    except Exception as e:
        print(f"Error on {url}: {e}")
