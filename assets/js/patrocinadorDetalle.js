/**
 * patrocinadorDetalle.js
 * Renderiza página de detalle de patrocinador con diseño tipo showcase.
 */
(function () {
    function sanitize(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    const JSON_PATH = 'assets/data/patrocinadores.json';

    const FEATURE_ICONS = [
        'microscope', 'lightbulb', 'hammer', 'ruler', 'settings', 'factory', 'bar-chart-2', 'target', 'wrench', 'flask-conical'
    ];

    async function init() {
        const container = document.getElementById('patrocinador-detalle');
        if (!container) return;

        const id = window.motoMaqLabDetailIdFromUrl
            ? window.motoMaqLabDetailIdFromUrl('patrocinador')
            : new URLSearchParams(window.location.search).get('id');

        if (!id) { renderError(container); return; }

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            let sponsor = null;
            let tierName = '';
            for (const tier of data.tiers) {
                const found = tier.sponsors.find(s => s.id === id);
                if (found) { sponsor = found; tierName = tier.name; break; }
            }

            if (!sponsor) { renderError(container); return; }

            document.title = `${sponsor.name} — Patrocinador ${tierName} | MotoMaqLab UC3M`;
            render(container, sponsor, tierName);

        } catch (err) {
            console.error('Error cargando patrocinador:', err);
            renderError(container);
        }
    }

    function render(container, sponsor, tierName) {
        const { intro, features, featureTitle, textBlocks } = parseContenido(sponsor.contenido || sponsor.description);

        // Feature cards
        let featuresHTML = '';
        let galleryImages = (sponsor.galeria || []).slice(); // Copy

        if (features.length > 0) {
            const heroFeatureBg = galleryImages.length > 0 ? galleryImages.shift() : '';
            const cardsHTML = features.map((f, i) => `
                <div class="sp-feature-card ${heroFeatureBg && i === 0 ? 'sp-feature-card--hero-image' : ''}" ${heroFeatureBg && i === 0 ? `style="--sp-hero-card-bg:url('${String(heroFeatureBg).replace(/'/g, '%27')}')"` : ''}>
                    <span class="sp-feature-icon">
                        <i data-lucide="${FEATURE_ICONS[i % FEATURE_ICONS.length]}"></i>
                    </span>
                    <p>${f}</p>
                </div>
            `).join('');

            featuresHTML = `
                <section class="sp-features-section">
                    <div class="sp-section-label">
                        <div class="sp-label-line"></div>
                        <h2>${featureTitle || 'Qué nos aportan'}</h2>
                    </div>
                    <div class="sp-features-grid">${cardsHTML}</div>
                </section>
            `;
        }

        // Text blocks (other ## sections)
        let blocksHTML = '';
        if (textBlocks.length > 0) {
            blocksHTML = textBlocks.map(block => `
                <section class="sp-text-block">
                    <div class="sp-section-label">
                        <div class="sp-label-line"></div>
                        <h2>${block.title}</h2>
                    </div>
                    <div class="sp-text-content">
                        ${block.paragraphs.map(p => `<p>${p}</p>`).join('')}
                    </div>
                </section>
            `).join('');
        }

        // Gallery
        let galeriaHTML = '';
        if (galleryImages.length > 0) {
            galeriaHTML = `
                <section class="sp-gallery-section">
                    <div class="sp-section-label">
                        <div class="sp-label-line"></div>
                        <h2>Galería</h2>
                    </div>
                    <div class="sp-gallery-grid">
                        ${galleryImages.map((img, i) => `
                            <div class="sp-gallery-item ${i === 0 ? 'sp-gallery-item--hero' : ''}">
                                <img src="${img}" alt="${sponsor.name}" loading="lazy" />
                            </div>
                        `).join('')}
                    </div>
                </section>
            `;
        }

        // Website link
        const websiteBtn = sponsor.website
            ? `<a href="${sponsor.website}" target="_blank" rel="noopener noreferrer" class="btn btn--outline sp-web-btn"><i data-lucide="globe"></i> Visitar web</a>`
            : '';

        container.innerHTML = `
            <!-- HERO -->
            <section class="sp-hero">
                <a href="patrocinadores.html" class="sp-back">← Patrocinadores</a>

                <div class="sp-hero-inner">
                    <div class="sp-hero-logo">
                        <img src="${sanitize(sponsor.logo)}" alt="${sanitize(sponsor.name)}" />
                    </div>
                    <div class="sp-hero-text">
                        <span class="badge">${sanitize(tierName)}</span>
                        <h1>${sanitize(sponsor.name)}</h1>
                        <p>${sanitize(intro) || sanitize(sponsor.description)}</p>
                        ${websiteBtn}
                    </div>
                </div>
            </section>

            <!-- FEATURES -->
            ${featuresHTML}

            <!-- TEXT BLOCKS -->
            ${blocksHTML}

            <!-- GALLERY -->
            ${galeriaHTML}

            <!-- CTA -->
            <section class="sp-cta-section">
                <a href="patrocinadores.html" class="btn btn--primary">← Ver todos los patrocinadores</a>
            </section>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        initGalleryLightbox();
        initMobileFeatureCarousel();
    }

    /**
     * On mobile (≤768px), transforms the bento feature grid into a
     * horizontal scroll-snap carousel with dot indicators.
     */
    function initMobileFeatureCarousel() {
        if (window.innerWidth > 768) return;

        const grid = document.querySelector('.sp-features-grid');
        if (!grid) return;

        const cards = Array.from(grid.querySelectorAll('.sp-feature-card'));
        if (cards.length <= 1) return;

        // Build dot indicators
        const dotsWrapper = document.createElement('div');
        dotsWrapper.className = 'sp-carousel-dots';
        dotsWrapper.setAttribute('aria-label', 'Navegación de diapositivas');

        cards.forEach(function (_, i) {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'sp-carousel-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Ir a elemento ' + (i + 1));
            dot.addEventListener('click', function () {
                const gap = parseFloat(getComputedStyle(grid).gap) || 16;
                const cardW = cards[0].getBoundingClientRect().width + gap;
                grid.scrollTo({ left: i * cardW, behavior: 'smooth' });
            });
            dotsWrapper.appendChild(dot);
        });

        // Insert dots section below the grid
        const section = grid.closest('.sp-features-section');
        if (section) {
            section.appendChild(dotsWrapper);
        } else {
            grid.parentNode.insertBefore(dotsWrapper, grid.nextSibling);
        }

        // Update active dot on scroll
        let scrollTimer;
        grid.addEventListener('scroll', function () {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(function () {
                const gap = parseFloat(getComputedStyle(grid).gap) || 16;
                const cardW = cards[0].getBoundingClientRect().width + gap;
                const activeIndex = Math.min(
                    Math.round(grid.scrollLeft / cardW),
                    cards.length - 1
                );
                dotsWrapper.querySelectorAll('.sp-carousel-dot').forEach(function (dot, i) {
                    dot.classList.toggle('active', i === activeIndex);
                });
            }, 50);
        });
    }

    function initGalleryLightbox() {
        const gallery = document.querySelector('.sp-gallery-grid');
        if (!gallery) return;

        const images = Array.from(gallery.querySelectorAll('img'));
        if (images.length === 0) return;

        let currentIndex = 0;

        let lightbox = document.getElementById('sp-gallery-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'sp-gallery-lightbox';
            lightbox.className = 'sp-lightbox';
            lightbox.innerHTML = `
                <button type="button" class="sp-lightbox-close" aria-label="Cerrar imagen">×</button>
                <button type="button" class="sp-lightbox-prev" aria-label="Imagen anterior">‹</button>
                <img class="sp-lightbox-image" alt="Imagen ampliada de la galería del patrocinador" />
                <button type="button" class="sp-lightbox-next" aria-label="Siguiente imagen">›</button>
            `;
            document.body.appendChild(lightbox);
        }

        const imgEl = lightbox.querySelector('.sp-lightbox-image');
        const closeBtn = lightbox.querySelector('.sp-lightbox-close');
        const prevBtn = lightbox.querySelector('.sp-lightbox-prev');
        const nextBtn = lightbox.querySelector('.sp-lightbox-next');

        function closeLightbox() {
            lightbox.classList.remove('is-open');
            document.body.classList.remove('sp-lightbox-open');
            imgEl.removeAttribute('src');
            imgEl.alt = 'Imagen ampliada de la galería del patrocinador';
        }

        function showImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            currentIndex = index;
            
            const target = images[currentIndex];
            imgEl.src = target.currentSrc || target.src;
            imgEl.alt = target.alt || 'Imagen de galeria';
        }

        function openLightbox(index) {
            showImage(index);
            lightbox.classList.add('is-open');
            document.body.classList.add('sp-lightbox-open');
        }

        if (!gallery.dataset.lightboxBound) {
            images.forEach((img, idx) => {
                img.addEventListener('click', (event) => {
                    event.stopPropagation();
                    openLightbox(idx);
                });
            });
            gallery.dataset.lightboxBound = 'true';
        }

        if (!lightbox.dataset.lightboxBound) {
            lightbox.addEventListener('click', (event) => {
                if (event.target === lightbox) closeLightbox();
            });

            closeBtn.addEventListener('click', closeLightbox);
            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

            document.addEventListener('keydown', (event) => {
                if (!lightbox.classList.contains('is-open')) return;
                
                if (event.key === 'Escape') {
                    closeLightbox();
                } else if (event.key === 'ArrowLeft') {
                    showImage(currentIndex - 1);
                } else if (event.key === 'ArrowRight') {
                    showImage(currentIndex + 1);
                }
            });

            lightbox.dataset.lightboxBound = 'true';
        }
    }

    /**
     * Parse contenido splitting by lines first, then grouping.
     * Handles ## Title followed by - items on the next lines (single \n separation).
     */
    function parseContenido(text) {
        if (!text) return { intro: '', features: [], featureTitle: '', textBlocks: [] };

        // Split by individual lines first
        const lines = text.split('\n');
        let intro = '';
        let features = [];
        let featureTitle = '';
        let textBlocks = [];
        let currentTitle = '';
        let currentItems = [];
        let currentParagraphs = [];
        let foundFeatures = false;

        function flushSection() {
            if (!currentTitle) return;
            if (currentItems.length > 0 && !foundFeatures) {
                // First section with list items → feature cards
                features = currentItems;
                featureTitle = currentTitle;
                foundFeatures = true;
            } else if (currentParagraphs.length > 0) {
                textBlocks.push({ title: currentTitle, paragraphs: currentParagraphs });
            }
            currentTitle = '';
            currentItems = [];
            currentParagraphs = [];
        }

        lines.forEach(line => {
            line = line.trim();
            if (!line) return; // skip empty lines

            if (line.startsWith('## ')) {
                flushSection();
                currentTitle = line.slice(3);
            } else if (line.startsWith('- ')) {
                currentItems.push(line.slice(2));
            } else if (currentTitle) {
                currentParagraphs.push(line);
            } else {
                // Before any ## → intro
                intro += (intro ? ' ' : '') + line;
            }
        });

        flushSection();
        return { intro, features, featureTitle, textBlocks };
    }

    function renderError(container) {
        container.innerHTML = `
            <div class="sp-error">
                <span class="sp-error-icon"><i data-lucide="search-x"></i></span>
                <h2>Patrocinador no encontrado</h2>
                <p>El patrocinador que buscas no existe o ha sido eliminado.</p>
                <a href="patrocinadores.html" class="btn btn--primary">Ver patrocinadores</a>
            </div>
        `;

        if (window.lucide) { lucide.createIcons(); }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
