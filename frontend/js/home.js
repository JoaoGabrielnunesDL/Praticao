// Todo elemento com data-protegido="pagina.html" exige login antes de abrir a página.
document.querySelectorAll('[data-protegido]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    Auth.irPara(el.dataset.protegido);
  });
});
