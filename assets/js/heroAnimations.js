(function() {
    function initParallax() {
        const hero = document.querySelector('.parallax-hero');
        if (!hero) return;

        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            if (scrollPos <= window.innerHeight) {
                hero.style.backgroundPositionY = `calc(50% + ${scrollPos * 0.4}px)`;
            }
        });
    }

    function initScrollIndicator() {
        const indicator = document.querySelector('.scroll-indicator');
        if (!indicator) return;

        let hidden = false;
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY;
            if (scrollPos > 100 && !hidden) {
                hidden = true;
                indicator.classList.add('is-hidden');
            } else if (scrollPos <= 100 && hidden) {
                hidden = false;
                indicator.classList.remove('is-hidden');
            }
        }, { passive: true });
    }

    function initStaggerReveal() {
        const staggerElements = document.querySelectorAll('.stagger-reveal');
        if (staggerElements.length === 0) return;

        setTimeout(() => {
            staggerElements.forEach(el => el.classList.add('reveal-active'));
        }, 100);
    }

    function initCounters() {
        const counterElements = document.querySelectorAll('.stat-number, .counter-number');
        if (counterElements.length === 0) return;

        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.getAttribute('data-target') || 0, 10);
                    animateValue(el, 0, target, 2000);
                    observer.unobserve(el);
                }
            });
        }, observerOptions);

        counterElements.forEach(el => counterObserver.observe(el));
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            obj.innerHTML = Math.floor(easeOutProgress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end;
            }
        };
        window.requestAnimationFrame(step);
    }

    function initAll() {
        initParallax();
        initScrollIndicator();
        initStaggerReveal();
        initCounters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
