/**
 * eventos.js
 * Carga eventos desde JSON y muestra solo los próximos (fecha >= hoy).
 * Los pasados se omiten directamente.
 * Cada tarjeta enlaza a evento.html?id=xxx
 */
(function () {
    const JSON_PATH = 'assets/data/eventos.json';

    async function init() {
        // Página de eventos completa
        const proximosContainer = document.getElementById('proximos-container');
        // Preview en index (3 próximos)
        const indexContainer = document.getElementById('eventos-index-container');

        if (!proximosContainer && !indexContainer) return;

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            if (!data.eventos || !data.eventos.length) return;

            const ahora = new Date();
            ahora.setHours(0, 0, 0, 0);

            // Solo próximos (fecha >= hoy)
            const proximos = data.eventos
                .filter(ev => {
                    const fecha = new Date(ev.fechaFin || ev.fecha);
                    return fecha >= ahora;
                })
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            // Página de eventos: todos los próximos
            if (proximosContainer) {
                if (proximos.length > 0) {
                    renderEventos(proximosContainer, proximos);
                } else {
                    const empty = document.getElementById('proximos-empty');
                    if (empty) empty.style.display = 'block';
                }
            }

            // Index: solo los 3 más cercanos
            if (indexContainer) {
                const top3 = proximos.slice(0, 3);
                if (top3.length > 0) {
                    renderEventos(indexContainer, top3);
                }
            }

        } catch (err) {
            console.error('Error cargando eventos:', err);
        }
    }

    function renderEventos(container, eventos) {
        const fragment = document.createDocumentFragment();

        eventos.forEach(evento => {
            const link = document.createElement('a');
            link.href = `evento.html?id=${evento.id}`;
            link.className = 'evento-card-link';

            const card = document.createElement('div');
            card.className = 'evento-card';

            // Formatear fecha
            const fecha = new Date(evento.fecha);
            const opciones = { day: 'numeric', month: 'long', year: 'numeric' };
            let fechaStr = fecha.toLocaleDateString('es-ES', opciones);

            // Si tiene fechaFin, mostrar rango
            if (evento.fechaFin) {
                const fechaFin = new Date(evento.fechaFin);
                const opcionesFin = { day: 'numeric', month: 'long', year: 'numeric' };
                fechaStr = `${fecha.toLocaleDateString('es-ES', { day: 'numeric' })} - ${fechaFin.toLocaleDateString('es-ES', opcionesFin)}`;
            }

            // Imagen (si existe)
            const imgHTML = evento.imagen
                ? `<div class="evento-img-wrapper"><img src="${evento.imagen}" alt="${evento.titulo}" loading="lazy" onerror="this.parentElement.style.display='none'" /></div>`
                : '';

            card.innerHTML = `
                ${imgHTML}
                <div class="evento-card-body">
                    <div class="evento-fecha">${fechaStr}</div>
                    <h3>${evento.titulo}</h3>
                    <p class="evento-lugar">📍 ${evento.lugar}</p>
                    <p class="evento-desc">${evento.descripcion}</p>
                    <span class="evento-ver-mas">Ver más →</span>
                </div>
            `;

            link.appendChild(card);
            fragment.appendChild(link);
        });

        container.appendChild(fragment);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
