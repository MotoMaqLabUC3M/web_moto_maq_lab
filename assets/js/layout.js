
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
    const JSON_PATH = 'assets/data/layout.json';

    // Detect if we are on the index page
    const path = window.location.pathname;
    const isIndex = path === '/' || path.endsWith('/index.html') || path.endsWith('/');

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
            if (footerEl) renderFooter(footerEl, data.footer, data.header);

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
            navLinks += '<a href="' + item.href + '">' + item.label + '</a>';
        });
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
})();

