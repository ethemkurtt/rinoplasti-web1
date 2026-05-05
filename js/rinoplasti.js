// Rinoplasti Landing Page Scripts

// Header: Elementor wrapper'ından koparıp body'e taşı + scroll animasyonu
(function () {
    function initHeader() {
        const header = document.getElementById('siteHeader');
        if (!header) return;

        if (header.parentElement !== document.body) {
            document.body.appendChild(header);
        }

        const triggerPoint = 120;

        function onScroll() {
            if (window.scrollY > triggerPoint) {
                header.classList.add('is-fixed');
            } else {
                header.classList.remove('is-fixed');
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeader);
    } else {
        initHeader();
    }
})();

// Stats: 0'dan hedefe sayma animasyonu (görünür olunca tetiklenir)
(function () {
    function initCounters() {
        const counters = document.querySelectorAll('.stat__num');
        if (!counters.length) return;

        function fmt(n, format) {
            if (format === 'dot') {
                return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            }
            return n.toString();
        }

        function animate(el) {
            const target = parseInt(el.dataset.target, 10) || 0;
            const suffix = el.dataset.suffix || '';
            const format = el.dataset.format || '';
            const duration = 1800;
            const start = performance.now();

            function tick(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(target * eased);
                el.textContent = fmt(current, format) + suffix;
                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = fmt(target, format) + suffix;
                }
            }
            requestAnimationFrame(tick);
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animate);
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        counters.forEach(function (c) { observer.observe(c); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCounters);
    } else {
        initCounters();
    }
})();

// Results slider: ok butonuna tıklayınca yatay scroll
(function () {
    function initResultsSlider() {
        const track = document.getElementById('ekResultsTrack');
        const next = document.querySelector('.ek-results__arrow--next');
        if (!track || !next) return;

        next.addEventListener('click', function () {
            const step = track.clientWidth * 0.7;
            const max = track.scrollWidth - track.clientWidth;
            if (track.scrollLeft >= max - 8) {
                track.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                track.scrollBy({ left: step, behavior: 'smooth' });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initResultsSlider);
    } else {
        initResultsSlider();
    }
})();
