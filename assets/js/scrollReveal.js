/**
 * scrollReveal.js
 * Animaciones automáticas al hacer scroll.
 * Usa IntersectionObserver para detectar elementos entrando al viewport
 * y les aplica una clase CSS que dispara la animación.
 *
 * Selectores animados automáticamente:
 *  - .section-container, .section-title
 *  - .evento-card, .card, .sponsor-card-link
 *  - .sp-feature-card, .sp-text-block, .sp-gallery-item
 *  - .ev-info-card
 *  - Cualquier elemento con [data-reveal]
 */
(function () {
    // Selectores que se animan automáticamente
    const SELECTORS = [
        '.section-title',
        '.evento-card-link',
        '.card',
        '.sponsor-card-link',
        '.sp-feature-card',
        '.sp-text-block',
        '.sp-gallery-item',
        '.ev-info-card',
        '.sp-features-section .sp-section-label',
        '.sp-gallery-section .sp-section-label',
        '.footer-col',
        '[data-reveal]'
    ];

    function init() {
        // Combine all selectors
        const elements = document.querySelectorAll(SELECTORS.join(','));
        if (!elements.length) return;

        // Add hidden state immediately
        elements.forEach((el, i) => {
            el.classList.add('reveal-hidden');
            // Stagger cards within the same parent for cascade effect
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal-hidden'));
                const index = siblings.indexOf(el);
                if (index > 0) {
                    el.style.transitionDelay = `${index * 0.08}s`;
                }
            }
        });

        // Create observer
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, {
            threshold: 0.1,       // Trigger when 10% visible
            rootMargin: '0px 0px -40px 0px'  // Slight offset from bottom
        });

        elements.forEach(el => observer.observe(el));
    }

    // Run after DOM ready and also after a small delay (for dynamically rendered content)
    document.addEventListener('DOMContentLoaded', () => {
        // Immediate init for static content
        init();
        // Delayed init for JS-rendered content (events, sponsors)
        setTimeout(init, 500);
    });
})();
