/* iMosaicArt theme — interactivity */
(function () {
  'use strict';

  /* Wishlist store (localStorage). Items are objects keyed by handle. */
  window.imaWishlist = {
    read: function () { try { return JSON.parse(localStorage.getItem('ima_wishlist') || '[]'); } catch (e) { return []; } },
    write: function (list) { localStorage.setItem('ima_wishlist', JSON.stringify(list)); },
    has: function (handle) { return this.read().some(function (x) { return (x.handle || x) === handle; }); },
    toggle: function (item) {
      var list = this.read();
      var i = list.findIndex(function (x) { return (x.handle || x) === item.handle; });
      if (i === -1) list.push(item); else list.splice(i, 1);
      this.write(list);
      return i === -1;
    }
  };

  /* Mobile nav toggle */
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-menu-toggle]');
    if (toggle) {
      var drawer = document.getElementById('MobileNav');
      if (drawer) {
        var open = drawer.hasAttribute('open');
        if (open) { drawer.removeAttribute('open'); }
        else { drawer.setAttribute('open', ''); }
      }
    }
    if (e.target.closest('[data-menu-close]')) {
      var d = document.getElementById('MobileNav');
      if (d) d.removeAttribute('open');
    }
  });

  /* Accordion (PDP specs + FAQ) */
  document.addEventListener('click', function (e) {
    var toggle = e.target.closest('[data-accordion-toggle]');
    if (!toggle) return;
    var item = toggle.closest('[data-accordion]');
    if (item) item.toggleAttribute('data-open');
  });

  /* Product page: variant picker, qty stepper, gallery, wishlist */
  document.querySelectorAll('[data-product]').forEach(function (root) {
    var priceEl = root.querySelector('[data-price]');
    var sizeLabelEl = root.querySelector('[data-size-label]');
    var variantInput = root.querySelector('[data-variant-input]');

    /* Variant buttons */
    root.querySelectorAll('[data-variant-picker] .size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        root.querySelectorAll('[data-variant-picker] .size-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (variantInput) variantInput.value = btn.dataset.variantId;
        if (priceEl) priceEl.textContent = btn.dataset.variantPrice;
        if (sizeLabelEl) sizeLabelEl.textContent = btn.dataset.variantTitle;
      });
    });

    /* Qty stepper */
    var qtyInput = root.querySelector('[data-qty-input]');
    var dec = root.querySelector('[data-qty-dec]');
    var inc = root.querySelector('[data-qty-inc]');
    if (dec) dec.addEventListener('click', function () { qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1); });
    if (inc) inc.addEventListener('click', function () { qtyInput.value = (parseInt(qtyInput.value, 10) || 1) + 1; });

    /* Thumbnail swap */
    var mainImg = root.querySelector('#PdpMainImage');
    root.querySelectorAll('[data-thumb]').forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        if (mainImg) mainImg.src = thumb.dataset.thumb;
        root.querySelectorAll('[data-thumb]').forEach(function (t) { t.classList.remove('is-active'); });
        thumb.classList.add('is-active');
      });
    });

    /* Zoom origin follows cursor */
    var stage = root.querySelector('[data-zoom-stage]');
    if (stage && mainImg) {
      stage.addEventListener('mousemove', function (ev) {
        var r = stage.getBoundingClientRect();
        mainImg.style.transformOrigin = ((ev.clientX - r.left) / r.width * 100) + '% ' + ((ev.clientY - r.top) / r.height * 100) + '%';
      });
    }

    /* Wishlist (localStorage) */
    var wishBtn = root.querySelector('[data-wishlist]');
    if (wishBtn && window.imaWishlist) {
      var d = wishBtn.dataset;
      var item = { handle: d.productHandle, title: d.wishTitle, url: d.wishUrl, image: d.wishImage, price: d.wishPrice, sub: d.wishSub };
      var label = wishBtn.querySelector('[data-wishlist-label]');
      var sync = function () {
        var saved = window.imaWishlist.has(item.handle);
        wishBtn.classList.toggle('is-saved', saved);
        if (label) label.textContent = saved ? 'Saved to Wishlist' : 'Add to Wishlist';
      };
      wishBtn.addEventListener('click', function () { window.imaWishlist.toggle(item); sync(); });
      sync();
    }
  });

  /* Collection: auto-submit sort/filter form on change */
  document.querySelectorAll('[data-collection-filter]').forEach(function (form) {
    form.addEventListener('change', function (e) {
      if (e.target.closest('[data-auto-submit]') || e.target.hasAttribute('data-auto-submit')) {
        form.submit();
      }
    });
  });

  /* Collection/search card favorite hearts */
  document.querySelectorAll('[data-wish-add]').forEach(function (btn) {
    var d = btn.dataset;
    var item = { handle: d.productHandle, title: d.wishTitle, url: d.wishUrl, image: d.wishImage, price: d.wishPrice, sub: d.wishSub };
    var sync = function () { btn.classList.toggle('is-saved', window.imaWishlist.has(item.handle)); };
    btn.addEventListener('click', function (e) { e.preventDefault(); window.imaWishlist.toggle(item); sync(); });
    sync();
  });

  /* Portfolio: category filter + lightbox */
  document.querySelectorAll('[data-portfolio]').forEach(function (root) {
    var tiles = root.querySelectorAll('.pf-tile');
    root.querySelectorAll('[data-pf-filter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        root.querySelectorAll('[data-pf-filter]').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var f = tab.dataset.pfFilter;
        tiles.forEach(function (tile) {
          tile.style.display = (f === 'all' || tile.dataset.pfCat === f) ? '' : 'none';
        });
      });
    });

    var lb = document.querySelector('[data-pf-lightbox]');
    if (lb) {
      var lbImg = lb.querySelector('[data-pf-lightbox-img]');
      var lbCat = lb.querySelector('[data-pf-lightbox-cat]');
      var lbTitle = lb.querySelector('[data-pf-lightbox-title]');
      tiles.forEach(function (tile) {
        tile.addEventListener('click', function () {
          var full = tile.dataset.pfFull;
          if (!full) return;
          lbImg.src = full;
          lbCat.textContent = tile.dataset.pfCatlabel || '';
          lbTitle.textContent = tile.dataset.pfTitle || '';
          lb.hidden = false;
        });
      });
      var close = function () { lb.hidden = true; lbImg.src = ''; };
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('[data-pf-close]')) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
  });

  /* Hero magnifier lens — replicates the design's zoom-on-hover */
  document.querySelectorAll('[data-hero-zoom]').forEach(function (frame) {
    var img = frame.querySelector('img');
    if (!img) return;
    var lens = document.createElement('div');
    lens.className = 'hero-lens';
    var SRC = img.currentSrc || img.src;
    var LENS = 150, ZOOM = 1.85;
    lens.style.backgroundImage = 'url(' + SRC + ')';

    frame.addEventListener('mousemove', function (ev) {
      var r = frame.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (!lens.parentNode) frame.appendChild(lens);
      lens.style.left = (x - LENS / 2) + 'px';
      lens.style.top = (y - LENS / 2) + 'px';
      lens.style.backgroundSize = (r.width * ZOOM) + 'px ' + (r.height * ZOOM) + 'px';
      lens.style.backgroundPosition = (-(x * ZOOM - LENS / 2)) + 'px ' + (-(y * ZOOM - LENS / 2)) + 'px';
    });
    frame.addEventListener('mouseleave', function () {
      if (lens.parentNode) lens.parentNode.removeChild(lens);
    });
  });

  /* Header elevation on scroll */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    var onHeaderScroll = function () { siteHeader.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onHeaderScroll, { passive: true });
    onHeaderScroll();
  }

  /* Scroll reveal — safe: only hides below-the-fold blocks, no-op with reduced motion / no IO */
  (function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) return;
    var main = document.getElementById('MainContent');
    if (!main) return;
    var targets = main.querySelectorAll('.shopify-section, .bestsellers');
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var pending = [];
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top > vh * 0.82) { el.classList.add('ima-reveal'); pending.push(el); }
    });
    if (!pending.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('ima-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    pending.forEach(function (el) { io.observe(el); });
  })();
})();
