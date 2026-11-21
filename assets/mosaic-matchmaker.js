/* Mosaic Matchmaker — guided quiz that recommends mosaics from the live catalog.
   Reads products from /collections/<handle>/products.json, scores them against the
   shopper's answers (placement, subject, colour mood, size, budget, material) and
   shows the best matches with links to the product and its "View in your space" preview. */
(function () {
  var root = document.querySelector('[data-mm]');
  var cfgEl = document.querySelector('[data-mm-config]');
  if (!root || !cfgEl || !root.querySelector('[data-step="intro"]')) return;
  var cfg = JSON.parse(cfgEl.textContent);

  var STEPS = ['intro', 'placement', 'subject', 'colour', 'size', 'budget', 'material', 'loading', 'results'];
  var QUESTIONS = ['placement', 'subject', 'colour', 'size', 'budget', 'material'];
  var SUBJECT_COLLECTIONS = {
    nature: ['tree-mosaics', 'landscape-mosaics'],
    flowers: ['flower-mosaics'],
    animals: ['bird-mosaics', 'animal-mosaics'],
    sea: ['nautical-mosaics'],
    religious: ['religious-mosaics'],
    art: ['portrait-mosaics', 'van-gogh-mosaics', 'roman-mosaics', 'landmark-mosaics'],
    geometric: ['geometric-mosaics', 'patterns-mosaics'],
    abstract: ['abstract'],
    medallion: ['geometric-mosaics', 'nautical-mosaics'],
    rug: ['geometric-mosaics', 'patterns-mosaics'],
    roman: ['roman-mosaics'],
    food: ['food-mosaics'],
    sealife: ['nautical-mosaics'],
    poolmedallion: ['nautical-mosaics', 'geometric-mosaics'],
    underwater: ['nautical-mosaics']
  };
  // Extra boost when a product's title matches the chosen design
  var SUBJECT_KEYWORDS = {
    medallion: [/medallion|compass|round|circle/, 'a floor medallion'],
    rug: [/rug|carpet|pattern|border/, 'a mosaic rug design'],
    sealife: [/fish|koi|turtle|dolphin|seahorse|octopus|mermaid|whale|lionfish|shark/, 'sea life'],
    poolmedallion: [/medallion|compass|anchor|emblem/, 'a pool medallion'],
    underwater: [/underwater|reef|coral|ocean|sea/, 'an underwater scene']
  };
  var BUDGETS = { b1: [0, 1000], b2: [1000, 2000], b3: [2000, 3500], b4: [3500, Infinity] };

  var answers = {};
  var stepIndex = 0;
  var cache = {};
  var bar = root.querySelector('[data-mm-bar]');

  // ---------- navigation ----------
  function show(step) {
    stepIndex = STEPS.indexOf(step);
    root.querySelectorAll('.mm__screen[data-step]').forEach(function (s) {
      s.classList.toggle('is-active', s.getAttribute('data-step') === step);
    });
    var qi = QUESTIONS.indexOf(step);
    var pct = step === 'intro' ? 0 : (qi >= 0 ? (qi / QUESTIONS.length) * 100 : 100);
    if (bar) bar.style.width = pct + '%';
    var screen = root.querySelector('.mm__screen[data-step="' + step + '"]');
    var title = screen && Array.prototype.filter.call(screen.querySelectorAll('.mm-q__title'), function (h) { return !h.closest('[hidden]'); })[0];
    if (title) title.focus({ preventScroll: true });
    var top = root.getBoundingClientRect().top + window.pageYOffset - 20;
    if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
  }

  root.querySelector('[data-mm-start]').addEventListener('click', function () {
    prefetch(['mosaic-tile-backsplash', 'table-countertop-mosaics', 'best-sellers']);
    show('placement');
  });
  root.querySelectorAll('[data-mm-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(STEPS[Math.max(0, stepIndex - 1)]); });
  });
  root.querySelector('[data-mm-restart]').addEventListener('click', function () {
    answers = {};
    root.querySelectorAll('[data-mm-answer]').forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
    show('placement');
  });
  root.querySelectorAll('[data-mm-answer]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      var q = tile.getAttribute('data-q'), v = tile.getAttribute('data-v');
      answers[q] = v;
      root.querySelectorAll('[data-mm-answer][data-q="' + q + '"]').forEach(function (t) {
        t.setAttribute('aria-pressed', t === tile ? 'true' : 'false');
      });
      if (q === 'subject') prefetch(SUBJECT_COLLECTIONS[v] || []);
      if (q === 'placement') {
        root.querySelectorAll('[data-for]').forEach(function (el) { el.hidden = el.getAttribute('data-for') !== v; });
        if (answers.subject) { delete answers.subject; root.querySelectorAll('[data-mm-answer][data-q="subject"]').forEach(function (t) { t.setAttribute('aria-pressed', 'false'); }); }
      }
      var next = STEPS[STEPS.indexOf(q) + 1];
      setTimeout(function () {
        if (next === 'loading') { show('loading'); run(); } else { show(next); }
      }, 220);
    });
  });

  // ---------- data ----------
  function fetchCollection(handle) {
    if (cache[handle]) return cache[handle];
    cache[handle] = (function load(page, acc) {
      return fetch('/collections/' + handle + '/products.json?limit=250&page=' + page)
        .then(function (r) { return r.ok ? r.json() : { products: [] }; })
        .then(function (j) {
          var list = acc.concat(j.products || []);
          return (j.products && j.products.length === 250 && page < 4) ? load(page + 1, list) : list;
        })
        .catch(function () { return acc; });
    })(1, []);
    return cache[handle];
  }
  function prefetch(handles) { handles.forEach(fetchCollection); }
  function idSet(list) { var s = {}; list.forEach(function (p) { s[p.id] = true; }); return s; }

  function parseSize(title) {
    var m = /([\d.]+)\s*cm\s*[x×]\s*([\d.]+)\s*cm/i.exec(title || '');
    if (!m) return null;
    var inch = /\(([^)]*)\)/.exec(title);
    var w = parseFloat(m[1]), h = parseFloat(m[2]);
    return { w: w, h: h, max: Math.max(w, h), label: (inch ? inch[1].replace(/"/g, '″') + ' — ' : '') + w + ' × ' + h + ' cm' };
  }
  function sizeFits(s, want) {
    if (!s || want === 'custom' || !want) return true;
    if (want === 'small') return s.max < 70;
    if (want === 'medium') return s.max >= 70 && s.max <= 120;
    return s.max > 120;
  }
  function budgetFits(price, want) {
    var r = BUDGETS[want];
    return !r || (price >= r[0] && price < r[1]);
  }
  function money(n) {
    try { return new Intl.NumberFormat(cfg.locale || 'en', { style: 'currency', currency: cfg.currency || 'USD', maximumFractionDigits: 0 }).format(n); }
    catch (e) { return '$' + Math.round(n).toLocaleString(); }
  }
  function sameOriginImage(src, width) {
    if (!src) return '';
    var local = src.replace(/^https?:\/\/cdn\.shopify\.com\/s\/files\/\d+\/\d+\/\d+\/\d+\//, '/cdn/shop/');
    return local + (local.indexOf('?') > -1 ? '&' : '?') + 'width=' + width;
  }
  function displayImage(src, width) {
    if (!src) return '';
    return src + (src.indexOf('?') > -1 ? '&' : '?') + 'width=' + width;
  }

  // Colour analysis of a product photo: shares of warm, cool, neutral and "colourful".
  function analyse(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, 4000);
      img.onload = function () {
        if (done) return; done = true; clearTimeout(timer);
        try {
          var c = document.createElement('canvas'); c.width = 40; c.height = 40;
          var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, 40, 40);
          var d = ctx.getImageData(4, 4, 32, 32).data;
          var n = 0, warm = 0, cool = 0, neutral = 0, sat = 0, bins = new Array(12).fill(0);
          for (var i = 0; i < d.length; i += 4) {
            var r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
            var mx = Math.max(r, g, b), mn = Math.min(r, g, b), v = mx, s = mx === 0 ? 0 : (mx - mn) / mx, h = 0;
            if (mx !== mn) {
              if (mx === r) h = (g - b) / (mx - mn) % 6; else if (mx === g) h = (b - r) / (mx - mn) + 2; else h = (r - g) / (mx - mn) + 4;
              h *= 60; if (h < 0) h += 360;
            }
            n++;
            if (s < 0.2 || v < 0.16) { neutral++; continue; }
            sat++; bins[Math.floor(h / 30) % 12]++;
            if (h < 70 || h >= 335) warm++; else if (h >= 150 && h < 275) cool++;
          }
          var hues = bins.filter(function (x) { return x > sat * 0.08; }).length;
          resolve({ warm: warm / n, cool: cool / n, neutral: neutral / n, bright: Math.min(1, Math.max(0, hues - 1) / 4) * (sat / n) });
        } catch (e) { resolve(null); }
      };
      img.onerror = function () { if (!done) { done = true; clearTimeout(timer); resolve(null); } };
      img.src = src;
    });
  }

  // ---------- matching ----------
  function run() {
    var handles = SUBJECT_COLLECTIONS[answers.subject] || ['cloud-search-all-products'];
    Promise.all([
      Promise.all(handles.map(fetchCollection)),
      fetchCollection('mosaic-tile-backsplash'),
      fetchCollection('table-countertop-mosaics'),
      fetchCollection('best-sellers')
    ]).then(function (res) {
      var seen = {}, pool = [];
      res[0].forEach(function (list) { list.forEach(function (p) { if (!seen[p.id]) { seen[p.id] = true; pool.push(p); } }); });
      var backsplash = idSet(res[1]), table = idSet(res[2]), best = idSet(res[3]);
      var scored = [];
      pool.forEach(function (p) {
        var item = score(p, backsplash, table, best);
        if (item) scored.push(item);
      });
      scored.sort(function (a, b) { return b.score - a.score; });
      var shortlist = scored.slice(0, 24);
      return Promise.all(shortlist.map(function (it) {
        return analyse(sameOriginImage(it.image, 120)).then(function (col) {
          if (col && answers.colour) {
            it.colourScore = col[answers.colour] || 0;
            it.score += Math.min(4, it.colourScore * (answers.colour === 'bright' ? 6 : 5));
          }
          return it;
        });
      })).then(function (list) {
        list.sort(function (a, b) { return b.score - a.score; });
        render(list);
      });
    }).catch(function () { render([]); });
  }

  function score(p, backsplash, table, best) {
    var variants = (p.variants || []).map(function (v) {
      return { id: v.id, price: parseFloat(v.price), size: parseSize(v.title), title: v.title };
    }).filter(function (v) { return v.size; });
    if (!variants.length || !p.images || !p.images.length) return null;

    var pick = null, fit = 0;
    variants.forEach(function (v) {
      var s = sizeFits(v.size, answers.size), b = budgetFits(v.price, answers.budget);
      var f = (s && b) ? 3 : (s ? 2 : (b ? 1 : 0));
      if (!pick || f > fit || (f === fit && v.price < pick.price)) { pick = v; fit = f; }
    });
    var reasons = [];
    var sc = fit === 3 ? 6 : (fit === 2 ? 2.5 : (fit === 1 ? 2 : 0));
    if (fit === 3) reasons.push('fits your size and budget');
    else if (fit === 2) reasons.push('fits your size');
    else if (fit === 1) reasons.push('fits your budget');

    var t = (p.title + ' ' + (p.product_type || '')).toLowerCase();
    var place = answers.placement;
    var kw = SUBJECT_KEYWORDS[answers.subject];
    if (kw && kw[0].test(t)) { sc += 3; reasons.unshift(kw[1]); }
    if (place === 'floor') {
      if (/floor|rug|medallion|compass/.test(t)) { sc += 4; reasons.unshift('designed for floors'); }
      else if (/geometric|pattern|roman/.test(t)) sc += 1.5;
    } else if (place === 'backsplash') {
      if (backsplash[p.id] || /backsplash|kitchen/.test(t)) { sc += 4; reasons.unshift('ideal for backsplashes'); }
    } else if (place === 'table') {
      if (table[p.id] || /table/.test(t)) { sc += 4; reasons.unshift('made for table tops'); }
    } else if (place === 'pool') {
      if (/pool/.test(t)) { sc += 4; reasons.unshift('designed for pools'); }
      else if (/sea|ocean|fish|koi|dolphin|turtle|wave|nautical|anchor|seahorse|mermaid/.test(t)) sc += 2;
    } else if (place === 'bathroom') {
      if (/bath|shower/.test(t)) { sc += 4; reasons.unshift('made for bathrooms'); }
      else if (backsplash[p.id] || /backsplash/.test(t)) { sc += 2.5; reasons.unshift('great for wet walls'); }
      else if (/sea|ocean|fish|koi|dolphin|turtle|wave|nautical|seahorse|shell|flower/.test(t)) sc += 1;
    } else if (place === 'wall') {
      if (!/rug|table|floor/.test(t) && !table[p.id]) sc += 1;
    }

    var isGlass = /glass/.test(t), isStone = /marble|stone|roman/.test(t);
    if (answers.material === 'glass') { if (isGlass) { sc += 2; reasons.push('glass'); } else if (isStone) sc -= 1; }
    if (answers.material === 'stone') { if (isStone) { sc += 2; reasons.push('natural stone'); } else if (isGlass) sc -= 1; }
    if (best[p.id]) { sc += 1.5; reasons.push('a best seller'); }

    return {
      score: sc, id: p.id, title: p.title, handle: p.handle, type: p.product_type,
      image: p.images[0].src, variant: pick, reasons: reasons
    };
  }

  // ---------- results ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function card(it, rank) {
    var url = '/products/' + it.handle + '?variant=' + it.variant.id;
    var arUrl = url + '&ar=' + (answers.placement === 'floor' ? 'floor' : 'wall');
    var why = it.reasons.length ? 'Why we picked it: ' + it.reasons.slice(0, 3).join(', ') + '.' : '';
    return '<article class="mm-card">' +
      '<a class="mm-card__media" href="' + url + '">' +
        (rank ? '<span class="mm-card__rank">' + (rank === 1 ? 'Best match' : 'Match #' + rank) + '</span>' : '') +
        '<img src="' + esc(displayImage(it.image, 700)) + '" alt="' + esc(it.title) + '" loading="lazy" width="700" height="875">' +
      '</a>' +
      '<div class="mm-card__body">' +
        (it.type ? '<span class="mm-card__type">' + esc(it.type) + '</span>' : '') +
        '<a href="' + url + '" class="mm-card__title">' + esc(it.title) + '</a>' +
        '<span class="mm-card__size">Size: ' + esc(it.variant.size.label) + '</span>' +
        '<span class="mm-card__price">' + money(it.variant.price) + '</span>' +
        (why ? '<p class="mm-card__why">' + esc(why) + '</p>' : '') +
        '<div class="mm-card__actions"><a href="' + url + '">View details</a><a href="' + arUrl + '">View in your space</a></div>' +
      '</div></article>';
  }

  function render(list) {
    var top = root.querySelector('[data-mm-top]'), more = root.querySelector('[data-mm-more]');
    var moreTitle = root.querySelector('[data-mm-more-title]');
    var chips = root.querySelector('[data-mm-chips]');
    chips.innerHTML = QUESTIONS.map(function (q) {
      var l = cfg.labels[q] && cfg.labels[q][answers[q]];
      return l ? '<span class="mm-chip">' + esc(l) + '</span>' : '';
    }).join('');
    if (!list.length) {
      top.innerHTML = '<p class="mm-empty">We couldn\'t load matches just now. <a href="/collections/all" style="text-decoration:underline">Browse all mosaics</a> or ask our designers below.</p>';
      more.innerHTML = ''; moreTitle.hidden = true;
    } else {
      top.innerHTML = list.slice(0, 3).map(function (it, i) { return card(it, i + 1); }).join('');
      var rest = list.slice(3, 6);
      more.innerHTML = rest.map(function (it) { return card(it, 0); }).join('');
      moreTitle.hidden = !rest.length;
    }
    var body = root.querySelector('[data-mm-body]');
    if (body) {
      var lines = ['Mosaic Matchmaker answers:'];
      QUESTIONS.forEach(function (q) { lines.push('- ' + q + ': ' + ((cfg.labels[q] && cfg.labels[q][answers[q]]) || '-')); });
      lines.push('', 'Top matches:');
      list.slice(0, 6).forEach(function (it, i) {
        lines.push((i + 1) + '. ' + it.title + ' | ' + it.variant.size.label + ' | ' + money(it.variant.price) + ' | ' + location.origin + '/products/' + it.handle + '?variant=' + it.variant.id);
      });
      body.value = lines.join('\n');
    }
    show('results');
  }
})();
