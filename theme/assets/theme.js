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
