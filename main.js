/* Glymph Studio — 3D tilt for project cards. ~25 lines, no libraries.
   Does nothing on touch devices or when the OS asks for reduced motion:
   the card is fully styled by CSS and works fine without this file. */

(function () {
  var pointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!pointer || reduced) return;

  var MAX = 7; // degrees of tilt at the card edge

  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    var face = card.querySelector('.project__link');
    if (!face) return;

    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      var y = (e.clientY - r.top) / r.height - 0.5;
      face.style.transform =
        'rotateY(' + (x * MAX * 2).toFixed(2) + 'deg) rotateX(' + (-y * MAX * 2).toFixed(2) + 'deg)';
    });

    card.addEventListener('pointerleave', function () {
      face.style.transform = '';
    });
  });
})();
