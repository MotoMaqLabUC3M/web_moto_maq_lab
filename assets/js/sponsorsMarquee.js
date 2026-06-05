/**
 * sponsorsMarquee.js
 * Carga los patrocinadores Platino desde el JSON y genera
 * una cinta transportadora (marquee infinito) con sus logos.
 * Los logos enlazan a sus páginas dedicadas si existen.
 */
(function () {
    const TRACK_SELECTOR = '.sponsors-track';
    const currentFile = window.location.pathname.split('/').pop() || 'index.html';
    const isEnglish = ['index-en.html', 'sponsors.html', 'about-us.html', 'team.html', 'events.html', 'blog-en.html', 'for-sponsors.html'].includes(currentFile);
    const JSON_PATH = isEnglish ? 'assets/data/patrocinadores-en.json' : 'assets/data/patrocinadores.json';

    async function init() {
        const track = document.querySelector(TRACK_SELECTOR);
        if (!track) return;

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            const platinumTier = data.tiers.find(t => t.id === 'platinum');
            if (!platinumTier || !platinumTier.sponsors.length) return;

            const sponsors = platinumTier.sponsors;

            // Crear un set de logos
            function appendSet() {
                const frag = document.createDocumentFragment();
                sponsors.forEach(s => frag.appendChild(createLogoItem(s)));
                track.appendChild(frag);
            }

            // Añadir suficientes copias para llenar la pantalla y garantizar
            // continuidad. Con 6 sets hay de sobra para cualquier ancho.
            for (let i = 0; i < 6; i++) appendSet();

            // Velocidad dinámica basada en el ancho total
            const singleSetWidth = sponsors.length * (180 + 64); // item width + gap
            const halfTrack = singleSetWidth * 3;
            const speed = 60; // px por segundo
            const duration = halfTrack / speed;
            track.style.animationDuration = duration + 's';

        } catch (err) {
            console.error('Error cargando patrocinadores para marquee:', err);
        }
    }

    function createLogoItem(sponsor) {
        const item = document.createElement('div');
        item.className = 'marquee-item';

        const img = document.createElement('img');
        img.src = sponsor.logo;
        img.alt = sponsor.name;
        img.loading = 'lazy';

        // Enlazar a página dedicada si existe
        const linkTarget = sponsor.dedicatedPage || sponsor.website;
        if (linkTarget) {
            const link = document.createElement('a');
            link.href = linkTarget;
            if (sponsor.website && !sponsor.dedicatedPage) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }
            link.appendChild(img);
            item.appendChild(link);
        } else {
            item.appendChild(img);
        }

        return item;
    }

    document.addEventListener('DOMContentLoaded', init);
})();
