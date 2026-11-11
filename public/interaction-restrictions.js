(function () {
  'use strict';
  // These controls restrict ordinary UI interactions; browser tools remain
  // controlled by the visitor and cannot be secured by client-side code.
  var copyAllowedUntil = 0;
  document.addEventListener('click', function (event) {
    if (event.target instanceof Element && event.target.closest('[data-allow-btc-copy]')) copyAllowedUntil = Date.now() + 1000;
  }, true);
  function editable(target) { return target instanceof Element && !!target.closest('input,textarea,[contenteditable="true"]'); }
  ['contextmenu', 'selectstart', 'copy', 'cut', 'paste', 'dragstart'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      if (type === 'paste' && editable(event.target)) return;
      if (type === 'copy' && Date.now() < copyAllowedUntil) return;
      event.preventDefault();
    }, true);
  });
  document.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    var mod = event.ctrlKey || event.metaKey;
    if ((mod && ['a', 'c', 'x', 'u'].includes(key)) || (mod && key === 'v' && !editable(event.target)) ||
        key === 'f12' ||
        (mod && event.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
        (event.metaKey && event.altKey && ['i', 'j', 'c'].includes(key))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  var style = document.createElement('style');
  style.textContent = '*{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}';
  document.head.appendChild(style);
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      var originalWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: function (value) { return Date.now() < copyAllowedUntil ? originalWrite(value) : Promise.reject(new DOMException('Cópia desativada', 'NotAllowedError')); }
      });
    }
  } catch (_) { /* Browser may make this property immutable. */ }
  var execCommand = document.execCommand;
  if (typeof execCommand === 'function') {
    document.execCommand = function (command) {
      if (String(command).toLowerCase()==='copy' && Date.now() < copyAllowedUntil) return execCommand.apply(document, arguments);
      if (['copy', 'cut', 'paste'].includes(String(command).toLowerCase())) return false;
      return execCommand.apply(document, arguments);
    };
  }
}());
