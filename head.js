document.querySelectorAll('link[data-async-stylesheet]').forEach((link) => {
  const activate = () => {
    link.media = 'all';
  };

  if (link.sheet) {
    activate();
    return;
  }

  link.addEventListener('load', activate, { once: true });
  window.setTimeout(activate, 3000);
});
