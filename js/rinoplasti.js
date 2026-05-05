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

// Steps: scroll-jacked dikey slider — section pin durumunda her wheel/touch = 1 slide,
// tüm slide'lar bitmeden section'dan çıkış yok, hızlı scroll'da bile atlama olmaz.
(function () {
    function initSteps() {
        const section = document.getElementById('stepsSection');
        if (!section) return;
        const slides = section.querySelectorAll('.steps__slide');
        const dots = section.querySelectorAll('.steps__dot');
        const lineFill = section.querySelector('.steps__line-fill');
        const total = slides.length;
        if (!total) return;

        const COOLDOWN = 700; // her slide geçişi arası min süre (ms)
        const TOUCH_THRESHOLD = 30; // touch'ta tetikleme için min hareket (px)

        let currentSlide = 0;
        let lastTransition = 0;

        function render() {
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

        // Section viewport'u dolduruyor mu? (üstü ≤ 0 ve altı > 0)
        function isInLockZone() {
            const rect = section.getBoundingClientRect();
            return rect.top <= 0 && rect.bottom > 0;
        }

        // direction: 1 = aşağı, -1 = yukarı. Cooldown geçtiyse slide ilerlet.
        function tryAdvance(direction) {
            const now = Date.now();
            if (now - lastTransition < COOLDOWN) return false;

            if (direction > 0 && currentSlide < total - 1) {
                currentSlide++;
                lastTransition = now;
                render();
                return true;
            } else if (direction < 0 && currentSlide > 0) {
                currentSlide--;
                lastTransition = now;
                render();
                return true;
            }
            return false;
        }

        // Section üstünü viewport top'a hizala (kayma olmuşsa düzelt)
        function pinSectionTop() {
            const rect = section.getBoundingClientRect();
            if (rect.top < 0) {
                window.scrollBy(0, rect.top);
            }
        }

        // ===== WHEEL =====
        function handleWheel(e) {
            if (!isInLockZone()) return;

            const deltaY = e.deltaY;
            if (deltaY === 0) return;

            // Son slide & aşağı scroll → serbest bırak
            if (deltaY > 0 && currentSlide >= total - 1) return;
            // İlk slide & yukarı scroll → serbest bırak
            if (deltaY < 0 && currentSlide <= 0) return;

            // Section'a kilitli — scroll'u engelle
            e.preventDefault();
            pinSectionTop();
            tryAdvance(deltaY > 0 ? 1 : -1);
        }

        // ===== TOUCH =====
        let touchStartY = 0;
        let touchAccum = 0;

        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
            touchAccum = 0;
        }

        function handleTouchMove(e) {
            if (!isInLockZone()) return;

            const touchY = e.touches[0].clientY;
            const totalDelta = touchStartY - touchY;

            // Son slide & aşağı kaydırma → serbest
            if (totalDelta > 0 && currentSlide >= total - 1) return;
            // İlk slide & yukarı kaydırma → serbest
            if (totalDelta < 0 && currentSlide <= 0) return;

            e.preventDefault();
            pinSectionTop();

            // Eşik aşıldıysa 1 slide ilerlet, başlangıcı sıfırla
            if (Math.abs(totalDelta) >= TOUCH_THRESHOLD) {
                if (tryAdvance(totalDelta > 0 ? 1 : -1)) {
                    touchStartY = touchY;
                }
            }
        }

        // ===== KEYBOARD =====
        function handleKey(e) {
            if (!isInLockZone()) return;

            const downKeys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
            const upKeys = ['ArrowUp', 'PageUp'];
            const isDown = downKeys.indexOf(e.key) !== -1;
            const isUp = upKeys.indexOf(e.key) !== -1;
            if (!isDown && !isUp) return;

            if (isDown && currentSlide >= total - 1) return;
            if (isUp && currentSlide <= 0) return;

            e.preventDefault();
            tryAdvance(isDown ? 1 : -1);
        }

        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('keydown', handleKey);

        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteps);
    } else {
        initSteps();
    }
})();
