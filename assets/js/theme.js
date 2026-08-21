const DEFAULT_THEME = 'dark';

function setTheme(theme) {
  const normalizedTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', normalizedTheme);
  localStorage.setItem('theme', normalizedTheme);

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const isDark = normalizedTheme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || DEFAULT_THEME;
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(nextTheme);
}

function setupMenuToggle() {
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  if (!navToggle || !nav) {
    return;
  }

  const navIcon = navToggle.querySelector('.nav-toggle-icon');

  const updateNavToggleState = (isOpen) => {
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');

    if (navIcon) {
      navIcon.classList.toggle('bi-list', !isOpen);
      navIcon.classList.toggle('bi-x-lg', isOpen);
    }
  };

  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    updateNavToggleState(isOpen);
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      updateNavToggleState(false);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  setupMenuToggle();
});
