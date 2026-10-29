// Draft pages are served only by the private local preview server, never published.
if (['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) {
 for (const slot of document.querySelectorAll('[data-preview-case]')) {
  const link = document.createElement('a');
  link.className = 'action-link';
  link.href = `${slot.dataset.previewCase}.html`;
  link.innerHTML = '<span>View case study</span><svg class="icon action-arrow" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 10h13M10 4l6 6-6 6"/></svg>';
  slot.replaceChildren(link);
 }
}
