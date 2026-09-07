
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
        'patrocinador-UC3M.html': 'sponsor-UC3M.html',
        'patrocinador-addyx.html': 'sponsor-addyx.html',
        'patrocinador-altair.html': 'sponsor-altair.html',
        'patrocinador-maqlab.html': 'sponsor-maqlab.html',
        'patrocinador-retamal.html': 'sponsor-retamal.html',
        'patrocinador.html': 'sponsor.html'
    };

    const reverseRouteMap = {};
    for (const key in routeMap) {
        reverseRouteMap[routeMap[key]] = key;
    }

    // Un archivo es inglés si su nombre está en los valores del routeMap,
    // o si es una ficha EN de noticia (news-{slug}.html / news.html).
    const isNewsPretty = currentFile === 'news.html' || /^news-/i.test(currentFile);
    const isEnglish = reverseRouteMap.hasOwnProperty(currentFile) || isNewsPretty;
    const JSON_PATH = isEnglish ? 'assets/data/layout-en.json' : 'assets/data/layout.json';

    // Guardamos la preferencia actual para el selector de idioma,
    // pero evitamos redirecciones automáticas por idioma del navegador.
    // Motivo: las redirecciones basadas en cliente pueden generar señales
    // SEO ambiguas (canonical/hreflang) en Google Search Console.
    localStorage.setItem('motomaqlab_lang', isEnglish ? 'en' : 'es');

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
        // Render Top Announcement Bar if not closed in this session
        if (!sessionStorage.getItem('hide_top_announcement') && !document.querySelector('.top-announcement-bar')) {
            const topBar = document.createElement('div');
            topBar.className = 'top-announcement-bar';
            const barText = isEnglish ? 
                '🔥 <strong>RECRUITMENT OPEN 2025/2027!</strong> We are looking for UC3M students for all departments.' : 
                '🔥 <strong>¡CAPTACIÓN ABIERTA 2025/2027!</strong> Buscamos estudiantes de la UC3M para todos los departamentos.';
            const barLinkText = isEnglish ? 'Apply now &rarr;' : 'Solicitar unirse &rarr;';
            topBar.innerHTML = 
                '<div class="top-announcement-bar__content">' +
                    '<span>' + barText + '</span>' +
                    '<a href="unete.html" class="top-announcement-bar__link">' + barLinkText + '</a>' +
                '</div>' +
                '<button type="button" class="top-announcement-bar__close" aria-label="Cerrar">&times;</button>';
            
            document.body.insertBefore(topBar, document.body.firstChild);

            topBar.querySelector('.top-announcement-bar__close').addEventListener('click', function() {
                topBar.classList.add('is-hidden');
                sessionStorage.setItem('hide_top_announcement', 'true');
            });
        }

        // Build nav links
        var navLinks = '';
        h.nav.forEach(function (item) {
            if (item.submenu) {
                var submenuLinks = '';
                item.submenu.forEach(function(sub) {
                    var badgeHtml = sub.badge ? ' <span class="nav-badge-pulse">' + sub.badge + '</span>' : '';
                    submenuLinks += '<a href="' + sub.href + '">' + sub.label + badgeHtml + '</a>';
                });
                navLinks += '<div class="nav-dropdown">' +
                                '<a href="javascript:void(0);" class="nav-dropdown-toggle">' + item.label + ' <i data-lucide="chevron-down" class="dropdown-icon"></i></a>' +
                                '<div class="nav-dropdown-content">' + submenuLinks + '</div>' +
                            '</div>';
            } else {
                navLinks += '<a href="' + item.href + '">' + item.label + '</a>';
            }
        });
        
        var linkES = '#';
        var linkEN = '#';

        if (/^noticia-/i.test(currentFile)) {
            linkES = currentFile;
            linkEN = currentFile.replace(/^noticia-/i, 'news-');
        } else if (/^news-/i.test(currentFile)) {
            linkEN = currentFile;
            linkES = currentFile.replace(/^news-/i, 'noticia-');
        } else if (isEnglish) {
            linkES = reverseRouteMap[currentFile] || '/';
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
            '<div class="logo-text">' + h.logo.text.trim() + '<span>' + h.logo.highlight.trim() + '</span></div>' +
            '</a>' +
            '<button class="hamburger" aria-label="MenÃº">' +
            '<span></span><span></span><span></span>' +
            '</button>' +
            '<div class="enlaces-header mobile-menu">' +
            '<nav>' + navLinks + '</nav>' +
            '</div>';
    }

    function adminLoginHref() {
        if (typeof window.__MML_ADMIN_URL__ === 'string' && window.__MML_ADMIN_URL__) {
            return window.__MML_ADMIN_URL__;
        }
        return '/admin/login';
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
            '<a href="' + adminLoginHref() + '" class="footer-admin-link" rel="nofollow">Admin</a>' +
            '</div>';
    }

    // Run immediately (sync-like) so layout is ready before DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
