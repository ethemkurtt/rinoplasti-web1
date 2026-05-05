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

// Steps: scroll-locked dikey slider (wheel/touch tek seferde 1 slide ilerler, 1sn cooldown)
(function () {
    function initSteps() {
        const section = document.getElementById('stepsSection');
        if (!section) return;
        const slides = section.querySelectorAll('.steps__slide');
        const lineFill = section.querySelector('.steps__line-fill');
        const total = slides.length;
        if (!total) return;

        const COOLDOWN = 1000;     // her geçiş arası min 1 saniye
        const RELOCK_DELAY = 600;  // unlock sonrası tekrar lock olabilmesi için min süre

        let currentSlide = 0;
        let lastTransition = 0;
        let isLocked = false;
        let lockedScrollY = 0;
        let lastUnlock = 0;

        const dots = section.querySelectorAll('.steps__dot');

        function update() {
            slides.forEach(function (s, i) {
                s.classList.toggle('is-active', i === currentSlide);
                s.classList.toggle('is-past', i < currentSlide);
            });
            dots.forEach(function (d, i) {
                d.classList.toggle('is-active', i <= currentSlide);
                d.classList.toggle('is-current', i === currentSlide);
            });
            if (lineFill) {
                const pct = total > 1 ? (currentSlide / (total - 1)) * 100 : 100;
                lineFill.style.height = pct + '%';
            }
        }

        function getScrollbarWidth() {
            return window.innerWidth - document.documentElement.clientWidth;
        }

        function lock() {
            if (isLocked) return;
            isLocked = true;
            lockedScrollY = window.scrollY;
            const sbw = getScrollbarWidth();
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            if (sbw > 0) document.body.style.paddingRight = sbw + 'px';
        }

        function unlock(direction) {
            if (!isLocked) return;
            isLocked = false;
            lastUnlock = Date.now();
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            // Section'ı tamamen geç (relock olmasın)
            if (direction === 'down') {
                window.scrollTo(0, lockedScrollY + window.innerHeight + 2);
            } else if (direction === 'up') {
                window.scrollTo(0, Math.max(0, lockedScrollY - 2));
            }
        }

        function maybeLock() {
            if (isLocked) return;
            if (Date.now() - lastUnlock < RELOCK_DELAY) return;
            const rect = section.getBoundingClientRect();
            const vh = window.innerHeight;
            // Section viewport'u tamamen kapsadığında lock
            if (rect.top <= 1 && rect.bottom >= vh - 1) {
                // Kesin alignment için snap
                window.scrollTo(0, window.scrollY + rect.top);
                lock();
                update();
            }
        }

        function step(dir) {
            if (!isLocked) return;
            const now = Date.now();
            if (now - lastTransition < COOLDOWN) return;

            if (dir > 0) {
                if (currentSlide < total - 1) {
                    currentSlide++;
                    lastTransition = now;
                    update();
                } else {
                    unlock('down');
                }
            } else {
                if (currentSlide > 0) {
                    currentSlide--;
                    lastTransition = now;
                    update();
                } else {
                    unlock('up');
                }
            }
        }

        window.addEventListener('scroll', maybeLock, { passive: true });

        // Wheel
        window.addEventListener('wheel', function (e) {
            if (!isLocked) return;
            e.preventDefault();
            // Çok küçük delta'ları yok say (trackpad mikro hareket)
            if (Math.abs(e.deltaY) < 4) return;
            step(e.deltaY > 0 ? 1 : -1);
        }, { passive: false });

        // Touch
        let touchStartY = 0;
        window.addEventListener('touchstart', function (e) {
            if (!isLocked) return;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', function (e) {
            if (!isLocked) return;
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', function (e) {
            if (!isLocked) return;
            const endY = e.changedTouches[0].clientY;
            const delta = touchStartY - endY;
            if (Math.abs(delta) > 50) {
                step(delta > 0 ? 1 : -1);
            }
        }, { passive: true });

        // Klavye desteği
        window.addEventListener('keydown', function (e) {
            if (!isLocked) return;
            if (e.key === 'ArrowDown' || e.key === 'PageDown') {
                e.preventDefault();
                step(1);
            } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
                e.preventDefault();
                step(-1);
            }
        });

        update();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteps);
    } else {
        initSteps();
    }
})();
