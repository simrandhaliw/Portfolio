// Apply explicit visitor choices before paint. First visit always starts in light mode.
try { if(localStorage.getItem('sim-theme')==='dark') document.documentElement.dataset.theme='dark'; } catch {}
