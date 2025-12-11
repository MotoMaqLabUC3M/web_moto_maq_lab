// 1. SELECCIONAR ELEMENTOS
// Imaginad que esto es conectar los cables a los sensores.
// Buscamos en el documento HTML el elemento que tiene la clase 'main-header'
const header = document.querySelector('.main-header');

// 2. DEFINIR LA LÓGICA
// Esta función se ejecutará cada vez que la "rueda gire" (scroll)
function manejarScroll() {
    // Preguntamos al navegador: ¿Cuántos píxeles hemos bajado desde arriba?
    // window.scrollY nos da ese número.
    
    if (window.scrollY > 50) {
        // SI hemos bajado más de 50 píxeles...
        // Añadimos una clase CSS llamada 'scrolled' al header.
        // Es como activar un modo "Sport" cuando pasas de ciertas revoluciones.
        header.classList.add('scrolled');
    } else {
        // SINO (si estamos arriba del todo)...
        // Quitamos la clase para que vuelva a ser transparente.
        header.classList.remove('scrolled');
    }
}

// 3. ACTIVAR EL SENSOR (EVENT LISTENER)
// Le decimos a la ventana del navegador (window) que esté atenta al evento 'scroll'.
// Cada vez que ocurra, debe ejecutar la función 'manejarScroll'.
window.addEventListener('scroll', manejarScroll);

