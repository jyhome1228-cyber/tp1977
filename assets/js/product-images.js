(() => {
  const images = window.TP_PRODUCT_IMAGES || {};
  document.querySelectorAll('[data-image-slot]').forEach((slot) => {
    const key = slot.dataset.imageSlot;
    const source = images[key];
    if (!source) return;
    slot.innerHTML = source.trim().startsWith('<')
      ? source
      : `<img src="${source}" alt="${slot.dataset.imageAlt || ''}">`;
  });
})();
