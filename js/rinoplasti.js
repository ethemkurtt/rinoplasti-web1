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

// Simulation: play butonuna basılınca poster gizlenir, YouTube iframe autoplay açılır
(function () {
    function initSimulation() {
        const container = document.getElementById('simulationVideo');
        if (!container) return;
        const playBtn = container.querySelector('.simulation__play');
        if (!playBtn) return;

        playBtn.addEventListener('click', function () {
            if (container.classList.contains('is-playing')) return;

            const iframe = document.createElement('iframe');
            iframe.src = 'https://www.youtube.com/embed/D4hbBa1zUig?autoplay=1&rel=0';
            iframe.title = '3D Simülasyon Video';
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
            iframe.setAttribute('allowfullscreen', '');
            container.appendChild(iframe);
            container.classList.add('is-playing');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSimulation);
    } else {
        initSimulation();
    }
})();

// Steps: hard scroll-lock + burst detection
// - Section view'a girer girmez html+body overflow:hidden (sayfa fiziksel olarak donar)
// - Bir input burst'i (250ms event-free aralık) = 1 aksiyon (1 advance VEYA 1 exit)
//   Momentum scroll boyunca event'ler sadece burst'ü uzatır, ek advance YOK
// - Exit sonrası 600ms re-lock yasağı + 10px overshoot → re-lock döngüsü kırılır
// - Touch: per-session flag (touchstart→touchend arası 1 advance)
(function () {
    function initSteps() {
        const section = document.getElementById('stepsSection');
        if (!section) return;
        const slides = section.querySelectorAll('.steps__slide');
        const dots = section.querySelectorAll('.steps__dot');
        const lineFill = section.querySelector('.steps__line-fill');
        const total = slides.length;
        if (!total) return;

        const BURST_END_DELAY     = 50;   // event-free süre — burst bittikten sonra yeni aksiyon mümkün
        const EXIT_COOLDOWN       = 200;  // exit sonrası re-lock yasağı (ms)
        const LOCK_TOLERANCE      = 25;   // rect.top viewport top'a bu kadar yakınsa lock; daha uzaksa skip
        const EXIT_OVERSHOOT_DOWN = 10;   // aşağı exit'te section bottom + bu kadar (px)
        const EXIT_OVERSHOOT_UP   = LOCK_TOLERANCE + 50; // yukarı exit'te section top - bu kadar; tolerance'tan BÜYÜK olmalı
        const TOUCH_THRESHOLD     = 30;   // touch advance için min hareket (px)

        let currentSlide = 0;
        let isLocked = false;
        let lockedScrollY = 0;
        let exitTime = 0;
        let burstActive = false;
        let burstTimer = null;

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

        // ----- BURST -----
        function bumpBurst() {
            if (burstTimer) clearTimeout(burstTimer);
            burstTimer = setTimeout(function () {
                burstActive = false;
                burstTimer = null;
            }, BURST_END_DELAY);
        }

        // ----- LOCK -----
        function lockBody() {
            if (isLocked) return;
            isLocked = true;
            lockedScrollY = window.scrollY;

            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = scrollbarWidth + 'px';
            }
        }

        function unlockBody(targetScrollY) {
            if (!isLocked) return;
            isLocked = false;

            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';

            if (typeof targetScrollY === 'number') {
                window.scrollTo(0, targetScrollY);
            }
        }

        function advance(direction) {
            if (direction > 0 && currentSlide < total - 1) {
                currentSlide++;
                render();
            } else if (direction < 0 && currentSlide > 0) {
                currentSlide--;
                render();
            }
        }

        function exitDown() {
            exitTime = Date.now();
            unlockBody(lockedScrollY + section.offsetHeight + EXIT_OVERSHOOT_DOWN);
        }

        function exitUp() {
            exitTime = Date.now();
            unlockBody(lockedScrollY - EXIT_OVERSHOOT_UP);
        }

        function checkAndLock() {
            if (isLocked) return;
            if (Date.now() - exitTime < EXIT_COOLDOWN) return;

            const rect = section.getBoundingClientRect();

            // Section view dışı
            if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;

            // Section'ın üstü viewport top'a yakın mı? Değilse lock yapma —
            // yukarıdan aşağı veya aşağıdan yukarı yaklaşırken section üstü 0'a değdiğinde lock.
            // Bu büyük snap'i önler ve exitUp sonrası anlık re-lock'u kırar.
            if (Math.abs(rect.top) > LOCK_TOLERANCE) return;

            if (rect.top !== 0) window.scrollBy(0, rect.top);
            lockBody();
        }

        // Wheel/Key tek aksiyon helper'ı: bir burst içinde 1 kez advance/exit
        function processInput(direction) {
            if (burstActive) { bumpBurst(); return; }
            burstActive = true;
            bumpBurst();

            if (direction > 0 && currentSlide >= total - 1) { exitDown(); return; }
            if (direction < 0 && currentSlide <= 0) { exitUp(); return; }
            advance(direction);
        }

        // ===== WHEEL =====
        function handleWheel(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            e.preventDefault();
            const deltaY = e.deltaY;
            if (deltaY === 0) return;

            processInput(deltaY > 0 ? 1 : -1);
        }

        // ===== TOUCH (per-session 1 advance) =====
        let touchStartY = 0;
        let touchHandled = false;

        function handleTouchStart(e) {
            touchStartY = e.touches[0].clientY;
            touchHandled = false;
        }

        function handleTouchEnd() {
            touchHandled = false;
        }

        function handleTouchMove(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            e.preventDefault();
            if (touchHandled) return;

            const totalDelta = touchStartY - e.touches[0].clientY;
            if (Math.abs(totalDelta) < TOUCH_THRESHOLD) return;

            touchHandled = true;
            const direction = totalDelta > 0 ? 1 : -1;

            if (direction > 0 && currentSlide >= total - 1) { exitDown(); return; }
            if (direction < 0 && currentSlide <= 0) { exitUp(); return; }
            advance(direction);
        }

        // ===== KEYBOARD =====
        function handleKey(e) {
            if (!isLocked) checkAndLock();
            if (!isLocked) return;

            const downKeys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
            const upKeys = ['ArrowUp', 'PageUp'];
            const isDown = downKeys.indexOf(e.key) !== -1;
            const isUp = upKeys.indexOf(e.key) !== -1;
            if (!isDown && !isUp) return;

            e.preventDefault();
            processInput(isDown ? 1 : -1);
        }

        // rAF: lock'ta kayma olursa düzelt + dışarıdayken section'a girişi yakala
        function rafLoop() {
            if (isLocked) {
                if (Math.abs(window.scrollY - lockedScrollY) > 0.5) {
                    window.scrollTo(0, lockedScrollY);
                }
            } else {
                checkAndLock();
            }
            requestAnimationFrame(rafLoop);
        }

        window.addEventListener('scroll', checkAndLock, { passive: true });
        window.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });
        window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
        window.addEventListener('keydown', handleKey);

        requestAnimationFrame(rafLoop);
        render();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSteps);
    } else {
        initSteps();
    }
})();
