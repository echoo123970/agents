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

  /* Lightweight toast notifications (bottom-center). */
  window.imaToast = function (message, kind) {
    var host = document.querySelector('[data-toast-host]');
    if (!host) {
      host = document.createElement('div');
      host.setAttribute('data-toast-host', '');
      host.style.cssText = 'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;align-items:center;pointer-events:none;';
      document.body.appendChild(host);
    }
    var t = document.createElement('div');
    t.textContent = message;
    t.style.cssText = 'pointer-events:auto;background:' + (kind === 'muted' ? '#4A5468' : '#16335E') + ';color:#fff;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:13px;letter-spacing:.06em;padding:13px 22px;border-radius:2px;box-shadow:0 10px 30px rgba(11,28,53,.28);opacity:0;transform:translateY(10px);transition:opacity .3s ease,transform .3s ease;max-width:88vw;';
    host.appendChild(t);
    requestAnimationFrame(function () { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
    setTimeout(function () {
      t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
    }, 2200);
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
      wishBtn.addEventListener('click', function () {
        var added = window.imaWishlist.toggle(item); sync();
        window.imaToast(added ? 'Added to Wishlist' : 'Removed from Wishlist', added ? '' : 'muted');
      });
      sync();
    }
  });

  /* Collection: auto-submit sort/filter form on change.
     Fields are linked to the form via the HTML form="" attribute (not DOM nesting,
     to avoid nesting the add-to-cart forms inside the filter form), so we listen
     globally and submit through the field's .form reference. */
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.hasAttribute('data-auto-submit') || (t.closest && t.closest('[data-auto-submit]'))) {
      var form = t.form || document.querySelector('[data-collection-filter]');
      if (form) { if (form.requestSubmit) { form.requestSubmit(); } else { form.submit(); } }
    }
  });

  /* Collection/search card favorite hearts */
  document.querySelectorAll('[data-wish-add]').forEach(function (btn) {
    var d = btn.dataset;
    var item = { handle: d.productHandle, title: d.wishTitle, url: d.wishUrl, image: d.wishImage, price: d.wishPrice, sub: d.wishSub };
    var sync = function () { btn.classList.toggle('is-saved', window.imaWishlist.has(item.handle)); };
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var added = window.imaWishlist.toggle(item); sync();
      window.imaToast(added ? 'Added to Wishlist' : 'Removed from Wishlist', added ? '' : 'muted');
    });
    sync();
  });

  /* Portfolio: category filter + lightbox */
  document.querySelectorAll('[data-portfolio]').forEach(function (root) {
    var tiles = Array.prototype.slice.call(root.querySelectorAll('.pf-tile'));
    var moreBtn = root.querySelector('[data-pf-more]');
    var STEP = 20;
    var currentFilter = 'all';
    var limit = STEP;
    function renderTiles() {
      var shown = 0, matched = 0;
      tiles.forEach(function (tile) {
        var match = (currentFilter === 'all' || tile.dataset.pfCat === currentFilter);
        if (match && shown < limit) { tile.style.display = ''; shown++; }
        else { tile.style.display = 'none'; }
        if (match) matched++;
      });
      if (moreBtn) { moreBtn.style.display = (matched > limit) ? '' : 'none'; }
    }
    root.querySelectorAll('[data-pf-filter]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        root.querySelectorAll('[data-pf-filter]').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        currentFilter = tab.dataset.pfFilter;
        limit = STEP;
        renderTiles();
      });
    });
    if (moreBtn) { moreBtn.addEventListener('click', function () { limit += STEP; renderTiles(); }); }
    renderTiles();

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
    var LENS = 112, ZOOM = 2.2;
    var RAW = img.currentSrc || img.src;

    // Request a Shopify CDN render at an explicit pixel width.
    function atWidth(url, w) {
      if (!url) return url;
      if (/cdn\.shopify\.com|\/cdn\//.test(url)) {
        if (/[?&]width=\d+/.test(url)) return url.replace(/([?&])width=\d+/, '$1width=' + w);
        return url + (url.indexOf('?') > -1 ? '&' : '?') + 'width=' + w;
      }
      return url;
    }

    // The magnified image is drawn at (frameWidth * ZOOM) CSS px. On a Retina
    // screen each CSS px is devicePixelRatio device px, so we must fetch that
    // many source pixels or the zoom looks blurry. Cap at Shopify's max.
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    // Always load the full-resolution master for the lens. If the URL already
    // carries a width= param (e.g. an uploaded image rendered at 1200), bump it
    // to the max; if it has none it is already the original master, so leave it.
    var SRC = /[?&]width=\d+/.test(RAW) ? atWidth(RAW, 4096) : RAW;
    var natW = 0, natH = 0;
    var pre = new Image();               // preload + learn the master's real size
    pre.onload = function () { natW = pre.naturalWidth; natH = pre.naturalHeight; };
    pre.src = SRC;
    lens.style.backgroundImage = 'url(' + SRC + ')';

    frame.addEventListener('mousemove', function (ev) {
      var r = frame.getBoundingClientRect();
      var x = ev.clientX - r.left, y = ev.clientY - r.top;
      if (!lens.parentNode) frame.appendChild(lens);
      // Clamp zoom so the source is never upscaled past 1 device px = 1 source px
      // (blur comes from upscaling). This keeps the lens as sharp as the image allows.
      var z = ZOOM;
      if (natW && natH) {
        var maxZ = Math.min(natW / (r.width * dpr), natH / (r.height * dpr));
        if (maxZ < z) z = Math.max(1.3, maxZ);
      }
      lens.style.left = (x - LENS / 2) + 'px';
      lens.style.top = (y - LENS / 2) + 'px';
      lens.style.backgroundSize = (r.width * z) + 'px ' + (r.height * z) + 'px';
      lens.style.backgroundPosition = (-(x * z - LENS / 2)) + 'px ' + (-(y * z - LENS / 2)) + 'px';
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

  /* Predictive (instant) search — native Shopify /search/suggest.json */
  (function () {
    var boxes = document.querySelectorAll('[data-predictive]');
    if (!boxes.length) return;
    var QUICK = [
      { kw: ['install', 'installation', 'mount', 'how to install', 'set up', 'setup', 'fit '], label: 'Installation Guide', url: '/pages/installation-guide' },
      { kw: ['ship', 'shipping', 'delivery', 'deliver', 'arrive', 'how long', 'tracking', 'track', 'duties', 'customs'], label: 'Shipping & Delivery', url: '/pages/shipping-policy' },
      { kw: ['return', 'refund', 'exchange', 'money back', 'send back'], label: 'Returns & Refunds', url: '/pages/refund-policy' },
      { kw: ['custom', 'commission', 'bespoke', 'personalize', 'personalise', 'my own', 'own image', 'own design', 'make my'], label: 'Custom Mosaics', url: '/pages/custom-mosaics' },
      { kw: ['faq', 'question', 'weatherproof', 'waterproof', 'warranty', 'outdoor', 'pool', 'bathroom', 'care', 'clean', 'maintain', 'material', 'marble', 'glass', 'stone'], label: 'FAQ', url: '/pages/frequently-asked-questions' },
      { kw: ['reward', 'loyalty', 'points', 'earn'], label: 'Loyalty Program', url: '/pages/imosaicart-loyalty-program' },
      { kw: ['payment', 'pay', 'secure', 'billing', 'checkout', 'card'], label: 'Billing Terms', url: '/pages/billing-terms-conditions' },
      { kw: ['about', 'story', 'artisan', 'who are', 'history'], label: 'About Us', url: '/pages/about-us' },
      { kw: ['contact', 'email', 'phone', 'call', 'reach', 'help', 'support'], label: 'Contact Us', url: '/pages/contact-us' },
      { kw: ['portfolio', 'gallery', 'project', 'showcase', 'example'], label: 'Portfolio', url: '/pages/portfolio' }
    ];
    function quickLinks(q) {
      var ql = q.toLowerCase(), out = [], seen = {};
      QUICK.forEach(function (g) {
        for (var i = 0; i < g.kw.length; i++) {
          if (ql.indexOf(g.kw[i]) !== -1) { if (!seen[g.url]) { out.push(g); seen[g.url] = 1; } break; }
        }
      });
      return out.slice(0, 3);
    }
    boxes.forEach(function (box) {
      var input = box.querySelector('[data-predictive-input]');
      var panel = box.querySelector('[data-predictive-results]');
      if (!input || !panel) return;
      var mf = box.getAttribute('data-money-format') || '${{amount}}';
      var timer, ctrl;
      function esc(x) { var d = document.createElement('div'); d.textContent = x == null ? '' : x; return d.innerHTML; }
      function money(v) { return mf.replace(/\{\{\s*amount[^}]*\}\}/, v); }
      function close() { panel.hidden = true; panel.innerHTML = ''; box.classList.remove('is-open'); }
      function run(q) {
        if (ctrl) { try { ctrl.abort(); } catch (e) {} }
        ctrl = (window.AbortController) ? new AbortController() : null;
        var url = '/search/suggest.json?q=' + encodeURIComponent(q) +
          '&resources[type]=product,collection,page,article&resources[limit]=6&resources[options][unavailable_products]=last';
        fetch(url, ctrl ? { signal: ctrl.signal } : {})
          .then(function (r) { return r.json(); })
          .then(function (data) {
            var res = (data.resources && data.resources.results) || {};
            var products = res.products || [], colls = res.collections || [], pages = res.pages || [], articles = res.articles || [];
            var html = '';
            if (colls.length) {
              html += '<div class="psg__chips">';
              colls.slice(0, 4).forEach(function (c) { html += '<a class="psg__chip" href="' + esc(c.url) + '">' + esc(c.title) + '</a>'; });
              html += '</div>';
            }
            if (products.length) {
              html += '<div class="psg__prods">';
              products.forEach(function (p) {
                var img = p.image ? '<img src="' + esc(p.image) + '" alt="" loading="lazy">' : '';
                var sub = p.product_type ? '<span class="psg__sub">' + esc(p.product_type) + '</span>' : '';
                var price = p.price ? '<span class="psg__price">' + money(p.price) + '</span>' : '';
                html += '<a class="psg__item" href="' + esc(p.url) + '"><span class="psg__thumb">' + img + '</span>' +
                        '<span class="psg__info">' + sub + '<span class="psg__ttl">' + esc(p.title) + '</span>' + price + '</span></a>';
              });
              html += '</div>';
            }
            if (pages.length) {
              html += '<div class="psg__chips">';
              pages.slice(0, 2).forEach(function (pg) { html += '<a class="psg__chip" href="' + esc(pg.url) + '">' + esc(pg.title) + '</a>'; });
              html += '</div>';
            }
            if (articles.length) {
              html += '<div class="psg__links">';
              articles.slice(0, 3).forEach(function (a) {
                html += '<a class="psg__link" href="' + esc(a.url) + '"><span class="psg__link-ic">\u203A</span>' + esc(a.title) + '</a>';
              });
              html += '</div>';
            }
            var quicks = quickLinks(q);
            if (quicks.length) {
              var qh = '<div class="psg__label">Helpful pages</div><div class="psg__links">';
              quicks.forEach(function (g) { qh += '<a class="psg__link" href="' + g.url + '"><span class="psg__link-ic">\u203A</span>' + esc(g.label) + '</a>'; });
              qh += '</div>';
              html = qh + html;
            }
            var allUrl = '/search?options%5Bprefix%5D=last&q=' + encodeURIComponent(q);
            if (!products.length && !colls.length && !pages.length && !articles.length && !quicks.length) {
              html = '<div class="psg__empty">No matches for \u201c' + esc(q) + '\u201d. <a href="' + allUrl + '">Browse all mosaics</a></div>';
            } else {
              html += '<a class="psg__all" href="' + allUrl + '">See all results for \u201c' + esc(q) + '\u201d \u2192</a>';
            }
            panel.innerHTML = html;
            panel.hidden = false;
            box.classList.add('is-open');
          })
          .catch(function () {});
      }
      input.setAttribute('autocomplete', 'off');
      input.addEventListener('input', function () {
        var q = input.value.trim();
        clearTimeout(timer);
        if (q.length < 2) { close(); return; }
        timer = setTimeout(function () { run(q); }, 200);
      });
      input.addEventListener('focus', function () {
        if (input.value.trim().length >= 2 && panel.innerHTML) { panel.hidden = false; box.classList.add('is-open'); }
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { close(); var hs = box.closest('[data-hsearch]'); if (hs) hs.hidden = true; return; }
        var items = panel.querySelectorAll('a');
        if (!items.length) return;
        var idx = Array.prototype.indexOf.call(items, document.activeElement);
        if (e.key === 'ArrowDown') { e.preventDefault(); (items[idx + 1] || items[0]).focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); (items[idx - 1] || items[items.length - 1]).focus(); }
      });
      document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    });
  })();

  /* Header search toggle */
  (function () {
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-search-toggle]')) {
        var panel = document.querySelector('[data-hsearch]');
        if (panel) {
          panel.hidden = !panel.hidden;
          if (!panel.hidden) { var i = panel.querySelector('[data-predictive-input]'); if (i) i.focus(); }
        }
      }
      if (e.target.closest('[data-search-close]')) {
        var p = document.querySelector('[data-hsearch]'); if (p) p.hidden = true;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var p = document.querySelector('[data-hsearch]');
        if (p && !p.hidden) p.hidden = true;
      }
    });
  })();

  /* Inline variant picker on collection cards — reveal sizes, AJAX add, no redirect. */
  (function () {
    function updateCartCount() {
      fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (c) {
          document.querySelectorAll('.site-header__cart-count').forEach(function (el) {
            el.textContent = c.item_count;
          });
        }).catch(function () {});
    }
    document.addEventListener('click', function (e) {
      var toggle = e.target.closest ? e.target.closest('[data-opts-toggle]') : null;
      if (toggle && !toggle.disabled) {
        var card = toggle.closest('.cardc');
        if (card) {
          e.preventDefault();
          var wasOpen = card.classList.contains('is-open');
          document.querySelectorAll('.cardc.is-open').forEach(function (o) { o.classList.remove('is-open'); });
          if (!wasOpen) card.classList.add('is-open');
        }
        return;
      }
      // Click outside any open picker closes it.
      if (!(e.target.closest && e.target.closest('.cardc.is-open'))) {
        document.querySelectorAll('.cardc.is-open').forEach(function (o) { o.classList.remove('is-open'); });
      }
      var pill = e.target.closest ? e.target.closest('[data-variant-add]') : null;
      if (pill && !pill.disabled) {
        e.preventDefault();
        var id = pill.getAttribute('data-variant-id');
        if (!id || pill.classList.contains('is-adding')) return;
        var original = pill.textContent;
        pill.classList.add('is-adding');
        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ items: [{ id: id, quantity: 1 }] })
        }).then(function (r) { return r.json(); }).then(function (data) {
          pill.classList.remove('is-adding');
          if (data && data.status && data.status !== 200) {
            pill.textContent = 'Unavailable';
            setTimeout(function () { pill.textContent = original; }, 1600);
            return;
          }
          pill.textContent = 'Added To Cart';
          updateCartCount();
          setTimeout(function () {
            pill.textContent = original;
            var w = pill.closest('.cardc');
            if (w) w.classList.remove('is-open');
          }, 1500);
        }).catch(function () {
          pill.classList.remove('is-adding');
          pill.textContent = original;
        });
      }
    });
  })();

  /* Product page: finishing / framing option cards — highlight + reveal contact link. */
  (function () {
    document.querySelectorAll('.pdp-opt__check').forEach(function (cb) {
      var card = cb.closest('.pdp-opt');
      if (!card) return;
      var contact = card.querySelector('[data-frame-contact]');
      var sync = function () {
        card.classList.toggle('is-on', cb.checked);
        if (contact) contact.hidden = !cb.checked;
      };
      cb.addEventListener('change', sync);
      sync();
    });
  })();

  /* Count-up numbers — animate quickly to their value when scrolled into view. */
  (function () {
    var els = document.querySelectorAll('[data-countup]');
    if (!els.length) return;
    function fmt(v, dec, sep) {
      var n = dec > 0 ? v.toFixed(dec) : String(Math.round(v));
      if (sep) {
        var parts = n.split('.');
        parts[0] = Number(parts[0]).toLocaleString('en-US');
        n = parts.join('.');
      }
      return n;
    }
    function run(el) {
      var to = parseFloat(el.getAttribute('data-count-to')) || 0;
      var dec = parseInt(el.getAttribute('data-count-dec') || '0', 10);
      var sep = el.getAttribute('data-count-sep') === '1';
      var suffix = el.getAttribute('data-count-suffix') || '';
      var dur = 900, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * eased, dec, sep) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(to, dec, sep) + suffix;
      }
      requestAnimationFrame(step);
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.4 });
      els.forEach(function (el) {
        var dec = parseInt(el.getAttribute('data-count-dec') || '0', 10);
        var sep = el.getAttribute('data-count-sep') === '1';
        var suffix = el.getAttribute('data-count-suffix') || '';
        el.textContent = fmt(0, dec, sep) + suffix;
        io.observe(el);
      });
    } else {
      els.forEach(run);
    }
  })();

})();
