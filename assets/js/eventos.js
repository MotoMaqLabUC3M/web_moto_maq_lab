/**
 * eventos.js
 * Carga eventos desde JSON y muestra solo los próximos (fecha >= hoy).
 * Los pasados se omiten directamente.
 * Cada tarjeta enlaza a evento-<id>.html (URL limpia; ?id= sigue funcionando en evento.html)
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

    async function init() {
        // Página de eventos completa
        const proximosContainer = document.getElementById('proximos-container');
        const pasadosContainer = document.getElementById('pasados-container');
        // Preview en index (3 próximos)
        const indexContainer = document.getElementById('eventos-index-container');

        if (!proximosContainer && !indexContainer && !pasadosContainer) return;

        try {
            const res = await fetch(JSON_PATH);
            const data = await res.json();

            if (!data.eventos) {
                data.eventos = [];
            }

            const ahora = new Date();
            ahora.setHours(0, 0, 0, 0);

            // Solo próximos (fecha >= hoy)
            const proximos = data.eventos
                .filter(ev => {
                    const fecha = new Date(ev.fechaFin || ev.fecha);
                    return fecha >= ahora;
                })
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            // Solo pasados (fecha < hoy)
            const pasados = data.eventos
                .filter(ev => {
                    const fecha = new Date(ev.fechaFin || ev.fecha);
                    return fecha < ahora;
                })
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            // Página de eventos: todos los próximos
            if (proximosContainer) {
                if (proximos.length > 0) {
                    renderEventos(proximosContainer, proximos);
                } else {
                    const empty = document.getElementById('proximos-empty');
                    if (empty) {
                        empty.style.display = 'block';
                        empty.classList.remove('d-none');
                    }
                }
            }

            // Página de eventos: todos los pasados
            if (pasadosContainer) {
                if (pasados.length > 0) {
                    renderEventos(pasadosContainer, pasados);
                } else {
                    const empty = document.getElementById('pasados-empty');
                    if (empty) {
                        empty.style.display = 'block';
                        empty.classList.remove('d-none');
                    }
                }
            }

            // Index: solo los 3 más cercanos
            if (indexContainer) {
                const top3 = proximos.slice(0, 3);
                if (top3.length > 0) {
                    renderEventos(indexContainer, top3);
                } else {
                    indexContainer.innerHTML = '<p class="eventos-empty eventos-empty--fullwidth">Actualmente no tenemos eventos programados. ¡Pronto anunciaremos nuevas fechas!</p>';
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
            link.href = `evento-${evento.id}.html`;
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

            // Imagen (si existe) — sin onerror inline para cumplir CSP
            const imgHTML = evento.imagen
                ? `<div class="evento-img-wrapper"><img src="${sanitize(evento.imagen)}" alt="Imagen del evento: ${sanitize(evento.titulo)} — MotoMaqLab UC3M" loading="lazy" /></div>`
                : '';

            card.innerHTML = `
                ${imgHTML}
                <div class="evento-card-body">
                    <div class="evento-fecha">${fechaStr}</div>
                    <h3>${sanitize(evento.titulo)}</h3>
                    <p class="evento-lugar"><svg class="evento-lugar-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg> ${sanitize(evento.lugar)}</p>
                    <p class="evento-desc">${sanitize(evento.descripcion)}</p>
                    <span class="evento-ver-mas">Ver evento: ${sanitize(evento.titulo)} →</span>
                </div>
            `;

            // Ocultar imagen rota sin onerror inline (cumple CSP)
            const imgEl = card.querySelector('.evento-img-wrapper img');
            if (imgEl) {
                imgEl.addEventListener('error', function () {
                    this.parentElement.style.display = 'none';
                });
            }

            link.appendChild(card);
            fragment.appendChild(link);
        });

        container.appendChild(fragment);
    }

    document.addEventListener('DOMContentLoaded', init);
})();
