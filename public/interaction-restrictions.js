(function () {
  'use strict';
  // These controls restrict ordinary UI interactions; browser tools remain
  // controlled by the visitor and cannot be secured by client-side code.
  document.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    var mod = event.ctrlKey || event.metaKey;
    if ((mod && key === 'u') ||
        key === 'f12' ||
        (mod && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}());
