(function () {
  var KEY = 'the100-theme';
  var ORDER = ['system', 'light', 'dark'];
  var LABEL = { system: 'System', light: 'Hell', dark: 'Dunkel' };
  var root = document.documentElement;
  var button = document.getElementById('theme-toggle');
  if (!button) return;

  function read() {
    try {
      var value = localStorage.getItem(KEY);
      return value === 'light' || value === 'dark' ? value : 'system';
    } catch (e) {
      return 'system';
    }
  }

  function write(value) {
    try {
      if (value === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, value);
    } catch (e) {}
  }

  function apply(value) {
    if (value === 'system') delete root.dataset.theme;
    else root.dataset.theme = value;
    button.textContent = 'Farbschema: ' + LABEL[value];
  }

  var current = read();
  apply(current);
  button.hidden = false;
  button.addEventListener('click', function () {
    current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    write(current);
    apply(current);
  });
})();
