document.addEventListener('DOMContentLoaded', () => {
    
    const pressGrid = document.getElementById('press-grid');
    const mediaGallery = document.getElementById('media-gallery');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Crear Modal
    const modal = document.createElement('div');
    modal.className = 'media-modal';
    modal.innerHTML = `
        <button class="media-modal-close" id="media-modal-close">
            <i data-lucide="x"></i>
        </button>
        <div class="media-modal-content" id="media-modal-content"></div>
    `;
    document.body.appendChild(modal);

    const modalContent = document.getElementById('media-modal-content');
    const modalClose = document.getElementById('media-modal-close');

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
        modalContent.innerHTML = ''; // Limpiar para detener vídeos
    });

    modal.addEventListener('click', (e) => {
        if(e.target === modal) {
            modal.classList.remove('active');
            modalContent.innerHTML = '';
        }
    });

    // Datos integrados para evitar errores de CORS en file:///
    const mediaData = {
        "press": [
            {
                "id": "p1",
                "title": "Los estudiantes de la Carlos III presentan su nueva moto de competición MS8",
                "outlet": "Cadena SER",
                "date": "27 Feb 2026",
                "excerpt": "La asociación MotoMaqLab UC3M presenta su prototipo más reciente, desarrollado íntegramente por los estudiantes durante dos años.",
                "img": "assets/img/prensa/ser_cover_new.jpg",
                "url": "https://cadenaser.com/cmadrid/2026/02/27/asi-es-la-nueva-moto-de-competicion-creada-por-estudiantes-de-la-uc3m-ser-madrid-sur/"
            },
            {
                "id": "p2",
                "title": "Estudiantes de la UC3M presentan su nueva moto de competición, la MS8",
                "outlet": "Al Cabo de la Calle",
                "date": "27 Feb 2026",
                "excerpt": "El equipo universitario MotoMaqLab de la Universidad Carlos III desvela su nueva motocicleta para la competición MotoStudent.",
                "img": "assets/img/prensa/alcabo_cover_new.jpg",
                "url": "https://alcabodelacalle.es/municipios/estudiantes-de-la-uc3m-presentan-su-nueva-moto-de-competicion-la-ms8/"
            },
            {
                "id": "p3",
                "title": "La UC3M presenta en Leganés su nueva moto de competición tras competir en MotorLand Aragón",
                "outlet": "Leganés Activo",
                "date": "24 Feb 2026",
                "excerpt": "Los estudiantes de la Universidad Carlos III muestran su nuevo prototipo fabricado íntegramente por ellos mismos en el campus de Leganés.",
                "img": "assets/img/prensa/leganes_cover_new.jpg",
                "url": "https://leganesactivo.com/2026/02/24/presentan-moto-de-competicion-ms8-de-la-uc3m-leganes/"
            },
            {
                "id": "p4",
                "title": "MotoMaqLab en el Canal 24 Horas",
                "outlet": "RTVE 24h",
                "date": "14 Mar 2024",
                "excerpt": "Aparición del equipo MotoMaqLab en las noticias del Canal 24 Horas de RTVE explicando el proyecto y la fabricación de la MS8.",
                "img": "assets/img/hero/patrocinadores.webp",
                "url": "assets/img/prensa/tv_24h.mp4"
            }
        ],
        "gallery": [
            { "id": "g1", "type": "photo", "title": "Test en Circuito del Jarama", "src": "assets/img/timeline/2025.webp" },
            { "id": "g2", "type": "3d", "title": "Render Chasis MS8", "src": "assets/img/timeline/2018.webp" },
            { "id": "g3", "type": "photo", "title": "Ajustes de telemetría", "src": "assets/img/timeline/2021.webp" },
            { "id": "g4", "type": "video", "title": "Equipo MotoMaqLab en Excent Showcase", "src": "assets/img/motostudent/ms1_showcase.mp4" },
            { "id": "g5", "type": "photo", "title": "Aerodinámica frontal", "src": "assets/img/timeline/2025.webp" },
            { "id": "g6", "type": "photo", "title": "Equipo completo MotorLand", "src": "assets/img/timeline/2021.webp" },
            { "id": "g7", "type": "video", "title": "Team Edit Vertical", "src": "assets/img/equipo/team_edit.mp4" },
            { "id": "g8", "type": "video", "title": "Aparición en Canal 24h", "src": "assets/img/prensa/tv_24h.mp4" },
            { "id": "g9", "type": "photo", "title": "Post Addyx Chasis", "src": "assets/img/patrocinios/addyx/montado.webp", "url": "https://www.instagram.com/p/DYSe5-gsh34/" }
        ]
    };

    // Renderizar directamente
    renderPress(mediaData.press);
    renderGallery(mediaData.gallery);
    if (window.lucide) lucide.createIcons();

    function renderPress(pressData) {
        if (!pressGrid) return;
        pressGrid.innerHTML = '';
        pressData.forEach(item => {
            const article = document.createElement('a');
            article.className = 'press-card stagger-reveal';
            article.href = item.url;
            article.target = '_blank';
            article.innerHTML = `
                <div class="press-card__img">
                    <img src="${item.img}" alt="${item.title}" loading="lazy">
                </div>
                <div class="press-card__content">
                    <span class="press-card__meta">${item.outlet} &bull; ${item.date}</span>
                    <h3>${item.title}</h3>
                    <p>${item.excerpt}</p>
                </div>
            `;
            pressGrid.appendChild(article);
        });
    }

    function renderGallery(galleryData) {
        if (!mediaGallery) return;
        mediaGallery.innerHTML = '';
        galleryData.forEach(item => {
            const div = document.createElement('div');
            div.className = `gallery-item stagger-reveal ${item.type}`;
            div.dataset.type = item.type;
            
            let icon = '';
            let mediaHtml = '';

            if (item.type === 'video') {
                icon = '<div class="media-icon"><i data-lucide="play"></i></div>';
                mediaHtml = `<video src="${item.src}" muted loop playsinline></video>`;
                
                // Play on hover for video thumbnails
                div.addEventListener('mouseenter', () => {
                    const v = div.querySelector('video');
                    if(v) v.play();
                });
                div.addEventListener('mouseleave', () => {
                    const v = div.querySelector('video');
                    if(v) { v.pause(); v.currentTime = 0; }
                });
            } else if (item.type === '3d') {
                icon = '<div class="media-icon"><i data-lucide="box"></i></div>';
                mediaHtml = `<img src="${item.thumb || item.src}" alt="${item.title}" loading="lazy">`;
            } else {
                mediaHtml = `<img src="${item.src}" alt="${item.title}" loading="lazy">`;
            }
            
            // Add external link icon if it has a URL
            if (item.url && item.type !== 'video' && item.type !== '3d') {
                icon = '<div class="media-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></div>';
            }

            div.innerHTML = `
                ${mediaHtml}
                ${icon}
                <div class="gallery-overlay">
                    <h4>${item.title}</h4>
                </div>
            `;

            // Clic para abrir modal o enlace externo
            div.addEventListener('click', () => {
                if (item.url) {
                    window.open(item.url, '_blank');
                    return;
                }
                modalContent.innerHTML = '';
                if (item.type === 'video') {
                    modalContent.innerHTML = `<video src="${item.src}" controls autoplay style="max-height: 85vh; max-width: 100%; object-fit: contain;"></video>`;
                } else {
                    modalContent.innerHTML = `<img src="${item.src}" style="width:100%">`;
                }
                modal.classList.add('active');
            });

            mediaGallery.appendChild(div);
        });
    }

    // Filtrado de Galería
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar clase active
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;
            const items = document.querySelectorAll('.gallery-item');

            items.forEach(item => {
                if (filter === 'all' || item.dataset.type === filter) {
                    item.classList.remove('hide');
                    // Reset stagger reveal animation by removing and re-adding class
                    item.classList.remove('reveal-active');
                    setTimeout(() => item.classList.add('reveal-active'), 50);
                } else {
                    item.classList.add('hide');
                    item.classList.remove('reveal-active');
                }
            });
        });
    });


    // Instagram Grid (Mock Data for now)
    const igGrid = document.getElementById('ig-grid');
    if (igGrid) {
        const mockData = [
            { "id": "ig1", "type": "photo", "likes": 1250, "comments": 84, "src": "assets/img/ig_cache/post_1.jpg", "url": "https://www.instagram.com/p/DYmN6WBNN8J/" },
            { "id": "ig2", "type": "photo", "likes": 562, "comments": 12, "src": "assets/img/ig_cache/post_2.jpg", "url": "https://www.instagram.com/p/DYZXW9kDfTj/" },
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
    }
});