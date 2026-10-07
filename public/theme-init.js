// Run before first paint. Only the theme preference is persisted.
try {
  var savedTheme = localStorage.getItem('web-tools-box.theme');
  document.documentElement.dataset.theme =
    savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
} catch {
  document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
