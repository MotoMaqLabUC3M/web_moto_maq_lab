with open('assets/js/media.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for line in lines:
    out.append(line)

ig_code = """
    // Instagram Grid (Mock Data for now)
    const igGrid = document.getElementById('ig-grid');
    if (igGrid) {
        const mockData = [
            { "id": "ig1", "type": "video", "likes": 1250, "comments": 84, "src": "assets/img/ig_cache/post_1.mp4", "url": "https://www.instagram.com/p/DYmN6WBNN8J/" },
            { "id": "ig2", "type": "photo", "likes": 562, "comments": 12, "src": "assets/img/ig_cache/post_2.jpg", "url": "https://www.instagram.com/p/DYZXW9kDfTj/" },
            { "id": "ig3", "type": "photo", "likes": 405, "comments": 19, "src": "assets/img/ig_cache/post_3.jpg", "url": "https://www.instagram.com/p/DXcR0zpDFQa/" },
            { "id": "ig4", "type": "photo", "likes": 894, "comments": 45, "src": "assets/img/ig_cache/post_4.jpg", "url": "https://www.instagram.com/p/DXM2G51jHBu/" }
        ];

        igGrid.innerHTML = '';
        mockData.forEach(item => {
            const a = document.createElement('a');
            a.className = 'ig-post stagger-reveal';
            a.href = item.url;
            a.target = '_blank';
            
            let mediaTag = item.type === 'video' 
                ? `<video src="${item.src}" autoplay loop muted playsinline></video>`
                : `<img src="${item.src}" alt="Instagram post" loading="lazy">`;

            a.innerHTML = `
                ${mediaTag}
                <div class="ig-overlay">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                    </svg>
                </div>
            `;
            igGrid.appendChild(a);
        });
    }
});
"""

last_brace = -1
for i, line in enumerate(out):
    if line.strip() == '});':
        last_brace = i

if last_brace != -1:
    out.insert(last_brace, ig_code.replace('});\n', ''))
else:
    out.append(ig_code.replace('});\n', ''))

with open('assets/js/media.js', 'w', encoding='utf-8') as f:
    f.writelines(out)
