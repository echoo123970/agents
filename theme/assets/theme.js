/* iMosaicArt theme — interactivity */
(function () {
  'use strict';

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
    if (wishBtn) {
      var handle = wishBtn.dataset.productHandle;
      var label = wishBtn.querySelector('[data-wishlist-label]');
      var read = function () { try { return JSON.parse(localStorage.getItem('ima_wishlist') || '[]'); } catch (e) { return []; } };
      var sync = function () {
        var saved = read().indexOf(handle) !== -1;
        wishBtn.classList.toggle('is-saved', saved);
        if (label) label.textContent = saved ? 'Saved to Wishlist' : 'Add to Wishlist';
      };
      wishBtn.addEventListener('click', function () {
        var list = read();
        var i = list.indexOf(handle);
        if (i === -1) list.push(handle); else list.splice(i, 1);
        localStorage.setItem('ima_wishlist', JSON.stringify(list));
        sync();
      });
      sync();
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
})();
