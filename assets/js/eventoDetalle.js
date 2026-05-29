/**
 * eventoDetalle.js
 * Renderiza página de detalle de evento con diseño showcase.
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


    const JSON_PATH = 'assets/data/eventos.json';

    const TIPO_LABELS = {
        presentacion: 'Presentación',
        hito: 'Hito del proyecto',
        competicion: 'Competición',
        default: 'Evento'
    };

    const LIST_ICONS = ['microscope', 'lightbulb', 'hammer', 'ruler', 'settings', 'factory', 'bar-chart', 'target', 'wrench', 'flask-conical'];

    async function init() {
        const container = document.getElementById('evento-detalle');
        if (!container) return;

        const id = window.motoMaqLabDetailIdFromUrl
            ? window.motoMaqLabDetailIdFromUrl('evento')
            : new URLSearchParams(window.location.search).get('id');

        if (!id) { renderError(container); return; }

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();
            const evento = data.eventos.find(e => e.id === id);

            if (!evento) { renderError(container); return; }

            if (typeof motoMaqLabApplySeo === 'function') {
                motoMaqLabApplySeo({
                    title: `${evento.titulo} | MotoMaqLab UC3M`,
                    description: evento.descripcion || '',
                    canonicalPath: `/evento-${evento.id}.html`,
                    imagePath: evento.imagen || 'assets/img/hero/eventos.webp',
                    ogType: 'website'
                });
            } else {
                document.title = `${sanitize(evento.titulo)} | MotoMaqLab UC3M`;
            }
            injectStructuredData(evento);
            render(container, evento);
        } catch (err) {
            console.error('Error cargando evento:', err);
            renderError(container);
        }
    }

    function render(container, evento) {
        const tipoLabel = TIPO_LABELS[evento.tipo] || TIPO_LABELS.default;

        // Format date
        const fecha = new Date(evento.fecha);
        const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
        let fechaStr = fecha.toLocaleDateString('es-ES', opciones);
        if (evento.fechaFin) {
            const ff = new Date(evento.fechaFin);
            fechaStr = `${fecha.toLocaleDateString('es-ES', { day: 'numeric' })} – ${ff.toLocaleDateString('es-ES', opciones)}`;
        }

        // Construir hero de la página dinámicamente
        const heroImage = evento.imagen;
        const heroClasses = heroImage ? 'ev-hero ev-hero--photo' : 'ev-hero ev-hero--solid-dark';
        const heroBgAttr = heroImage
            ? ` style="--ev-hero-bg:url('${String(heroImage).replace(/'/g, '%27')}')"`
            : '';

        // Parse content
        const { intro, sections } = parseContenido(evento.contenido || evento.descripcion);

        // Build sections HTML
        let sectionsHTML = sections.map(sec => {
            if (sec.type === 'features') {
                const cards = sec.items.map((f, i) => `
                    <div class="sp-feature-card">
                        <span class="sp-feature-icon"><i data-lucide="${LIST_ICONS[i % LIST_ICONS.length]}"></i></span>
                        <p>${f}</p>
                    </div>
                `).join('');
                return `
                    <section class="sp-features-section">
                        <div class="sp-section-label"><div class="sp-label-line"></div><h2>${sec.title}</h2></div>
                        <div class="sp-features-grid">${cards}</div>
                    </section>
                `;
            } else {
                return `
                    <section class="sp-text-block">
                        <div class="sp-section-label"><div class="sp-label-line"></div><h2>${sec.title}</h2></div>
                        <div class="sp-text-content">${sec.paragraphs.map(p => `<p>${p}</p>`).join('')}</div>
                    </section>
                `;
            }
        }).join('');

        container.innerHTML = `
            <!-- HERO -->
            <section class="${heroClasses}"${heroBgAttr}>
                <div class="ev-hero-content">
                    <a href="eventos.html" class="sp-back">← Eventos</a>
                    <span class="badge">${tipoLabel}</span>
                    <h1>${sanitize(evento.titulo)}</h1>
                    <p class="ev-hero-desc">${sanitize(evento.descripcion)}</p>
                </div>
            </section>

            <!-- INFO BAR -->
            <section class="ev-info-bar">
                <div class="ev-info-card">
                    <span class="ev-info-icon"><i data-lucide="calendar"></i></span>
                    <div><span class="ev-info-label">Fecha</span><span class="ev-info-value">${fechaStr}</span></div>
                </div>
                <div class="ev-info-card">
                    <span class="ev-info-icon"><i data-lucide="map-pin"></i></span>
                    <div><span class="ev-info-label">Lugar</span><span class="ev-info-value">${sanitize(evento.lugar)}</span></div>
                </div>
                <div class="ev-info-card">
                    <span class="ev-info-icon"><i data-lucide="clipboard-list"></i></span>
                    <div><span class="ev-info-label">Tipo</span><span class="ev-info-value">${tipoLabel}</span></div>
                </div>
            </section>

            <!-- CONTENT -->
            <div class="ev-body">
                ${intro ? `<p class="ev-intro">${intro}</p>` : ''}
                ${evento.imagenDetalle ? `<img src="${sanitize(evento.imagenDetalle)}" alt="Detalle visual del evento ${sanitize(evento.titulo)} — MotoMaqLab UC3M" class="ev-body__detail-img" />` : ''}
                ${sectionsHTML}
            </div>

            <!-- CTA -->
            <section class="sp-cta-section">
                <a href="eventos.html" class="btn btn--primary">← Ver todos los eventos</a>
            </section>
        `;
        // Inicializar iconos
        if (window.lucide) { lucide.createIcons(); }
    }

    /**
     * Parse content line by line, grouping ## sections with their
     * sub-content (text paragraphs or - list items).
     */
    function parseContenido(text) {
        if (!text) return { intro: '', sections: [] };

        const lines = text.split('\n');
        let intro = '';
        let sections = [];
        let currentTitle = '';
        let currentItems = [];
        let currentParagraphs = [];

        function flushSection() {
            if (!currentTitle) return;
            if (currentItems.length > 0) {
                sections.push({ type: 'features', title: currentTitle, items: currentItems });
            } else if (currentParagraphs.length > 0) {
                sections.push({ type: 'text', title: currentTitle, paragraphs: currentParagraphs });
            }
            currentTitle = '';
            currentItems = [];
            currentParagraphs = [];
        }

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            if (line.startsWith('## ')) {
                flushSection();
                currentTitle = line.slice(3);
            } else if (line.startsWith('- ')) {
                currentItems.push(line.slice(2));
            } else if (currentTitle) {
                currentParagraphs.push(line);
            } else {
                intro += (intro ? ' ' : '') + line;
            }
        });

        flushSection();
        return { intro, sections };
    }

    function renderError(container) {
        container.innerHTML = `
            <div class="sp-error">
                <span class="sp-error-icon"><i data-lucide="search-x"></i></span>
                <h2>Evento no encontrado</h2>
                <p>El evento que buscas no existe o ha sido eliminado.</p>
                <a href="eventos.html" class="btn btn--primary">Ver eventos</a>
            </div>
        `;
        if (window.lucide) { lucide.createIcons(); }
    }

    function injectStructuredData(evento) {
        var script = document.createElement('script');
        script.type = 'application/ld+json';
        var data = {
            "@context": "https://schema.org",
            "@type": "Event",
            "name": evento.titulo,
            "startDate": evento.fecha,
            "endDate": evento.fechaFin || evento.fecha,
            "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
            "eventStatus": "https://schema.org/EventScheduled",
            "location": {
                "@type": "Place",
                "name": evento.lugar,
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": evento.lugar
                }
            },
            "image": evento.imagen ? "https://motomaqlabuc3m.es/" + evento.imagen : "https://motomaqlabuc3m.es/assets/img/hero/eventos.webp",
            "description": evento.descripcion,
            "organizer": {
                "@type": "Organization",
                "name": "MotoMaqLab UC3M",
                "url": "https://motomaqlabuc3m.es"
            }
        };
        script.text = JSON.stringify(data);
        document.head.appendChild(script);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
