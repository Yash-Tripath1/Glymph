/* ============================================================
   GLYMPH STUDIO — main.js
   GSAP + ScrollTrigger + Draggable + Lenis
   Custom bolt cursor · draggable stickers · magnetic UI
   Everything degrades gracefully if a CDN fails.
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const gsap = window.gsap;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (min, max, v) => Math.max(min, Math.min(max, v));

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
  const ST = window.ScrollTrigger;

  /* ---------------------------------------------------------
     1. PRELOADER
     --------------------------------------------------------- */
  const body = document.body;
  body.classList.add('is-loading');
  const loader = $('#loader');
  const pctEl = $('#pct'), msgEl = $('#bootmsg');
  const bootMsgs = ['initialising', 'loading pixels', 'waking the devs', 'compiling the sauce', 'almost peak'];
  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(100, pct + Math.random() * 9 + 3);
    if (pctEl) pctEl.textContent = Math.round(pct);
    if (msgEl) msgEl.textContent = bootMsgs[Math.min(bootMsgs.length - 1, Math.floor(pct / 21))];
  }, 90);

  let loaderDone = false;
  function killLoader() {
    if (loaderDone) return;
    loaderDone = true;
    clearInterval(tick);
    if (pctEl) pctEl.textContent = 100;
    setTimeout(() => {
      body.classList.remove('is-loading');
      if (loader) { loader.classList.add('is-done'); setTimeout(() => loader.remove(), 700); }
      heroIntro();
    }, 260);
  }
  window.addEventListener('load', () => setTimeout(killLoader, 700));
  setTimeout(killLoader, 2800);
  loader && loader.addEventListener('click', killLoader);

  /* ---------------------------------------------------------
     2. SMOOTH SCROLL
     --------------------------------------------------------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new window.Lenis({ duration: 1.15, lerp: 0.09, smoothWheel: true, touchMultiplier: 1.6 });
    if (hasGSAP && ST) {
      lenis.on('scroll', ST.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollTo = (target, offset = -10) => {
    if (lenis) lenis.scrollTo(target, { offset });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollTo(t);
    });
  });

  /* ---------------------------------------------------------
     3. HERO INTRO
     --------------------------------------------------------- */
  const logo = $('.hero__logo');
  function heroIntro() {
    if (logo) logo.classList.add('is-in');
    if (!hasGSAP || reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from('.hero__logo', { scale: .65, opacity: 0, duration: 1 })
      .from('.wordmark .char', { yPercent: 120, opacity: 0, rotate: 9, duration: 1.15, stagger: .06 }, '-=.7')
      .from('.hero__sub', { y: 18, opacity: 0, duration: .8 }, '-=.75')
      .from('.sticker', {
        scale: 0, opacity: 0, rotation: () => gsap.utils.random(-40, 40),
        duration: 1.1, stagger: { each: .07, from: 'random' }, ease: 'back.out(1.8)'
      }, '-=.9')
      .from('.hero__scroll', { opacity: 0, y: 14, duration: .6 }, '-=.4');
  }
  setTimeout(() => logo && logo.classList.add('is-in'), 3000);

  /* ---------------------------------------------------------
     4. STICKERS — wrap, float, parallax, DRAG
     --------------------------------------------------------- */
  const stickers = $$('.sticker');
  console.log('Found stickers:', stickers.length);

  stickers.forEach((s) => {
    const drag = document.createElement('div');
    drag.className = 'sticker__drag';
    while (s.firstChild) drag.appendChild(s.firstChild);
    s.appendChild(drag);
  });
  console.log('Sticker wrappers created');

  if (hasGSAP && !reduced) {
    // gentle float (on the artwork, so dragging can own the wrapper)
    stickers.forEach((s, i) => {
      const inner = s.querySelector('.sticker__drag > *');
      if (!inner) return;
      gsap.to(inner, {
        y: gsap.utils.random(-16, -8),
        rotation: '+=' + gsap.utils.random(1.5, 4).toFixed(2),
        duration: gsap.utils.random(2.6, 4.4),
        repeat: -1, yoyo: true, ease: 'sine.inOut', delay: i * .12
      });
    });

    // mouse parallax (on the outer wrapper)
    if (finePointer) {
      const setters = stickers.map((s) => ({
        x: gsap.quickTo(s, 'x', { duration: .9, ease: 'power3.out' }),
        y: gsap.quickTo(s, 'y', { duration: .9, ease: 'power3.out' }),
        d: parseFloat(s.dataset.depth || 20)
      }));
      window.addEventListener('mousemove', (e) => {
        const nx = (e.clientX / innerWidth - .5) * 2;
        const ny = (e.clientY / innerHeight - .5) * 2;
        setters.forEach((s) => { s.x(-nx * s.d); s.y(-ny * s.d); });
      }, { passive: true });
    }

    // DRAG IT - with fallback check
    const initDraggable = () => {
      if (!window.Draggable) {
        console.warn('Draggable not loaded yet, retrying...');
        setTimeout(initDraggable, 100);
        return;
      }

      console.log('Draggable is available, initializing...');
      gsap.registerPlugin(window.Draggable);

      const hint = $('.dragme');
      stickers.forEach((s) => {
        const drag = s.querySelector('.sticker__drag');
        const inner = drag && drag.firstElementChild;
        let px = 0, py = 0, vx = 0, vy = 0;

        window.Draggable.create(drag, {
          type: 'x,y',
          bounds: 'body', // Changed from '.hero' to allow more movement
          edgeResistance: .65,
          dragClickables: true,
          minimumMovement: 2,
          zIndexBoost: true,
          inertia: true,
          allowNativeTouchScrolling: false,
          onPress() {
            console.log('Sticker pressed!');
            stickers.forEach((o) => { o.style.zIndex = ''; });
            s.style.zIndex = 60;
            s.classList.add('is-dragging');
            px = this.x; py = this.y;
            gsap.to(inner, { scale: 1.07, duration: .25, ease: 'power2.out' });
            if (hint) { gsap.to(hint, { opacity: 0, scale: .6, duration: .3, onComplete: () => hint.remove() }); }
          },
          onDrag() {
            vx = this.x - px; vy = this.y - py;
            px = this.x; py = this.y;
          },
          onRelease() {
            const d = this;
            s.classList.remove('is-dragging');
            gsap.to(inner, { scale: 1, duration: .6, ease: 'elastic.out(1,.55)' });
            gsap.to(inner, { rotation: '+=6', duration: .13, yoyo: true, repeat: 1, ease: 'sine.inOut' });
            // hand-rolled momentum (InertiaPlugin is a paid plugin)
            const tx = d.x + vx * 5, ty = d.y + vy * 5;
            gsap.to(drag, {
              x: tx,
              y: ty,
              duration: 0.8, ease: 'power2.out'
            });
          }
        });
      });
    };

    // Try to initialize draggable
    if (window.Draggable) {
      initDraggable();
    } else {
      console.log('Draggable not available yet, waiting...');
      setTimeout(initDraggable, 200);
    }
  } else {
    $$('.dragme').forEach((h) => h.remove());
  }

  /* ---------------------------------------------------------
     5. CUSTOM CURSOR (the bolt) + trail
     --------------------------------------------------------- */
  const cursor = $('#cursor');
  const canvas = $('#trail');

  if (cursor && finePointer && !reduced) {
    body.classList.add('has-cursor');
    const bolt = cursor.querySelector('.cursor__bolt');
    const ring = cursor.querySelector('.cursor__ring');
    const label = cursor.querySelector('.cursor__label');
    let lastX = innerWidth / 2, first = true;

    const bx = hasGSAP ? gsap.quickTo(bolt, 'x', { duration: .1, ease: 'power3' }) : null;
    const by = hasGSAP ? gsap.quickTo(bolt, 'y', { duration: .1, ease: 'power3' }) : null;
    const br = hasGSAP ? gsap.quickTo(bolt, 'rotation', { duration: .4, ease: 'power2' }) : null;
    const rx = hasGSAP ? gsap.quickTo(ring, 'x', { duration: .5, ease: 'power3' }) : null;
    const ry = hasGSAP ? gsap.quickTo(ring, 'y', { duration: .5, ease: 'power3' }) : null;
    const lx = hasGSAP ? gsap.quickTo(label, 'x', { duration: .22, ease: 'power3' }) : null;
    const ly = hasGSAP ? gsap.quickTo(label, 'y', { duration: .22, ease: 'power3' }) : null;

    const move = (x, y) => {
      if (hasGSAP) { bx(x); by(y); rx(x); ry(y); lx(x); ly(y); }
      else {
        bolt.style.transform = ring.style.transform = label.style.transform = `translate(${x}px,${y}px)`;
      }
    };

    window.addEventListener('mousemove', (e) => {
      move(e.clientX, e.clientY);
      if (!first && br) br(clamp(-32, 32, (e.clientX - lastX) * 1.7));
      lastX = e.clientX; first = false;
    }, { passive: true });

    window.addEventListener('mousedown', () => {
      cursor.classList.add('is-down');
      if (hasGSAP) gsap.to(bolt, { scale: .78, duration: .16, ease: 'power2.out' });
    });
    window.addEventListener('mouseup', () => {
      cursor.classList.remove('is-down');
      if (hasGSAP) gsap.to(bolt, { scale: 1, duration: .35, ease: 'back.out(2)' });
    });
    document.addEventListener('mouseleave', () => { cursor.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = 1; });

    const HOT = '[data-cursor],a,button,[data-flip]';
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest && e.target.closest(HOT);
      if (!t) { cursor.classList.remove('is-hot'); return; }
      cursor.classList.add('is-hot');
      let txt = t.dataset ? t.dataset.cursor : '';
      if (!txt) txt = t.tagName === 'A' ? 'open' : '';
      label.textContent = txt;
    });
    document.addEventListener('mouseout', (e) => {
      const to = e.relatedTarget;
      if (!to || !to.closest || !to.closest(HOT)) cursor.classList.remove('is-hot');
    });
  }

  // trail
  if (canvas && finePointer && !reduced) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener('resize', size);

    const parts = [];
    let drawing = false;
    window.addEventListener('mousemove', (e) => {
      parts.push({ x: e.clientX, y: e.clientY, life: 1, s: 1.6 + Math.random() * 3.4, c: Math.random() });
      if (parts.length > 80) parts.shift();
      if (!drawing) { drawing = true; requestAnimationFrame(tick2); }
    }, { passive: true });

    function tick2() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= .032;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const a = p.life * .5;
        ctx.fillStyle = p.c > .86 ? `rgba(255,59,47,${a})` : (p.c > .78 ? `rgba(45,91,255,${a})` : `rgba(255,255,255,${a})`);
        const s = p.s * p.life;
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      if (parts.length) requestAnimationFrame(tick2);
      else { drawing = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
  }

  /* ---------------------------------------------------------
     6. CLICK RIPPLE
     --------------------------------------------------------- */
  if (hasGSAP && !reduced) {
    window.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sticker')) return;
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      body.appendChild(r);
      gsap.fromTo(r, { scale: .2, opacity: 1 }, { scale: 1.4, opacity: 0, duration: .7, ease: 'power2.out', onComplete: () => r.remove() });
    });
  }

  /* ---------------------------------------------------------
     7. HEADER behaviour + mobile menu
     --------------------------------------------------------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  let menuOpen = false;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    body.classList.add('menu-open');
    nav.classList.remove('is-hidden');
    lenis && lenis.stop();
    if (hasGSAP) {
      gsap.fromTo('.menu__nav a', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .07, ease: 'expo.out', delay: .1 });
      gsap.fromTo('.menu__foot', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .6, delay: .45, ease: 'expo.out' });
    }
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    body.classList.remove('menu-open');
    lenis && lenis.start();
  }
  burger && burger.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));
  $('#menuClose') && $('#menuClose').addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  let prevY = window.scrollY;
  const bar = $('.progress span');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-solid', y > 30);
      if (!menuOpen) nav.classList.toggle('is-hidden', y > prevY && y > 320);
    }
    if (bar) {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? clamp(0, 1, y / h) : 0})`;
    }
    prevY = y;
  }, { passive: true });

  // active nav link
  const navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['thesis', 'team', 'work', 'contact'].forEach((id) => { const el = document.getElementById(id); el && io.observe(el); });
  }

  /* ---------------------------------------------------------
     8. MARQUEES (scroll-reactive)
     --------------------------------------------------------- */
  const marquees = $$('[data-marquee]');
  const mTweens = [];
  if (hasGSAP && !reduced && marquees.length) {
    marquees.forEach((t, i) => {
      t.style.animation = 'none';
      mTweens.push(i % 2
        ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, duration: 34, ease: 'none', repeat: -1 })
        : gsap.fromTo(t, { xPercent: 0 }, { xPercent: -50, duration: 26, ease: 'none', repeat: -1 }));
    });
  }

  // scroll velocity → marquee speed + cheeky skew
  let vel = 0, lastScroll = window.scrollY, ts = 1;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    vel = y - lastScroll; lastScroll = y;
  }, { passive: true });

  const skewOK = hasGSAP && !reduced && finePointer && innerWidth >= 900;
  const sPanels = skewOK ? gsap.quickTo('.panels', 'skewY', { duration: .6, ease: 'power3' }) : null;
  const sCards = skewOK ? gsap.quickTo('.cards', 'skewY', { duration: .6, ease: 'power3' }) : null;

  if (hasGSAP && !reduced) {
    gsap.ticker.add(() => {
      vel *= .92;
      const target = clamp(-3.5, 3.5, 1 + vel * .06);
      ts += (target - ts) * .12;
      mTweens.forEach((t) => t.timeScale(ts));
      if (sPanels) { const s = clamp(-2, 2, vel * .05); sPanels(s); sCards(-s * .7); }
    });
  }

  /* ---------------------------------------------------------
     9. SPLIT TEXT + SCROLL REVEALS
     --------------------------------------------------------- */
  function split(el) {
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        Array.from(n.textContent).forEach((ch) => {
          if (ch === ' ') { el.appendChild(document.createTextNode(' ')); return; }
          if (ch === '\n') return;
          const o = document.createElement('span'); o.className = 'ch';
          const i = document.createElement('span'); i.className = 'ch__i'; i.textContent = ch;
          o.appendChild(i); el.appendChild(o);
        });
      } else el.appendChild(n.cloneNode(true));
    });
    return Array.from(el.querySelectorAll('.ch__i'));
  }

  if (hasGSAP && ST && !reduced) {
    $$('[data-split]').forEach((el) => {
      const chars = split(el);
      gsap.from(chars, {
        yPercent: 118, opacity: 0, duration: 1, ease: 'expo.out', stagger: .022,
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    gsap.from($$('.thesis__line .word'), {
      yPercent: 115, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .045,
      scrollTrigger: { trigger: '.thesis', start: 'top 62%' }
    });

    $$('.shead__num, .shead__note, .team__foot').forEach((el) => {
      gsap.from(el, { y: 24, opacity: 0, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
    });

    gsap.from('.panel', {
      y: 90, opacity: 0, rotate: (i) => [-4, 3, -2][i] || 0, scale: .94,
      duration: 1.15, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.panels', start: 'top 82%' }
    });

    gsap.from('.card', {
      y: 80, opacity: 0, scale: .95, duration: 1, ease: 'expo.out', stagger: .1,
      scrollTrigger: { trigger: '.cards', start: 'top 85%' }
    });

    gsap.from('.contact__title', {
      yPercent: 45, opacity: 0, duration: 1.2, ease: 'expo.out',
      scrollTrigger: { trigger: '.contact', start: 'top 75%' }
    });
    gsap.from(['.mail', '.socials'], {
      y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: '.mail', start: 'top 92%' }
    });

    gsap.to('.hero__inner', {
      y: -90, opacity: .25, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.stickers', {
      y: -140, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.contact__mark', {
      rotate: 22, y: -40, ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'bottom top', scrub: true }
    });

    window.addEventListener('load', () => ST.refresh());
    setTimeout(() => ST.refresh(), 1200);
  }

  /* ---------------------------------------------------------
     10. PANEL 3D TILT
     --------------------------------------------------------- */
  const panels = $$('.panel');
  if (hasGSAP && finePointer && innerWidth > 900 && !reduced) {
    panels.forEach((p) => {
      const rx = gsap.quickTo(p, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(p, 'rotationY', { duration: .6, ease: 'power3' });
      const ty = gsap.quickTo(p, 'y', { duration: .6, ease: 'power3' });
      p.addEventListener('pointermove', (e) => {
        const r = p.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        rx(-py * 9); ry(px * 13); ty(-10);
      });
      p.addEventListener('pointerleave', () => { rx(0); ry(0); ty(0); });
    });
  }

  /* ---------------------------------------------------------
     11. CARDS — spotlight, tap-flip, locked links
     --------------------------------------------------------- */
  $$('.card').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });
  $$('[data-flip]').forEach((card) => {
    const toggle = () => card.classList.toggle('is-flipped');
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
  $$('[data-locked]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      a.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }],
        { duration: 320, easing: 'ease-out' }
      );
    });
  });

  /* ---------------------------------------------------------
     12. MAGNETIC ELEMENTS
     --------------------------------------------------------- */
  if (hasGSAP && finePointer && !reduced) {
    $$('[data-magnetic]').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        // clamped so wide elements can never slide out from under the pointer
        x(clamp(-16, 16, (e.clientX - (r.left + r.width / 2)) * .35));
        y(clamp(-12, 12, (e.clientY - (r.top + r.height / 2)) * .55));
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ---------------------------------------------------------
     13. EMAIL COPY + BACK TO TOP
     --------------------------------------------------------- */
  const mail = $('.mail'), copied = $('.mail__copied');
  if (mail && copied) {
    mail.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(mail.dataset.copy || ''); } catch (_) {}
      copied.classList.add('is-on');
      setTimeout(() => copied.classList.remove('is-on'), 1600);
    });
  }
  const toTop = $('#toTop');
  toTop && toTop.addEventListener('click', () => scrollTo(0));

  /* ---------------------------------------------------------
     14. TERMINAL SYSTEM
     --------------------------------------------------------- */
  const terminalOverlay = $('#terminalOverlay');
  const terminalInput = $('#terminalInput');
  const terminalOutput = $('#terminalOutput');
  const terminalClose = $('#terminalClose');
  const terminalFab = $('#terminalFab');
  const terminalSticker = $('.sticker--terminal');

  let terminalHistory = [];
  let historyIndex = -1;
  let isTerminalOpen = false;

  const commands = {
    help: () => `<span class="info">Available commands:
  help      - show this help
  whoami    - who are you?
  coffee    - brew some coffee
  ping      - test connection
  sudo      - try elevated access
  ls        - list files
  cat       - read a file
  git       - check git status
  npm       - run dev server
  clear     - clear terminal
  exit      - close terminal</span>`,

    whoami: () => `<span class="success">You're a visitor. We're Glymph. Nice to meet you.</span>`,

    coffee: () => `<span class="ascii">
    (  (
     )  )
  ........
  |      |]
  \\      /
   \`----'
</span><span class="success">☕ Coffee brewed! +10 productivity</span>`,

    ping: () => {
      const latency = Math.floor(Math.random() * 50);
      return `<span class="success">PONG! 3 devs online. ${latency}ms latency to coffee machine.</span>`;
    },

    'ping glymph.studio': () => commands.ping(),

    sudo: (args) => {
      if (args.includes('make me a sandwich')) {
        return `<span class="error">Nice try. Make it yourself.</span>`;
      }
      return `<span class="error">sudo: access denied. You're not in the sudoers file. This incident will be reported.</span>`;
    },

    ls: () => `<span class="info">volt.rs
halftone.ts
signal.go
README.md
coffee.sh
dreams.txt</span>`,

    cat: (args) => {
      if (args.includes('README.md') || args.includes('readme')) {
        return `<span class="success"># GLYMPH STUDIO

We build things people say are too hard to build yet.

## Mission
No templates. No shortcuts. Just three devs from India
shipping code that shouldn't exist.

## Status
⚡ Always shipping
🚀 Never sleeping
☕ Forever caffeinated</span>`;
      }
      if (args.includes('dreams.txt')) {
        return `<span class="info">- Make Rust run in a browser (wait, WASM did that)
- Build a comic engine (we're on it)
- Sub-100ms realtime (working on it)
- Change the world (in progress...)</span>`;
      }
      return `<span class="error">cat: ${args[0] || 'file'}: No such file or directory</span>`;
    },

    git: (args) => {
      if (args.includes('status')) {
        return `<span class="info">On branch main
Your branch is ahead of 'origin/main' by ∞ commits.

Changes to be committed:
  modified:   everything.js

Untracked files:
  sleep.log (404: not found)

3 developers ahead of sleep.</span>`;
      }
      return `<span class="info">git version 2.42.0</span>`;
    },

    'git status': () => commands.git(['status']),

    npm: (args) => {
      if (args.includes('run') || args.includes('dev') || args.includes('start')) {
        return new Promise(resolve => {
          addTerminalLine('info', '> glymph@1.0.0 dev');
          addTerminalLine('info', '> vite --host');
          setTimeout(() => {
            addTerminalLine('success', '⚡ Server running on caffeine:3000');
            resolve('');
          }, 800);
        });
      }
      return `<span class="info">npm v10.2.0</span>`;
    },

    'npm run dev': () => commands.npm(['run', 'dev']),
    'npm start': () => commands.npm(['start']),

    clear: () => {
      terminalOutput.innerHTML = '';
      return null;
    },

    exit: () => {
      closeTerminal();
      return null;
    }
  };

  function addTerminalLine(type, text) {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt mono';
    prompt.textContent = 'glyph@studio:~$';
    const content = document.createElement('span');
    content.className = 'mono';
    content.innerHTML = text;
    line.appendChild(prompt);
    line.appendChild(content);
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  async function executeCommand(input) {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Echo command
    addTerminalLine('', `<span style="color:#fff">${trimmed}</span>`);
    terminalHistory.unshift(trimmed);
    historyIndex = -1;

    // Parse command
    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Find matching command
    const fullCmd = trimmed.toLowerCase();
    let result = null;

    if (commands[fullCmd]) {
      result = commands[fullCmd](args);
    } else if (commands[cmd]) {
      result = commands[cmd](args);
    } else {
      result = `<span class="error">command not found: ${cmd}. Type 'help' for available commands.</span>`;
    }

    // Handle promise results
    if (result instanceof Promise) {
      await result;
    } else if (result !== null) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.innerHTML = result;
      terminalOutput.appendChild(line);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }

  function openTerminal() {
    if (isTerminalOpen) return;
    isTerminalOpen = true;
    terminalOverlay.classList.add('is-open');
    terminalOverlay.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      terminalInput.focus();
    }, 300);
  }

  function closeTerminal() {
    isTerminalOpen = false;
    terminalOverlay.classList.remove('is-open');
    terminalOverlay.setAttribute('aria-hidden', 'true');
    terminalInput.blur();
  }

  // Terminal event listeners
  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeCommand(terminalInput.value);
        terminalInput.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < terminalHistory.length - 1) {
          historyIndex++;
          terminalInput.value = terminalHistory[historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          terminalInput.value = terminalHistory[historyIndex];
        } else if (historyIndex === 0) {
          historyIndex = -1;
          terminalInput.value = '';
        }
      }
    });
  }

  terminalClose && terminalClose.addEventListener('click', closeTerminal);
  terminalFab && terminalFab.addEventListener('click', openTerminal);
  terminalSticker && terminalSticker.addEventListener('click', openTerminal);

  // Click outside to close
  terminalOverlay && terminalOverlay.addEventListener('click', (e) => {
    if (e.target === terminalOverlay) closeTerminal();
  });

  /* ---------------------------------------------------------
     15. EASTER EGGS
     --------------------------------------------------------- */

  // Konami code detector
  const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiIndex = 0;

  function triggerKonami() {
    if (!hasGSAP || reduced) return;
    showAchievement('🎮', 'KONAMI UNLOCKED', 'You found the secret!');

    stickers.forEach((s, i) => {
      const inner = s.querySelector('.sticker__drag');
      if (!inner) return;

      // Explode outward
      const angle = (i / stickers.length) * Math.PI * 2;
      const distance = 400;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      gsap.to(inner, {
        x, y,
        rotation: Math.random() * 720 - 360,
        scale: 0.5,
        duration: 0.8,
        ease: 'power2.out',
        onComplete: () => {
          // Reassemble
          gsap.to(inner, {
            x: 0, y: 0, rotation: 0, scale: 1,
            duration: 1.2,
            ease: 'elastic.out(1, 0.5)',
            delay: 0.3
          });
        }
      });
    });
  }

  // Type "glymph" detector
  let typedString = '';
  let typedTimeout;

  function checkTypedString(char) {
    clearTimeout(typedTimeout);
    typedString += char.toLowerCase();
    if (typedString.includes('glymph')) {
      showAchievement('⚡', 'EASTER EGG FOUND', 'You typed the magic word!');
      typedString = '';
    }
    typedTimeout = setTimeout(() => {
      typedString = '';
    }, 2000);
  }

  // Achievement toast
  function showAchievement(icon, title, desc) {
    let toast = $('.achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'achievement-toast';
      toast.innerHTML = `
        <div class="achievement-toast__icon">${icon}</div>
        <div class="achievement-toast__content">
          <div class="achievement-toast__title">${title}</div>
          <div class="achievement-toast__desc">${desc}</div>
        </div>
      `;
      document.body.appendChild(toast);
    } else {
      toast.querySelector('.achievement-toast__icon').textContent = icon;
      toast.querySelector('.achievement-toast__title').textContent = title;
      toast.querySelector('.achievement-toast__desc').textContent = desc;
    }

    setTimeout(() => toast.classList.add('is-visible'), 100);
    setTimeout(() => toast.classList.remove('is-visible'), 4000);
  }

  // Shortcuts overlay
  let shortcutsOverlay = null;
  function toggleShortcutsOverlay() {
    if (!shortcutsOverlay) {
      shortcutsOverlay = document.createElement('div');
      shortcutsOverlay.className = 'shortcuts-overlay';
      shortcutsOverlay.innerHTML = `
        <div class="shortcuts-overlay__content">
          <h2 class="shortcuts-overlay__title">KEYBOARD SHORTCUTS</h2>
          <p class="shortcuts-overlay__subtitle mono">press ESC to close</p>
          <div class="shortcuts-overlay__grid">
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>Ctrl</kbd><kbd>K</kbd></div>
              <div class="shortcuts-overlay__desc">Open Terminal</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>T</kbd></div>
              <div class="shortcuts-overlay__desc">Open Terminal</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>G</kbd></div>
              <div class="shortcuts-overlay__desc">Sticker Bounce</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>K</kbd></div>
              <div class="shortcuts-overlay__desc">Sticker Scatter</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>C</kbd></div>
              <div class="shortcuts-overlay__desc">CRT Mode Toggle</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>?</kbd><span style="color:#666"> / </span><kbd>/</kbd></div>
              <div class="shortcuts-overlay__desc">Show This Help</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>↑↑↓↓←→←→BA</kbd></div>
              <div class="shortcuts-overlay__desc">Konami Code</div>
            </div>
            <div class="shortcuts-overlay__item">
              <div class="shortcuts-overlay__keys"><kbd>ESC</kbd></div>
              <div class="shortcuts-overlay__desc">Close Overlays</div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(shortcutsOverlay);

      shortcutsOverlay.addEventListener('click', (e) => {
        if (e.target === shortcutsOverlay) {
          shortcutsOverlay.classList.remove('is-visible');
        }
      });
    }

    const isVisible = shortcutsOverlay.classList.contains('is-visible');
    if (isVisible) {
      shortcutsOverlay.classList.remove('is-visible');
    } else {
      shortcutsOverlay.classList.add('is-visible');
    }
  }

  // CRT mode toggle
  let crtMode = false;
  function toggleCRT() {
    crtMode = !crtMode;
    document.body.classList.toggle('crt-mode', crtMode);
  }

  // Footer year easter egg
  let yearClicks = 0;
  const yearEl = $('#year');
  if (yearEl) {
    yearEl.addEventListener('click', () => {
      yearClicks++;
      if (yearClicks >= 5) {
        yearEl.textContent = '∞';
        showAchievement('♾️', 'INFINITY MODE', 'Time is just a construct');
        yearClicks = 0;
      }
    });
  }

  // Triple-click logo
  const heroLogo = $('.hero__logo');
  let logoClickCount = 0;
  let logoClickTimer;
  if (heroLogo && hasGSAP && !reduced) {
    heroLogo.addEventListener('click', () => {
      logoClickCount++;
      clearTimeout(logoClickTimer);

      if (logoClickCount === 3) {
        const colors = ['#ff3b2f', '#2d5bff', '#00e5ff', '#fff'];
        let colorIndex = 0;

        gsap.to(heroLogo, {
          rotation: 360,
          duration: 1,
          ease: 'back.out(1.5)',
          onUpdate: () => {
            if (Math.floor(gsap.getProperty(heroLogo, 'rotation') / 90) > colorIndex) {
              colorIndex++;
              heroLogo.style.color = colors[colorIndex % colors.length];
            }
          },
          onComplete: () => {
            gsap.set(heroLogo, { rotation: 0 });
            setTimeout(() => { heroLogo.style.color = ''; }, 500);
          }
        });

        logoClickCount = 0;
      } else {
        logoClickTimer = setTimeout(() => {
          logoClickCount = 0;
        }, 500);
      }
    });
  }

  // Double-click stickers to backflip
  if (hasGSAP && !reduced) {
    stickers.forEach((s) => {
      s.addEventListener('dblclick', () => {
        const inner = s.querySelector('.sticker__drag > *');
        if (inner) {
          gsap.to(inner, {
            rotationX: 360,
            duration: 0.6,
            ease: 'back.out(1.5)',
            onComplete: () => {
              gsap.set(inner, { rotationX: 0 });
            }
          });
        }
      });
    });
  }

  // Cursor shake detection for rainbow trail
  let lastMouseX = 0, lastMouseY = 0, shakeCount = 0, shakeTimer;
  let rainbowMode = false;
  window.addEventListener('mousemove', (e) => {
    const dx = Math.abs(e.clientX - lastMouseX);
    const dy = Math.abs(e.clientY - lastMouseY);

    if (dx > 100 || dy > 100) {
      shakeCount++;
      if (shakeCount > 5 && !rainbowMode) {
        rainbowMode = true;
        document.documentElement.style.setProperty('--trail-hue', '0');

        let hue = 0;
        const rainbowInterval = setInterval(() => {
          hue = (hue + 5) % 360;
          document.documentElement.style.setProperty('--trail-hue', hue.toString());
        }, 50);

        setTimeout(() => {
          clearInterval(rainbowInterval);
          rainbowMode = false;
          document.documentElement.style.removeProperty('--trail-hue');
        }, 3000);
      }

      clearTimeout(shakeTimer);
      shakeTimer = setTimeout(() => {
        shakeCount = 0;
      }, 500);
    }

    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }, { passive: true });

  // Idle timer - stickers drift to center
  let idleTimer;
  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (hasGSAP && !reduced) {
        stickers.forEach((s, i) => {
          gsap.to(s, {
            x: 0,
            y: 0,
            duration: 2,
            ease: 'power2.inOut',
            delay: i * 0.1
          });
        });
      }
    }, 30000);
  }

  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    window.addEventListener(event, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();

  // Master keyboard handler
  window.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      return;
    }

    const key = e.key.toLowerCase();

    // Konami code
    if (konamiCode[konamiIndex] === e.key || konamiCode[konamiIndex] === key) {
      konamiIndex++;
      if (konamiIndex === konamiCode.length) {
        triggerKonami();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }

    // Type detector
    if (key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      checkTypedString(key);
    }

    // Escape key - close all overlays
    if (e.key === 'Escape') {
      closeTerminal();
      if (shortcutsOverlay) shortcutsOverlay.classList.remove('is-visible');
      const menu = $('#menu');
      if (menu && menu.classList.contains('is-open')) {
        closeMenu();
      }
      return;
    }

    // Ignore modified keys for single-key shortcuts
    if (e.metaKey || e.altKey) return;

    // Ctrl/Cmd+K - open terminal
    if ((e.ctrlKey || e.metaKey) && key === 'k') {
      e.preventDefault();
      openTerminal();
      return;
    }

    // Single key shortcuts
    if (e.ctrlKey) return;

    switch (key) {
      case 't':
        openTerminal();
        break;
      case 'k':
        if (hasGSAP && !reduced) {
          stickers.forEach((s) => {
            const inner = s.querySelector('.sticker__drag');
            if (inner) {
              const angle = Math.random() * Math.PI * 2;
              const distance = 300 + Math.random() * 200;
              const x = Math.cos(angle) * distance;
              const y = Math.sin(angle) * distance;

              gsap.to(inner, {
                x, y,
                rotation: Math.random() * 360,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                  gsap.to(inner, {
                    x: 0, y: 0, rotation: 0,
                    duration: 1,
                    ease: 'elastic.out(1, 0.6)',
                    delay: 0.2
                  });
                }
              });
            }
          });
        }
        break;
      case 'c':
        toggleCRT();
        break;
      case '?':
      case '/':
        toggleShortcutsOverlay();
        break;
    }
  });

  /* ---------------------------------------------------------
     16. HERO PARTICLE SYSTEM
     --------------------------------------------------------- */
  const heroSection = $('.hero');
  let particleCanvas, particleCtx, particles = [];

  if (heroSection && !reduced) {
    particleCanvas = document.createElement('canvas');
    particleCanvas.id = 'heroParticles';
    heroSection.insertBefore(particleCanvas, heroSection.firstChild);
    particleCtx = particleCanvas.getContext('2d');

    function resizeParticleCanvas() {
      const rect = heroSection.getBoundingClientRect();
      particleCanvas.width = rect.width;
      particleCanvas.height = rect.height;
    }

    resizeParticleCanvas();
    window.addEventListener('resize', resizeParticleCanvas);

    // Create particles
    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * particleCanvas.height;
      }

      reset() {
        this.x = Math.random() * particleCanvas.width;
        this.y = -10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = Math.random() * 0.3 + 0.2;
        this.size = Math.random() * 4 + 2; // Bigger particles
        this.opacity = Math.random() * 0.7 + 0.5; // More opaque
        this.type = Math.random() > 0.7 ? 'shape' : 'dot';
        this.shape = Math.floor(Math.random() * 3); // 0=square, 1=triangle, 2=circle
        this.color = ['#fff', '#ff3b2f', '#2d5bff'][Math.floor(Math.random() * 3)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y > particleCanvas.height + 10) {
          this.reset();
        }
        if (this.x < -10 || this.x > particleCanvas.width + 10) {
          this.vx *= -1;
        }
      }

      draw() {
        particleCtx.save();
        particleCtx.globalAlpha = this.opacity;
        particleCtx.fillStyle = this.color;

        if (this.type === 'dot') {
          particleCtx.beginPath();
          particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          particleCtx.fill();
        } else {
          particleCtx.translate(this.x, this.y);
          particleCtx.beginPath();

          if (this.shape === 0) {
            // Square
            particleCtx.rect(-this.size, -this.size, this.size * 2, this.size * 2);
          } else if (this.shape === 1) {
            // Triangle
            particleCtx.moveTo(0, -this.size);
            particleCtx.lineTo(this.size, this.size);
            particleCtx.lineTo(-this.size, this.size);
          } else {
            // Circle
            particleCtx.arc(0, 0, this.size, 0, Math.PI * 2);
          }

          particleCtx.fill();
        }

        particleCtx.restore();
      }
    }

    // Initialize particles
    for (let i = 0; i < 100; i++) { // More particles
      particles.push(new Particle());
    }

    console.log('Particle system initialized with 100 particles');

    // Animation loop
    let particleOpacity = 1;
    function animateParticles() {
      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

      // Fade out based on scroll
      const scrollProgress = Math.min(window.scrollY / window.innerHeight, 1);
      particleOpacity = 1 - scrollProgress;
      particleCanvas.style.opacity = particleOpacity;

      if (particleOpacity > 0) {
        particles.forEach(p => {
          p.update();
          p.draw();
        });
      }

      requestAnimationFrame(animateParticles);
    }

    animateParticles();
  }

  /* ---------------------------------------------------------
     17. ENHANCED ANIMATIONS
     --------------------------------------------------------- */

  // Wordmark letter hover enhancement
  const wordmarkChars = $$('.wordmark .char');
  wordmarkChars.forEach((char) => {
    if (!hasGSAP || reduced) return;

    char.addEventListener('mouseenter', () => {
      gsap.to(char, {
        scale: 1.15,
        color: '#00e5ff',
        duration: 0.3,
        ease: 'back.out(2)'
      });
    });

    char.addEventListener('mouseleave', () => {
      gsap.to(char, {
        scale: 1,
        color: '#fff',
        duration: 0.5,
        ease: 'elastic.out(1, 0.5)'
      });
    });
  });

  // Thesis "yet" glitch effect
  const yetWord = $('.thesis__line .ac');
  if (yetWord) {
    yetWord.setAttribute('data-text', 'yet.');
    yetWord.classList.add('glitch');

    yetWord.addEventListener('mouseenter', () => {
      yetWord.classList.add('is-active');
    });

    yetWord.addEventListener('mouseleave', () => {
      yetWord.classList.remove('is-active');
    });
  }

  // Email typewriter effect
  const mailLink = $('.mail');
  if (mailLink && hasGSAP && ST && !reduced) {
    ST.create({
      trigger: mailLink,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        setTimeout(() => {
          mailLink.classList.add('typewriter-done');
        }, 3000);
      }
    });
  }

  // Scroll progress color transitions
  if (hasGSAP && ST && !reduced) {
    const progressBar = $('.progress span');
    if (progressBar) {
      ST.create({
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress < 0.25) {
            progressBar.style.background = '#ff3b2f';
          } else if (progress < 0.5) {
            progressBar.style.background = '#2d5bff';
          } else if (progress < 0.75) {
            progressBar.style.background = '#00e5ff';
          } else {
            progressBar.style.background = '#fff';
          }
        }
      });
    }
  }

  /* ---------------------------------------------------------
     18. MISC
     --------------------------------------------------------- */
  const y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  // Update console message
  console.log('%c GLYMPH STUDIO ', 'background:#ff3b2f;color:#000;font-weight:700;letter-spacing:.2em;padding:4px 8px');
  console.log('%c drag stickers · press G, K, C, T, ? · type "glymph" · ↑↑↓↓←→←→BA · triple-click logo ', 'color:#8c8c8c');
  console.log('%c', 'font-size:1px;padding:20px 100px;background:url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0aCBkPSJNMTU1IDU1IEg0NSBWMTQ1IEgxNTUgVjExNSBIMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMzAiLz48cGF0aCBkPSJNMTA5LjggMzMuNiA2Mi4zIDExMi4zSDk1LjFMNzUuNCAxNjYuNCAxMzcuNyA4MS4xSDEwMy4zTDExNi40IDMzLjZaIiBmaWxsPSIjZmYzYjJmIi8+PC9zdmc+) no-repeat');
})();
