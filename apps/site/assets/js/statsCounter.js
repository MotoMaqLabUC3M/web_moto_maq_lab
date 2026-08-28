/**
 * statsCounter.js
 * Anima los números del contador de estadísticas cuando entran al viewport.
 * Usa IntersectionObserver para disparar la animación una sola vez.
 * Lee el valor objetivo de data-target y cuenta de 0 hasta ese valor.
 */
(function () {
    function animateCounter(el) {
        const target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;

        const duration = 1800; // ms
        const startTime = performance.now();

        // Easing: decelerate towards the end
        function easeOut(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const value = Math.round(easeOut(progress) * target);

            el.textContent = value;

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }

    function init() {
        const counters = document.querySelectorAll('.stat-number[data-target]');
        if (!counters.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        counters.forEach(el => observer.observe(el));
    }

    document.addEventListener('DOMContentLoaded', init);
})();