// --- CARGAR IMAGEN DE FONDO (intenta JPG -> CR2 -> fallback inline)
(function cargarFondoHero(){
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const candidates = ['fotos/fondo.JPG', 'fotos/fondo.jpg', 'fotos/fondo.png'];

    function setBackground(url){
        hero.style.backgroundImage = `url('${url}')`;
    }

    // pequeño fallback (data URI) en caso de que no exista la imagen real
    const fallbackDataUri = "data:image/svg+xml;utf8," + encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'>
            <defs>
                <linearGradient id='g' x1='0' x2='1'>
                    <stop offset='0' stop-color='#0f1724'/>
                    <stop offset='1' stop-color='#1f2937'/>
                </linearGradient>
            </defs>
            <rect width='100%' height='100%' fill='url(#g)' />
            <text x='50%' y='50%' fill='#9ca3af' font-family='Montserrat, sans-serif' font-size='48' text-anchor='middle' dominant-baseline='middle'>Imagen de fondo (no disponible)</text>
        </svg>`
    );

    // intentar candidatos en orden
    (function tryNext(i){
        if (i >= candidates.length) { setBackground(fallbackDataUri); return; }
        const src = candidates[i];
        const img = new Image();
        img.onload = function(){ setBackground(src); };
        img.onerror = function(){ tryNext(i+1); };
        img.src = src;
    })(0);
})();

/* --- SIMPLE i18n: TRANSLATIONS Y APLICACIÓN --- */
(function i18n(){
    const TRANSLATIONS = {
        nav: {
            home: { es: 'Inicio', en: 'Home' },
            about: { es: 'Sobre Nosotros', en: 'About' },
            events:{ es: 'Eventos', en: 'Events' },
            team: { es: 'Equipo', en: 'Team' },
            sponsors: { es: 'Patrocinadores', en: 'Sponsors' },
            contact: { es: 'Contacto', en: 'Contact' }
        },
        hero: {
            // keep the slogan "Born to be Engineers" untranslated in Spanish as requested
            title: { es: 'Born to be <span class="text-highlight">Engineers</span>', en: 'Born to be <span class="text-highlight">Engineers</span>' },
            subtitle: { es: 'La pasión universitaria llevada al asfalto.', en: 'University passion taken to the asphalt.' },
            cta: { es: 'Conoce el proyecto', en: 'Discover the project' }
        },
        about: {
            title: { es: 'Ingeniería y Pasión', en: 'Engineering & Passion' },
            lead: { es: 'Somos un equipo de estudiantes de la UC3M aplicando conocimientos teóricos para construir un prototipo ganador.', en: 'We are a student team from UC3M applying theoretical knowledge to build a winning prototype.' },
            historyTitle: { es: 'LA HISTORIA DEL <span class="text-highlight">TEAM</span>', en: 'THE HISTORY OF THE <span class="text-highlight">TEAM</span>' },
            whatIs: { es: '¿Qué es MOTO MAQLAB UC3M?', en: 'What is MOTO MAQLAB UC3M?' },
            whatIsDesc: { es: 'Somos un equipo de Motorsport formado por estudiantes de la Universidad Carlos III de Madrid. Nuestro lema es «Born to be Engineers», y el objetivo del equipo no es solo diseñar una moto, sino formar a sus miembros para que triunfen en su futuro profesional.', en: 'We are a motorsport team made up of students from Universidad Carlos III de Madrid. Our motto is “Born to be Engineers” and our goal is not only to design a motorcycle but to train our members for success in their professional careers.' }
        },
        feature: {
            'tech.title': { es: 'Técnica', en: 'Technical' },
            'tech.desc': { es: 'Aplicamos mecánica avanzada y dinámica vehicular para optimizar cada pieza del prototipo.', en: 'We apply advanced mechanics and vehicle dynamics to optimize every part of the prototype.' },
            'design.title': { es: 'Diseño', en: 'Design' },
            'design.desc': { es: 'Buscamos la aerodinámica perfecta y una estética agresiva que defina nuestra identidad en pista.', en: 'We pursue perfect aerodynamics and an aggressive aesthetic that defines our track identity.' },
            'innov.title': { es: 'Innovación', en: 'Innovation' },
            'innov.desc': { es: 'Implementamos nuevas tecnologías y materiales compuestos para reducir peso y ganar velocidad.', en: 'We implement new technologies and composite materials to reduce weight and gain speed.' }
        },
        events: {
            title: { es: 'Eventos y actividades', en: 'Events & Activities' },
            lead: { es: 'Conoce nuestras últimas salidas, presentaciones y participaciones en ferias y competiciones. Haz click en cualquier tarjeta para ver más detalles.', en: 'Discover our latest outings, presentations and participation in fairs and competitions. Click any card to see details.' },
            searchPlaceholder: { es: 'Buscar evento...', en: 'Search event...' },
            filterAll: { es: 'Todos los años', en: 'All years' }
        },
        team: {
            title: { es: 'Nuestro <span class="text-highlight">Equipo</span>', en: 'Our <span class="text-highlight">Team</span>' },
            lead: { es: 'Somos Moto Maqlab UC3M — pasión, ingeniería y trabajo en equipo.', en: 'We are Moto Maqlab UC3M — passion, engineering and teamwork.' }
        },
        sponsors: {
            title: { es: 'Nuestros <span class="text-highlight">Partners</span>', en: 'Our <span class="text-highlight">Partners</span>' },
            lead: { es: 'La gasolina que impulsa nuestro sueño. Gracias por hacerlo posible.', en: 'The fuel that drives our dream. Thank you for making it possible.' },
            learnMore: { es: 'Saber más', en: 'Learn more' }
        },
        footer: {
            brandDesc: { es: 'Equipo de competición universitaria — Born to be Engineers.', en: 'University competition team — Born to be Engineers.' },
            linksTitle: { es: 'Enlaces', en: 'Links' },
            contactTitle: { es: 'Contacto', en: 'Contact' },
            email: { es: 'Correo: info@example.com', en: 'Email: info@example.com' },
            phone: { es: 'Tel: +34 600 000 000', en: 'Phone: +34 600 000 000' }
        },
        modal: {
            close: { es: 'Cerrar', en: 'Close' }
        }
    };

    function lookup(key, lang){
        if (!key) return null;
        const parts = key.split('.');
        let node = TRANSLATIONS;
        for (let p of parts){
            if (node[p] !== undefined) { node = node[p]; continue; }
            // allow feature keys like feature.tech.title mapped as feature['tech.title']
            const joined = parts.slice(parts.indexOf(p)).join('.');
            if (node[joined] !== undefined) { node = node[joined]; break; }
            return null;
        }
        return node && node[lang] ? node[lang] : null;
    }

    function applyTranslations(lang){
        if (!lang) lang = 'es';
        // set html lang attribute
        document.documentElement.lang = lang;
        localStorage.setItem('siteLang', lang);

        document.querySelectorAll('[data-i18n]').forEach(el=>{
            const key = el.dataset.i18n;
            const v = lookup(key, lang);
            if (v != null) el.innerHTML = v;
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
            const key = el.dataset.i18nPlaceholder;
            const v = lookup(key, lang);
            if (v != null) el.setAttribute('placeholder', v);
        });

        // update modal close if present
        document.querySelectorAll('[data-i18n-aria]').forEach(el=>{
            const key = el.dataset.i18nAria;
            const v = lookup(key, lang);
            if (v != null) el.setAttribute('aria-label', v);
        });

        // re-render events grid if present (to update localized dates)
        if (window.renderEventsPage) {
            try { window.renderEventsPage(); } catch(e){ /* ignore */ }
        }
    }

    // init: read saved lang or default to document html lang
    const saved = localStorage.getItem('siteLang') || document.documentElement.lang || 'es';
    const sel = document.getElementById('langSelect');
    if (sel) { sel.value = saved; sel.addEventListener('change', (e)=> applyTranslations(e.target.value)); }
    // apply immediately
    applyTranslations(saved);

})();

// --- SCROLL REVEAL PARA ELEMENTOS (.scroll-trigger)
(function timelineScrollReveal(){
    // helper to load timeline image (from data-src)
    function loadTimelineImage(container){
        const imgDiv = container.querySelector('.timeline-img');
        if (!imgDiv) return;
        const src = imgDiv.dataset.src;
        if (!src) return;
        const tmp = new Image();
        tmp.onload = function(){ imgDiv.style.backgroundImage = `url('${src}')`; };
        tmp.onerror = function(){ /* keep placeholder */ };
        tmp.src = src;
    }

    // fallback check when IntersectionObserver is not available
    function onScrollCheck() {
        const triggers = Array.from(document.querySelectorAll('.scroll-trigger'));
        triggers.forEach(el => {
            if (el.classList.contains('visible')) return;
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.85) {
                const idx = parseInt(el.dataset.srIndex || 0, 10);
                el.style.transitionDelay = `${idx * 140}ms`;
                el.classList.add('visible');
                loadTimelineImage(el);
            }
        });
    }

    // If IntersectionObserver is available, create a shared observer and expose
    // a function to observe new elements added later (dynamic content).
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const idx = parseInt(el.dataset.srIndex || 0, 10);
                    el.style.transitionDelay = `${idx * 140}ms`;
                    el.classList.add('visible');
                    loadTimelineImage(el);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

        // expose a helper to observe NodeList / array of elements
        window.observeScrollTriggers = function(elements){
            if (!elements) return;
            const arr = Array.from(elements);
            arr.forEach((el, i) => {
                if (!el.dataset.srIndex) el.dataset.srIndex = i;
                // use a slightly larger stagger so items appear more gently
                // transitionDelay is applied when the element intersects
                io.observe(el);
            });
        };

        // observe any triggers already present on load
        document.addEventListener('DOMContentLoaded', function(){
            const existing = document.querySelectorAll('.scroll-trigger');
            if (existing.length) window.observeScrollTriggers(existing);
        });

        return;
    }

    // Fallback: poll on scroll and on load
    window.addEventListener('scroll', onScrollCheck);
    window.addEventListener('load', onScrollCheck);
    document.addEventListener('DOMContentLoaded', onScrollCheck);
    // expose fallback observer function (no-op but kept for compatibility)
    window.observeScrollTriggers = function(elements){
        // elements will be picked up by onScrollCheck on next scroll/load
        // nothing to do here for the fallback
    };

})();

// --- POSICIONAR PUNTOS DE LA TIMELINE dinámicamente
(function positionTimelineDots(){
    const rows = document.querySelectorAll('.timeline-row');
    if (!rows || rows.length === 0) return;

    function update(){
        rows.forEach(row => {
            const header = row.querySelector('.card-header');
            if (!header) return;
            // calcular la distancia del header respecto al inicio del row
            const top = header.offsetTop + 12; // 12px down from header top
            row.style.setProperty('--dot-top', top + 'px');
        });
    }

    // actualizar en carga y en resize
    window.addEventListener('resize', update);
    // también después de que todas las imágenes hayan cargado
    window.addEventListener('load', update);
    // y una ejecución inicial
    update();
})();

// --- Ajustar hero de equipo con foto 'equipo' si existe
(function setEquipoHero(){
    const hero = document.querySelector('.team-hero');
    if (!hero) return;
    const candidates = ['fotos/equipo.jpg','fotos/equipo.png','fotos/team_group.jpg','fotos/4F3A1709.jpg'];
    (function tryNext(i){
        if (i >= candidates.length) return;
        const img = new Image();
        img.onload = function(){ hero.style.backgroundImage = `url('${candidates[i]}')`; };
        img.onerror = function(){ tryNext(i+1); };
        img.src = candidates[i];
    })(0);
})();

/* --- CAROUSEL Y PÁGINA DE EVENTOS --- */
(function siteExtras(){
    // AÑADE EL AÑO EN EL FOOTER
    const yearEl = document.getElementById('siteYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // CAROUSEL: imágenes (usa imágenes existentes o placeholders)
    const carouselImages = [
        'fotos/sobre_nosotros/2009.png',
        'fotos/sobre_nosotros/2013.png',
        'fotos/sobre_nosotros/2016.png',
        'fotos/sobre_nosotros/2020.png',
        'fotos/sobre_nosotros/2023.png'
    ];

    function buildCarousel(){
        const carousel = document.getElementById('mainCarousel');
        if (!carousel) return;
        const track = carousel.querySelector('.carousel-track');
        if (!track) return;
        // helper to preload and set background with graceful fallback
        function preloadBackground(src, el){
            if (!src) { el.style.background = 'linear-gradient(180deg,#222,#111)'; return; }
            const img = new Image();
            img.onload = function(){ el.style.backgroundImage = `url('${src}')`; };
            img.onerror = function(){ el.style.background = 'linear-gradient(180deg,#222,#111)'; };
            img.src = src;
        }

        carouselImages.forEach(src => {
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            preloadBackground(src, slide);
            track.appendChild(slide);
        });

        let index = 0;
        const slides = track.children;
        const prev = carousel.querySelector('.carousel-btn.prev');
        const next = carousel.querySelector('.carousel-btn.next');

        function go(i){
            index = (i + slides.length) % slides.length;
            track.style.transform = `translateX(-${index * 100}%)`;
        }

        prev.addEventListener('click', ()=> go(index-1));
        next.addEventListener('click', ()=> go(index+1));

        let autoplay = setInterval(()=> go(index+1), 4000);
        carousel.addEventListener('mouseenter', ()=> clearInterval(autoplay));
        carousel.addEventListener('mouseleave', ()=> autoplay = setInterval(()=> go(index+1), 4000));
    }

    buildCarousel();

    // DATOS DE EVENTOS (proporcionados por el usuario)
    const eventsData = [
        { dateText: '12/10/2023', title: 'MotoStudent', desc: 'Nuestro equipo participó en MotoStudent, competición universitaria internacional.', img: 'fotos/events/IMG_6586.heic', sortDate: '2023-10-12', location: 'Ciudad del Motor de Aragón' },
        { dateText: '24/11/2023', title: 'Presentación en Leganés', desc: 'Presentamos la MS7 al alumnado y profesorado del campus de Leganés.', img: 'fotos/events/IMG_6474.heic', sortDate: '2023-11-24', location: 'Campus Leganés, UC3M' },
        { dateText: '17/11/2023', title: 'Presentación en Colmenarejo', desc: 'Presentación del equipo y la MS7 en Colmenarejo.', img: 'fotos/events/image.png', sortDate: '2023-11-17', location: 'Campus Colmenarejo, UC3M' },
        { dateText: '06/03/2024 - 11/03/2024', title: 'AULA (IFEMA)', desc: 'Nos encontrarás del 6 al 11 de marzo en AULA, IFEMA. Ven a ver la MS7 en el stand de la UC3M.', img: 'fotos/events/1371351238420_edited.jpg', sortDate: '2024-03-06', location: 'IFEMA, Madrid' },
        { dateText: '09/04/2024 y 11/04/2024', title: 'Feria de asociaciones', desc: 'Feria de Asociaciones: Leganés y Getafe.', img: 'fotos/events/autopia_apertura-1046x616.jpg', sortDate: '2024-04-09', location: 'Leganés / Getafe' },
        { dateText: '20/04/2024', title: 'Autopía', desc: 'Concentración para amantes del motor: coches, motos y vintage.', img: 'fotos/eventos/autopia.jpeg', sortDate: '2024-04-20', location: 'Madrid' },
        { dateText: '20/04/2024', title: 'Madrid MotorStudent', desc: 'Mostramos nuestras MS4 y MS7.', img: 'fotos/eventos/madrid_motor_student.png', sortDate: '2024-04-20', location: 'Madrid' },
        { dateText: '20-21/11/2024', title: 'Metal Madrid', desc: 'Feria de innovación industrial y materiales avanzados.', img: 'fotos/eventos/metal_madrid.jpg', sortDate: '2024-11-20', location: 'Madrid' },
        { dateText: '23/07/2025', title: 'Testing', desc: 'Jornada de pruebas en circuito; ajustes y telemetría.', img: '', sortDate: '2025-07-23', location: 'Circuito (privado)' }
    ];

    // Renderizar página de eventos si existe (grid + filtros)
    function renderEventsPage(){
        const grid = document.getElementById('eventsGrid');
        const yearFilter = document.getElementById('yearFilter');
        const searchBox = document.getElementById('searchBox');
        if (!grid) return; // without the grid there's nowhere to render

        // ordenar por fecha descendente (más recientes primero)
        const sorted = eventsData.slice().sort((a,b)=> new Date(b.sortDate) - new Date(a.sortDate));

        // extraer años disponibles (si existe el control yearFilter)
        const years = Array.from(new Set(sorted.map(e => new Date(e.sortDate).getFullYear()))).sort((a,b)=> b-a);
        if (yearFilter){
            years.forEach(y=>{
                const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearFilter.appendChild(opt);
            });
        }

        // modal setup
        let modal = document.querySelector('.event-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'event-modal';
            modal.innerHTML = `
                <div class="modal-inner">
                    <div class="modal-img"></div>
                    <div class="modal-body">
                        <button class="close-btn" data-i18n="modal.close">Cerrar</button>
                        <h3 class="modal-title"></h3>
                        <div class="modal-date"></div>
                        <p class="modal-desc"></p>
                    </div>
                </div>`;
            document.body.appendChild(modal);

            // helper to open/close modal and lock body scroll while open
            function openModal() {
                modal.style.display = 'flex';
                // prevent background from scrolling
                document.body.style.overflow = 'hidden';
            }

            function closeModal() {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }

            const closeBtn = modal.querySelector('.close-btn');
            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            // clicking outside the inner content closes
            modal.addEventListener('click', (e)=>{ if (e.target === modal) closeModal(); });

            // expose helpers for use below
            modal._openModal = openModal;
            modal._closeModal = closeModal;
        }

        function renderList(filterYear, query){
            grid.innerHTML = '';
            const filtered = sorted.filter(ev => {
                if (filterYear && filterYear !== 'all'){
                    if (new Date(ev.sortDate).getFullYear().toString() !== filterYear) return false;
                }
                if (query){
                    const q = query.toLowerCase();
                    return (ev.title + ' ' + ev.desc + ' ' + ev.dateText).toLowerCase().includes(q);
                }
                return true;
            });

            filtered.forEach(ev => {
                    const card = document.createElement('article');
                    card.className = 'event-card scroll-trigger';
                const media = document.createElement('div'); media.className = 'event-media';
                const body = document.createElement('div'); body.className = 'event-body';
                // badge: day / month overlay
                const badge = document.createElement('div'); badge.className = 'event-badge';
                try {
                    const d = new Date(ev.sortDate);
                    const pageLang = document.documentElement.lang || localStorage.getItem('siteLang') || 'es';
                    const localeMap = { es: 'es-ES', en: 'en-US' };
                    const day = d.getDate();
                    const month = d.toLocaleString(localeMap[pageLang] || 'es-ES', { month: 'short' }).toUpperCase();
                    badge.innerHTML = `<div class="day">${day}</div><div class="month">${month}</div>`;
                } catch(e){ badge.textContent = ev.dateText; }

                const title = document.createElement('div'); title.className = 'event-title'; title.textContent = ev.title;
                const desc = document.createElement('div'); desc.className = 'event-desc'; desc.textContent = ev.desc;
                const meta = document.createElement('div'); meta.className = 'event-meta';
                // meta lines: fecha y ubicación (con iconos)
                const dateLine = document.createElement('div'); dateLine.className = 'meta-line';
                dateLine.innerHTML = `<i class="far fa-clock"></i><span>${ev.dateText}</span>`;
                meta.appendChild(dateLine);
                if (ev.location){
                    const locLine = document.createElement('div'); locLine.className = 'meta-line';
                    locLine.innerHTML = `<i class="fas fa-map-marker-alt"></i><span>${ev.location}</span>`;
                    meta.appendChild(locLine);
                }

                // preload image
                (function(src, el){
                    if (!src) { el.style.background = 'linear-gradient(180deg,#222,#111)'; return; }
                    const img = new Image();
                    img.onload = function(){ el.style.backgroundImage = `url('${src}')`; };
                    img.onerror = function(){ el.style.background = 'linear-gradient(180deg,#222,#111)'; };
                    img.src = src;
                })(ev.img, media);

                // badge sits on top of media
                media.appendChild(badge);
                body.appendChild(title);
                body.appendChild(desc);
                body.appendChild(meta);
                card.appendChild(media);
                card.appendChild(body);
                grid.appendChild(card);

                card.addEventListener('click', ()=>{
                    const modalImg = modal.querySelector('.modal-img');
                    const modalTitle = modal.querySelector('.modal-title');
                    const modalDate = modal.querySelector('.modal-date');
                    const modalDesc = modal.querySelector('.modal-desc');
                    modalTitle.textContent = ev.title;
                    modalDate.textContent = ev.dateText;
                    modalDesc.textContent = ev.desc;
                        if (ev.img){
                            const img = new Image();
                            img.onload = function(){ modalImg.style.backgroundImage = `url('${ev.img}')`; };
                            img.onerror = function(){ modalImg.style.background = 'linear-gradient(180deg,#ddd,#bbb)'; };
                            img.src = ev.img;
                        } else { modalImg.style.background = 'linear-gradient(180deg,#ddd,#bbb)'; }
                        // use modal helper to open and lock background scroll
                        if (typeof modal._openModal === 'function') modal._openModal(); else modal.style.display = 'flex';
                });
            });
        }

        // initial render
        renderList('all','');
        // If we exposed an observer helper, register the freshly created cards
        if (typeof window.observeScrollTriggers === 'function') {
            // observe all current triggers (event cards have class 'scroll-trigger')
            window.observeScrollTriggers(document.querySelectorAll('.scroll-trigger'));
        }

        // events for controls (attach only if they exist)
        if (yearFilter) yearFilter.addEventListener('change', ()=> renderList(yearFilter.value, searchBox ? searchBox.value : ''));
        if (searchBox) searchBox.addEventListener('input', ()=> renderList(yearFilter ? yearFilter.value : 'all', searchBox.value));
    }

    // expose the renderer so other scripts (i18n) can re-render with locale changes
    window.renderEventsPage = renderEventsPage;
    renderEventsPage();

})();

/* --- MOBILE / TABLET NAV TOGGLE --- */
(function mobileNav(){
    const toggles = Array.from(document.querySelectorAll('.nav-toggle'));
    if (!toggles || toggles.length === 0) return;

    function setAria(btn, expanded){
        btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    }

    toggles.forEach(btn => {
        btn.addEventListener('click', ()=>{
            const isOpen = document.body.classList.toggle('nav-open');
            setAria(btn, isOpen);
        });
    });

    // close menu when clicking a link
    document.addEventListener('click', (e)=>{
        if (!e.target.closest('.navbar')) return;
        if (e.target.tagName.toLowerCase() === 'a'){
            document.body.classList.remove('nav-open');
            toggles.forEach(t=> setAria(t, false));
        }
    });

    // close on escape key
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') { document.body.classList.remove('nav-open'); toggles.forEach(t=> setAria(t,false)); } });
})();