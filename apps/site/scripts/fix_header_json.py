import os
import json

# Fix global.css
try:
    with open('assets/css/global.css', 'r', encoding='utf-8') as f:
        css = f.read()

    old_header = """/* --- Header Principal --- */
.main-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    padding: 1rem 5%;
    justify-content: space-between;
    background-color: var(--bg-darker);
    font-weight: 700;
    font-size: 0.8rem;
}"""

    new_header = """/* --- Header Principal --- */
.main-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    padding: 1rem 5%;
    justify-content: space-between;
    background-color: transparent;
    font-weight: 700;
    font-size: 0.8rem;
    transition: background-color 0.3s ease;
}

.main-header.header-scrolled {
    background-color: var(--bg-darker);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}"""

    if old_header in css:
        css = css.replace(old_header, new_header)
        with open('assets/css/global.css', 'w', encoding='utf-8') as f:
            f.write(css)
        print("Updated global.css")
    else:
        print("CSS already updated or old_header not found")
except Exception as e:
    print(f"Error updating global.css: {e}")

# Fix patrocinadores.json
try:
    with open('assets/data/patrocinadores.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    for tier in data['tiers']:
        for sponsor in tier['sponsors']:
            if 'logo' in sponsor:
                sponsor['logo'] = sponsor['logo'].replace('.png', '.webp').replace('.jpg', '.webp').replace('.PNG', '.webp')
            if sponsor['id'] == 'addyx':
                sponsor['galeria'] = [
                    "assets/img/patrocinios/addyx/laminado 1.webp",
                    "assets/img/patrocinios/addyx/fibra.webp",
                    "assets/img/patrocinios/addyx/lamiado 3.webp",
                    "assets/img/patrocinios/addyx/laminado 2.webp",
                    "assets/img/patrocinios/addyx/montado.webp"
                ]

    with open('assets/data/patrocinadores.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print("Updated patrocinadores.json")
except Exception as e:
    print(f"Error updating patrocinadores.json: {e}")
