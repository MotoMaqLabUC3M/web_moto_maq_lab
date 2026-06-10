import json
import re

with open('assets/data/patrocinadores.json', 'r', encoding='utf-8') as f:
    es_data = json.load(f)

with open('assets/data/patrocinadores-en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

en_plat = next(t for t in en_data['tiers'] if t['id'] == 'platinum')['sponsors']
has_addyx = any(s['id'] == 'addyx' for s in en_plat)

if not has_addyx:
    addyx_en = {
        "id": "addyx",
        "name": "ADDYX",
        "logo": "assets/img/patrocinios/addyx.webp",
        "description": "Addyx is our partner in the manufacture of 3D printed water-soluble molds. It stands out for its ability to perform from short runs using 3D printing to mass production by rotational molding. Thanks to their molds we have managed to manufacture our hollow twin-spar chassis, integrating the intake system, impossible to achieve with other methods.",
        "website": "https://www.addyx.it/",
        "dedicatedPage": "patrocinador-addyx-en.html",
        "contenido": "AddyX provides us with innovative manufacturing solutions through the use of 3D printed water-soluble molds, which allows us to develop complex geometries that would be impossible with traditional methods. Thanks to their technology, we can manufacture advanced parts like our chassis, integrating functions into a single component. This helps us improve design efficiency and reduce weight and complexity on the motorcycle.\n\n## Impact on the team\nAddyX gives us access to cutting-edge manufacturing processes used in advanced industry. This allows us to explore new construction solutions, reduce production times, and validate more innovative designs. Additionally, their support reinforces the technological nature of our project and drives us to continue developing high-level engineering solutions.\n\n## What they provide us\n- Custom 3D printed water-soluble molds\n- Design for Manufacturing (DfM) advice\n- Rapid prototyping capability\n- Support in the lamination process over mold\n\n## The hollow twin-spar chassis\nThe most notable achievement of our collaboration is the hollow twin-spar chassis in carbon fiber. Thanks to Addyx's molds, we were able to manufacture a chassis with internal cavities that integrate the air intake duct. This design saves weight and improves the aerodynamic performance of the engine.",
        "galeria": [
            "assets/img/patrocinios/addyx/laminado 1.webp",
            "assets/img/patrocinios/addyx/fibra.webp",
            "assets/img/patrocinios/addyx/laminado 3.webp",
            "assets/img/patrocinios/addyx/laminado 2.webp",
            "assets/img/patrocinios/addyx/montado.webp"
        ],
        "seoTitle": "Addyx and MotoMaqLab UC3M — 3D water-soluble molds for carbon fiber chassis | MotoStudent",
        "seoDescription": "Addyx manufactures the WSM-170 water-soluble molds that allow MotoMaqLab UC3M to create its hollow twin-spar carbon fiber chassis with integrated intake.",
        "quoteEquipo": "Addyx's WSM-170 water-soluble molds allowed us to manufacture a hollow twin-spar carbon fiber chassis with the integrated intake duct. Without this technology, that geometry would simply be impossible."
    }
    en_plat.insert(2, addyx_en)
    with open('assets/data/patrocinadores-en.json', 'w', encoding='utf-8') as f:
        json.dump(en_data, f, indent=4, ensure_ascii=False)
    print("Added ADDYX to patrocinadores-en.json")

def update_html(filepath, seo_title, seo_desc):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace <title>
    content = re.sub(r'<title>.*?</title>', f'<title>{seo_title}</title>', content, flags=re.DOTALL)
    
    # Replace meta description
    content = re.sub(r'<meta name="description"\s+content=".*?">', f'<meta name="description" content="{seo_desc}">', content, flags=re.DOTALL)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

es_plat = next(t for t in es_data['tiers'] if t['id'] == 'platinum')['sponsors']

for sponsor in es_plat:
    id = sponsor['id']
    title = sponsor.get('seoTitle', f"{sponsor['name']} — Patrocinador PLATINO | MotoMaqLab UC3M")
    desc = sponsor.get('seoDescription', sponsor.get('description', ''))
    
    html_path = f"patrocinador-{id}.html"
    try:
        update_html(html_path, title, desc)
        print(f"Updated {html_path}")
    except Exception as e:
        print(f"Error updating {html_path}: {e}")

for sponsor in en_plat:
    id = sponsor['id']
    title = sponsor.get('seoTitle', f"{sponsor['name']} — PLATINUM Sponsor | MotoMaqLab UC3M")
    desc = sponsor.get('seoDescription', sponsor.get('description', ''))
    
    html_path = f"patrocinador-{id}-en.html"
    try:
        update_html(html_path, title, desc)
        print(f"Updated {html_path}")
    except Exception as e:
        print(f"Error updating {html_path}: {e}")
