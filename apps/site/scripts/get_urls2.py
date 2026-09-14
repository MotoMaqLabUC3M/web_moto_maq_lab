import requests
import re
import os

headers = {"User-Agent": "Mozilla/5.0"}

def get_url(query, domain):
    res = requests.post("https://lite.duckduckgo.com/lite/", data={"q": query}, headers=headers)
    for u in re.findall(r'href="([^"]+)"', res.text):
        if domain in u: return u
    return None

u1 = get_url("site:uc3m.es MOTO-MAQLAB-UC3M", "uc3m.es")
u2 = get_url("site:leganesactivo.com MOTO-MAQLAB-UC3M", "leganesactivo.com")

with open("urls2.txt", "w") as f:
    f.write(f"{u1}\n{u2}\n")
