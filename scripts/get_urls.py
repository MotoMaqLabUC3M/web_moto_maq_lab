import requests
import re

headers = {"User-Agent": "Mozilla/5.0"}
res1 = requests.post("https://lite.duckduckgo.com/lite/", data={"q": "site:cadenaser.com MOTO-MAQLAB-UC3M"}, headers=headers)
res2 = requests.post("https://lite.duckduckgo.com/lite/", data={"q": "site:alcabodelacalle.es MOTO-MAQLAB-UC3M"}, headers=headers)

def get_url(html, domain):
    for u in re.findall(r'href="([^"]+)"', html):
        if domain in u: return u
    return None

u1 = get_url(res1.text, "cadenaser.com")
u2 = get_url(res2.text, "alcabodelacalle.es")

with open("urls.txt", "w") as f:
    f.write(f"{u1}\n{u2}\n")
