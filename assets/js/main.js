/* =========================================================
   Ian Frederick Talania — Portfolio Interactions
   ========================================================= */
(() => {
  'use strict';

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('primary-nav');

  // ---------- Header scroll & mobile menu ----------
  const onScroll = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (menuToggle && nav && header) {
    const closeMenu = () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open menu');
      nav.classList.remove('is-open');
      header.classList.remove('menu-open');
    };

    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeMenu();
      } else {
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close menu');
        nav.classList.add('is-open');
        header.classList.add('menu-open');
      }
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  // ---------- Active nav link via IntersectionObserver ----------
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        navLinks.forEach(a => {
          if (a.getAttribute('href') === id) {
            a.setAttribute('aria-current', 'true');
          } else {
            a.removeAttribute('aria-current');
          }
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });

    sections.forEach(sec => navObserver.observe(sec));
  }

  // ---------- Reveal animations ----------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  // ---------- Project category filter ----------
  const filterChips = document.querySelectorAll('.work-filter .chip');
  const projects = document.querySelectorAll('.projects .project');
  const filterStatus = document.getElementById('filter-status');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const target = chip.dataset.filter || 'all';
      filterChips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));

      let shown = 0;
      projects.forEach(proj => {
        const tags = (proj.dataset.tags || '').split(/\s+/);
        const match = target === 'all' || tags.includes(target);
        proj.hidden = !match;
        if (match) {
          shown++;
          proj.classList.add('is-visible');
        }
      });

      if (filterStatus) {
        filterStatus.textContent = `Showing ${shown} project${shown === 1 ? '' : 's'}.`;
      }
    });
  });

  // ---------- Accessible carousel ----------
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const viewport = carousel.querySelector('.carousel__viewport');
    const slides = Array.from(carousel.querySelectorAll('.carousel__slide'));
    const prevBtn = carousel.querySelector('[data-prev]');
    const nextBtn = carousel.querySelector('[data-next]');
    const curEl = carousel.querySelector('[data-current]');
    const totalEl = carousel.querySelector('[data-total]');
    if (!viewport || !slides.length) return;

    const total = slides.length;
    if (totalEl) totalEl.textContent = String(total).padStart(2, '0');
    let index = 0;

    const updateUI = i => {
      index = Math.max(0, Math.min(total - 1, i));
      if (curEl) curEl.textContent = String(index + 1).padStart(2, '0');
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === total - 1;
    };

    const scrollToSlide = i => {
      const clamped = Math.max(0, Math.min(total - 1, i));
      const slide = slides[clamped];
      if (slide) {
        viewport.scrollTo({ left: slide.offsetLeft - viewport.offsetLeft, behavior: 'smooth' });
      }
      updateUI(clamped);
    };

    prevBtn?.addEventListener('click', () => scrollToSlide(index - 1));
    nextBtn?.addEventListener('click', () => scrollToSlide(index + 1));

    viewport.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); scrollToSlide(index - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); scrollToSlide(index + 1); }
    });

    let scrollTimer;
    viewport.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const w = viewport.clientWidth || 1;
        const approx = Math.round(viewport.scrollLeft / w);
        updateUI(approx);
      }, 80);
    }, { passive: true });

    updateUI(0);
  });

  // ---------- Lightbox dialog ----------
  const lbDialog = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbTitle = document.getElementById('lb-title');
  const lbCount = document.getElementById('lb-count');
  const lbPrev = lbDialog?.querySelector('[data-lb-prev]');
  const lbNext = lbDialog?.querySelector('[data-lb-next]');

  let activeItems = [];
  let activeIdx = 0;
  let lastTrigger = null;

  const renderLightbox = () => {
    const item = activeItems[activeIdx];
    if (!item || !lbImg) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt || item.caption || 'Portfolio preview';
    if (lbTitle) lbTitle.textContent = item.caption || 'Preview';
    if (lbCount) {
      lbCount.textContent = activeItems.length > 1
        ? `${String(activeIdx + 1).padStart(2, '0')} / ${String(activeItems.length).padStart(2, '0')}`
        : '';
    }
    if (lbPrev) lbPrev.hidden = activeItems.length <= 1;
    if (lbNext) lbNext.hidden = activeItems.length <= 1;
  };

  const openGallery = (groupName, startSrc = null, triggerEl = null) => {
    if (!lbDialog) return;
    const nodes = Array.from(document.querySelectorAll(`[data-gallery="${groupName}"]`));
    if (!nodes.length) return;

    activeItems = nodes.map(n => ({
      src: n.dataset.src,
      caption: n.dataset.caption || '',
      alt: n.querySelector('img')?.alt || n.dataset.caption || ''
    }));
    const found = startSrc ? activeItems.findIndex(x => x.src === startSrc) : 0;
    activeIdx = found >= 0 ? found : 0;
    lastTrigger = triggerEl || document.activeElement;

    renderLightbox();
    if (!lbDialog.open) lbDialog.showModal();
  };

  document.querySelectorAll('button[data-gallery]').forEach(btn => {
    btn.addEventListener('click', () => {
      openGallery(btn.dataset.gallery, btn.dataset.src, btn);
    });
  });

  document.querySelectorAll('[data-open-gallery]').forEach(btn => {
    btn.addEventListener('click', () => {
      openGallery(btn.dataset.openGallery, null, btn);
    });
  });

  lbPrev?.addEventListener('click', () => {
    if (!activeItems.length) return;
    activeIdx = (activeIdx - 1 + activeItems.length) % activeItems.length;
    renderLightbox();
  });

  lbNext?.addEventListener('click', () => {
    if (!activeItems.length) return;
    activeIdx = (activeIdx + 1) % activeItems.length;
    renderLightbox();
  });

  lbDialog?.addEventListener('keydown', e => {
    if (activeItems.length > 1) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); lbPrev?.click(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbNext?.click(); }
    }
  });

  // ---------- Live Figma embed dialog ----------
  const emDialog = document.getElementById('embed');
  const emFrame = document.getElementById('em-frame');
  const emTitle = document.getElementById('em-title');
  const emLink = document.getElementById('em-link');

  document.querySelectorAll('[data-embed]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!emDialog || !emFrame) return;
      lastTrigger = btn;
      const url = btn.dataset.embed;
      const title = btn.dataset.embedTitle || 'Live prototype preview';
      const extLink = btn.dataset.embedLink || url;

      if (emTitle) {
        emTitle.innerHTML = '';
        emTitle.append(document.createTextNode(title));
        const sub = document.createElement('small');
        sub.textContent = 'Interactive Figma embed — click inside to explore';
        emTitle.append(sub);
      }
      if (emLink) emLink.href = extLink;
      emFrame.src = url;
      if (!emDialog.open) emDialog.showModal();
    });
  });

  // Shared dialog close logic (close buttons & backdrop click)
  [lbDialog, emDialog].forEach(dlg => {
    if (!dlg) return;
    dlg.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => dlg.close());
    });
    dlg.addEventListener('click', e => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener('close', () => {
      if (dlg === emDialog && emFrame) emFrame.src = 'about:blank';
      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
    });
  });

  // ---------- Copy email button ----------
  const copyStatus = document.querySelector('.copy-status');
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(value);
        if (copyStatus) copyStatus.textContent = `Copied ${value} to clipboard.`;
      } catch {
        if (copyStatus) copyStatus.textContent = `Email: ${value}`;
      }
      setTimeout(() => {
        if (copyStatus) copyStatus.textContent = '';
      }, 4000);
    });
  });

  // ---------- Footer year ----------
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
