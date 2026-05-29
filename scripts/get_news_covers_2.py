import requests
import re
import os

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}

res = requests.get("https://alcabodelacalle.es/?s=MotoMaqLab", headers=headers)
match_url = re.search(r'<h2 class="entry-title"><a href="([^"]+)"', res.text)
if match_url:
    article_url = match_url.group(1)
    print(f"Found article URL: {article_url}")
    article_res = requests.get(article_url, headers=headers)
    img_match = re.search(r'<meta property="og:image" content="([^"]+)"', article_res.text)
    if img_match:
        img_url = img_match.group(1).replace("&amp;", "&")
        print(f"Found image URL: {img_url}")
        img_res2 = requests.get(img_url, headers=headers)
        if img_res2.status_code == 200:
            with open("assets/img/prensa/alcabo_cover.jpg", "wb") as f:
                f.write(img_res2.content)
            print("Saved alcabo_cover.jpg")
            
            # Save the url to a file so we can update media.js correctly with the direct link!
            with open("alcabo_url.txt", "w") as f:
                f.write(article_url)
    else:
        print("No og:image found on article page")
else:
    print("Could not find article URL from search page")
