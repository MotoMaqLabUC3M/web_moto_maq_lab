/**
 * patrocinadorDetalle.js
 * Renderiza página de detalle de patrocinador con diseño tipo showcase.
 */
(function () {
    const JSON_PATH = 'assets/data/patrocinadores.json';

    const FEATURE_ICONS = [
        'microscope', 'lightbulb', 'hammer', 'ruler', 'settings', 'factory', 'bar-chart-2', 'target', 'wrench', 'flask-conical'
    ];

    async function init() {
        const container = document.getElementById('patrocinador-detalle');
        if (!container) return;

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

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
        if (features.length > 0) {
            const cards = features.map((f, i) => `
                <div class="sp-feature-card">
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
                    <div class="sp-features-grid">${cards}</div>
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
        if (sponsor.galeria && sponsor.galeria.length > 0) {
            galeriaHTML = `
                <section class="sp-gallery-section">
                    <div class="sp-section-label">
                        <div class="sp-label-line"></div>
                        <h2>En acción</h2>
                    </div>
                    <div class="sp-gallery-grid">
                        ${sponsor.galeria.map((img, i) => `
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
                        <img src="${sanitize(sponsor.logo)}" alt="${sponsor.name}" />
                    </div>
                    <div class="sp-hero-text">
                        <span class="badge">${tierName}</span>
                        <h1>${sponsor.name}</h1>
                        <p>${intro || sponsor.description}</p>
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
                <span class="sp-error-icon"><i data-lucide="search-x" style="width: 48px; height: 48px;"></i></span>
                <h2>Patrocinador no encontrado</h2>
                <p>El patrocinador que buscas no existe o ha sido eliminado.</p>
                <a href="patrocinadores.html" class="btn btn--primary">Ver patrocinadores</a>
            </div>
        `;

        if (window.lucide) { lucide.createIcons(); }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
