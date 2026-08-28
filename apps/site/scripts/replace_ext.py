import os, glob

for ext in ['*.html', 'assets/data/*.json']:
    for f in glob.glob(ext):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        new_content = content.replace('.png', '.webp').replace('.PNG', '.webp').replace('.jpg', '.webp')
        
        if new_content != content:
            with open(f, 'w', encoding='utf-8') as file:
                file.write(new_content)
