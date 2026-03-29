import os
import re

SRI_HASH = "sha384-CykfT8/c0napBs4OEPBYSNzMhNhJUvjNEulxWZVAK+p2D3vEfYGg9zyOd8bzqyNO"
LUCIDE_SECURE = f'<script src="https://unpkg.com/lucide@1.7.0/dist/umd/lucide.min.js" integrity="{SRI_HASH}" crossorigin="anonymous"></script>'

CSP_META = """    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://translate.google.com https://translate.googleapis.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://translate.googleapis.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; frame-src 'self' https:; connect-src 'self' https:;">"""

for root, _, files in os.walk('.'):
    for fn in files:
        if fn.endswith('.html'):
            filepath = os.path.join(root, fn)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if "X-Content-Type-Options" not in content:
                content = re.sub(
                    r'(<meta charset="UTF-8"\s*/?>[ \t]*\n)',
                    rf'\1{CSP_META}\n',
                    content
                )
            
            # Replace old translation scripts
            content = content.replace(
                'src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"',
                'src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"'
            )

            # Replace lucide imports
            content = re.sub(
                r'<script src="https://unpkg.com/lucide@(?:latest|1\.7\.0/dist/umd/lucide\.min\.js)"></script>',
                LUCIDE_SECURE,
                content
            )

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)

# Update layout.js
js_path = 'assets/js/layout.js'
if os.path.exists(js_path):
    with open(js_path, 'r', encoding='utf-8') as f:
        js = f.read()
    
    # Fix layout.js to use integrity
    js = js.replace(
        "script.src = 'https://unpkg.com/lucide@latest';", 
        "script.src = 'https://unpkg.com/lucide@1.7.0/dist/umd/lucide.min.js';\n                script.integrity = 'sha384-CykfT8/c0napBs4OEPBYSNzMhNhJUvjNEulxWZVAK+p2D3vEfYGg9zyOd8bzqyNO';\n                script.crossOrigin = 'anonymous';"
    )
    # Also if it already was set to 1.7.0 without SRI (due to previous git checkout missing it, or me updating it but missing SRI)
    js = js.replace(
        "script.src = 'https://unpkg.com/lucide@1.7.0/dist/umd/lucide.min.js';", 
        "script.src = 'https://unpkg.com/lucide@1.7.0/dist/umd/lucide.min.js';\n                script.integrity = 'sha384-CykfT8/c0napBs4OEPBYSNzMhNhJUvjNEulxWZVAK+p2D3vEfYGg9zyOd8bzqyNO';\n                script.crossOrigin = 'anonymous';"
    )
    
    # Clean up double replacement if happened
    js = js.replace("anonymous';\n                script.integrity", "anonymous';")
    js = js.replace("anonymous';\n                script.crossOrigin = 'anonymous';", "anonymous';")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js)

print("Done")
