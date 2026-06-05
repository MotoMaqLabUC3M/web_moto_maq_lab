
// 🔒 Global HTML Sanitizer to prevent XSS
window.sanitize = function(str) {
    if (typeof str === 'number') return str.toString();
    if (!str || typeof str !== 'string') return str || '';
    return str.replace(/[&<>'"]/g, function(tag) {
        const chars = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
        return chars[tag] || tag;
    });
};

/**
 * layout.js
 * Carga header y footer desde layout.json para evitar duplicar HTML.
 * Se ejecuta ANTES que cualquier otro script de pÃ¡gina.
 *
 * Uso: en cada HTML poner:
 *   <header id="main-header"></header>
 *   ...
 *   <footer id="main-footer"></footer>
 *   <script src="assets/js/layout.js"></script>
 */
(function () {
    const path = window.location.pathname;
    const currentFile = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    const isIndex = currentFile === 'index.html' || currentFile === 'index-en.html' || path.endsWith('/');
    
    const routeMap = {
        'index.html': 'index-en.html',
        'sobre-nosotros.html': 'about-us.html',
        'motostudent.html': 'motostudent-en.html',
        'equipo.html': 'team.html',
        'eventos.html': 'events.html',
        'blog.html': 'blog-en.html',
        'patrocinadores.html': 'sponsors.html',
        'para-patrocinadores.html': 'for-sponsors.html'
    };

    const reverseRouteMap = {};
    for (const key in routeMap) {
        reverseRouteMap[routeMap[key]] = key;
    }

    // Un archivo es inglés si su nombre está en los valores del routeMap
    const isEnglish = reverseRouteMap.hasOwnProperty(currentFile);
    const JSON_PATH = isEnglish ? 'assets/data/layout-en.json' : 'assets/data/layout.json';

    // Guardamos la preferencia actual
    localStorage.setItem('motomaqlab_lang', isEnglish ? 'en' : 'es');

    // Auto-redirección si es la primera vez y entramos a index.html
    if (currentFile === 'index.html' && !localStorage.getItem('motomaqlab_redirected')) {
        localStorage.setItem('motomaqlab_redirected', 'true');
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang.toLowerCase().startsWith('en')) {
            window.location.replace('index-en.html');
        }
    }

    async function init() {
        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            const headerEl = document.getElementById('main-header');
            const footerEl = document.getElementById('main-footer');

            if (headerEl) {
                renderHeader(headerEl, data.header);

                // --- Transparent header logic ---
                window.addEventListener('scroll', () => {
                    if (window.scrollY > 50) {
                        headerEl.classList.add('header-scrolled');
                    } else {
                        headerEl.classList.remove('header-scrolled');
                    }
                });
                // Check initial state
                if (window.scrollY > 50) {
                    headerEl.classList.add('header-scrolled');
                }
            }
            if (footerEl) {
                renderFooter(footerEl, data.footer, data.header);
            }

            // Inicializar o cargar iconos de Lucide dinÃ¡micamente si no existieran
            if (window.lucide) {
                lucide.createIcons();
            } else if (!document.querySelector('script[src*="lucide"]')) {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/lucide@1.7.0/dist/umd/lucide.min.js';
                script.integrity = 'sha384-CykfT8/c0napBs4OEPBYSNzMhNhJUvjNEulxWZVAK+p2D3vEfYGg9zyOd8bzqyNO';
                script.crossOrigin = 'anonymous';
                script.onload = () => lucide.createIcons();
                document.head.appendChild(script);
            }

            // Notify other scripts that layout is ready
            document.dispatchEvent(new Event('layoutReady'));
        } catch (err) {
            console.error('Error cargando layout:', err);
        }
    }

    function renderHeader(el, h) {
        // Build nav links
        var navLinks = '';
        if (!isIndex) {
            navLinks += '<a href="index.html">INICIO</a>';
        }
        h.nav.forEach(function (item) {
            if (item.submenu) {
                var submenuLinks = '';
                item.submenu.forEach(function(sub) {
                    submenuLinks += '<a href="' + sub.href + '">' + sub.label + '</a>';
                });
                navLinks += '<div class="nav-dropdown">' +
                                '<a href="' + item.href + '" class="nav-dropdown-toggle">' + item.label + ' <i data-lucide="chevron-down" class="dropdown-icon"></i></a>' +
                                '<div class="nav-dropdown-content">' + submenuLinks + '</div>' +
                            '</div>';
            } else {
                navLinks += '<a href="' + item.href + '">' + item.label + '</a>';
            }
        });
        
        var linkES = '#';
        var linkEN = '#';

        if (isEnglish) {
            linkES = reverseRouteMap[currentFile] || 'index.html';
            linkEN = currentFile;
        } else {
            linkES = currentFile;
            linkEN = routeMap[currentFile] || 'index-en.html';
        }
        
        var langSwitcher = '<div class="lang-switcher">' +
                           '<a href="' + linkES + '" class="' + (!isEnglish ? 'active' : '') + '"><img src="https://flagcdn.com/w40/es.png" alt="ES" style="width:24px; height:16px; object-fit:cover; vertical-align:middle; margin-right:5px; border-radius:2px; box-shadow: 0 1px 2px rgba(0,0,0,0.5);"></a>' +
                           '<span class="separator">|</span>' +
                           '<a href="' + linkEN + '" class="' + (isEnglish ? 'active' : '') + '"><img src="https://flagcdn.com/w40/gb.png" alt="EN" style="width:24px; height:16px; object-fit:cover; vertical-align:middle; margin-right:5px; border-radius:2px; box-shadow: 0 1px 2px rgba(0,0,0,0.5);"></a>' +
                           '</div>';

        navLinks += langSwitcher;
        navLinks += '<a href="' + h.cta.href + '" class="btn btn--primary">' + h.cta.label + '</a>';

        el.className = 'main-header';
        el.innerHTML =
            '<a href="' + h.logo.href + '" class="logo">' +
            '<div class="logo-wrapper">' +
            '<img src="' + h.logo.img + '" alt="' + h.logo.alt + '" />' +
            '</div>' +
            h.logo.text + ' <span>' + h.logo.highlight + '</span>' +
            '</a>' +
            '<button class="hamburger" aria-label="MenÃº">' +
            '<span></span><span></span><span></span>' +
            '</button>' +
            '<div class="enlaces-header mobile-menu">' +
            '<nav>' + navLinks + '</nav>' +
            '</div>';
    }

    function renderFooter(el, f, h) {
        // Explorar links
        var explorarHTML = '';
        f.explorar.links.forEach(function (link) {
            explorarHTML += '<li><a href="' + link.href + '">' + link.label + '</a></li>';
        });

        // Contacto links
        var contactoHTML = '';
        f.contacto.links.forEach(function (link) {
            contactoHTML += '<li><a href="' + link.href + '"><span>' + link.icon + '</span>' + link.label + '</a></li>';
        });

        // Social icons
        var socialHTML = '';
        f.social.links.forEach(function (link) {
            socialHTML +=
                '<a href="' + link.href + '" target="_blank" aria-label="' + link.label + '">' +
                '<img src="' + link.img + '" alt="' + link.label + '" />' +
                '</a>';
        });

        el.className = 'main-footer';
        el.innerHTML =
            '<div class="footer-content">' +
            '<div class="footer-col brand-col">' +
            '<a href="' + h.logo.href + '" class="logo">' +
            '<div class="logo-wrapper">' +
            '<img src="' + h.logo.img + '" alt="' + h.logo.alt + '" />' +
            '</div>' +
            h.logo.text + ' <span>' + h.logo.highlight + '</span>' +
            '</a>' +
            '<p class="footer-desc">' + f.brand.desc + '</p>' +
            '</div>' +
            '<div class="footer-col">' +
            '<h3>' + f.explorar.title + '</h3>' +
            '<ul class="footer-links">' + explorarHTML + '</ul>' +
            '</div>' +
            '<div class="footer-col">' +
            '<h3>' + f.contacto.title + '</h3>' +
            '<ul class="footer-links">' + contactoHTML + '</ul>' +
            '<iframe class="footer-map" src="https://maps.google.com/maps?q=Universidad+Carlos+III+de+Madrid+Campus+de+LeganÃ©s&t=&z=15&ie=UTF8&iwloc=&output=embed" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
            '</div>' +
            '<div class="footer-col">' +
            '<h3>' + f.social.title + '</h3>' +
            '<div class="social-icons">' + socialHTML + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="footer-bottom">' +
            '<p>' + f.copy.replace('2025', new Date().getFullYear()) + '</p>' +
            '</div>';
    }

    // Run immediately (sync-like) so layout is ready before DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Instagram Feed Global Render
    const igGrid = document.getElementById('ig-grid');
    if (igGrid) {
        const mockData = [
            { "id": "ig1", "type": "photo", "likes": 512, "comments": 23, "src": "assets/img/ig_cache/post_1.jpg", "url": "https://www.instagram.com/p/DYaIBrxjFo0/" },
            { "id": "ig2", "type": "photo", "likes": 342, "comments": 14, "src": "assets/img/ig_cache/post_2.jpg", "url": "https://www.instagram.com/p/DYSe5-gsh34/" },
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
        
        // Trigger reveal for IG grid if ScrollReveal is present
        if(typeof ScrollReveal !== 'undefined') {
            ScrollReveal().reveal('.ig-post', {
                distance: '20px',
                duration: 800,
                easing: 'ease-out',
                interval: 100
            });
        }
    }
})();
