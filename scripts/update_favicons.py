import os
import glob
import re
import shutil

source_dir = 'assets/img/motostudent/b895aa27d6688377611cc197c5f281c1'
target_dir = 'assets/img/favicon'

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

# Copy files
for filename in os.listdir(source_dir):
    if filename != 'guía_de_uso.txt':
        shutil.copy(os.path.join(source_dir, filename), os.path.join(target_dir, filename))
shutil.copy(os.path.join(source_dir, 'favicon.ico'), 'favicon.ico')

# Update HTML files
new_block = '''    <link rel="apple-touch-icon" sizes="57x57" href="assets/img/favicon/apple-icon-57x57.png">
    <link rel="apple-touch-icon" sizes="60x60" href="assets/img/favicon/apple-icon-60x60.png">
    <link rel="apple-touch-icon" sizes="72x72" href="assets/img/favicon/apple-icon-72x72.png">
    <link rel="apple-touch-icon" sizes="76x76" href="assets/img/favicon/apple-icon-76x76.png">
    <link rel="apple-touch-icon" sizes="114x114" href="assets/img/favicon/apple-icon-114x114.png">
    <link rel="apple-touch-icon" sizes="120x120" href="assets/img/favicon/apple-icon-120x120.png">
    <link rel="apple-touch-icon" sizes="144x144" href="assets/img/favicon/apple-icon-144x144.png">
    <link rel="apple-touch-icon" sizes="152x152" href="assets/img/favicon/apple-icon-152x152.png">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/img/favicon/apple-icon-180x180.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="assets/img/favicon/android-icon-192x192.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="96x96" href="assets/img/favicon/favicon-96x96.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/img/favicon/favicon-16x16.png">
    <link rel="manifest" href="assets/img/favicon/manifest.json">
    <meta name="msapplication-TileColor" content="#ffffff">
    <meta name="msapplication-TileImage" content="assets/img/favicon/ms-icon-144x144.png">
    <meta name="theme-color" content="#ffffff">'''

html_files = glob.glob('*.html')

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the <head> section
    head_start = content.find('<head>')
    head_end = content.find('</head>')
    
    if head_start != -1 and head_end != -1:
        head_content = content[head_start:head_end]
        
        # Remove old favicon related tags
        lines = head_content.split('\n')
        new_lines = []
        for line in lines:
            # check if line contains any of the old favicon tags
            if not any(x in line for x in ['rel="icon"', 'rel="apple-touch-icon"', 'rel="manifest"', 'name="msapplication-TileColor"', 'name="msapplication-TileImage"', 'name="theme-color"', 'href="https://motomaqlabuc3m.es/favicon.ico"', 'href="https://motomaqlabuc3m.es/assets/img/logos_uc3m/']):
                new_lines.append(line)
                
        # Inject new block
        new_head_content = '\n'.join(new_lines)
        if not new_head_content.endswith('\n'):
            new_head_content += '\n'
        new_head_content += new_block + '\n'
        
        new_content = content[:head_start] + new_head_content + content[head_end:]
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print('Updated ' + str(len(html_files)) + ' HTML files.')
