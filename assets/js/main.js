// Site behaviour: mobile menu, active nav link, card spotlight, contact form.
// Animations are handled in CSS; this file only covers what CSS cannot.

(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.menu-toggle');
  var menu = document.getElementById('nav-menu');

  // Footer year
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile menu
  if (toggle && menu) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('is-open', open);
      header.classList.toggle('menu-open', open);
    };

    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // Highlight the nav link for the section in view (home page only)
  var sectionLinks = document.querySelectorAll('.nav-links a[data-section]');
  if (sectionLinks.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(function (link) {
          if (link.dataset.section === entry.target.id) link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sectionLinks.forEach(function (link) {
      var section = document.getElementById(link.dataset.section);
      if (section) spy.observe(section);
    });
  }

  // Cursor spotlight on cards
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.card');
      if (!card) return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - rect.left) + 'px');
      card.style.setProperty('--my', (e.clientY - rect.top) + 'px');
    }, { passive: true });
  }

  // Contact form: submit over AJAX, fall back to a normal POST without JS
  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = document.getElementById('form-status');
  var button = form.querySelector('button[type="submit"]');
  var label = button.querySelector('.btn-label');
  var fields = ['name', 'email', 'message'].map(function (id) { return document.getElementById(id); });
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var SUCCESS = 'Thanks! Your message has been sent. I will reply soon.';

  var setStatus = function (message, type) {
    status.textContent = message;
    status.className = 'form-status' + (type ? ' is-' + type : '');
  };

  var setLoading = function (loading) {
    button.disabled = loading;
    button.classList.toggle('is-loading', loading);
    label.textContent = loading ? 'Sending...' : 'Send message';
  };

  var validate = function () {
    var firstInvalid = null;
    fields.forEach(function (field) {
      var value = field.value.trim();
      var invalid = !value || (field.type === 'email' && !emailPattern.test(value));
      field.setAttribute('aria-invalid', String(invalid));
      if (invalid && !firstInvalid) firstInvalid = field;
    });
    return firstInvalid;
  };

  // Returning from the no-JS fallback redirect
  if (new URLSearchParams(location.search).get('sent') === '1') {
    setStatus(SUCCESS, 'ok');
    history.replaceState(null, '', location.pathname + location.hash);
  }

  form.addEventListener('input', function (e) {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.value.trim()) {
      e.target.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var invalid = validate();
    if (invalid) {
      var badEmail = invalid.type === 'email' && invalid.value.trim();
      setStatus(badEmail ? 'Please enter a valid email address.' : 'Please fill out all fields.', 'error');
      invalid.focus();
      return;
    }

    var data = Object.fromEntries(new FormData(form).entries());
    delete data._next;

    setLoading(true);
    setStatus('');

    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok || String(json.success) !== 'true') throw new Error(json.message || 'Request failed');
        });
      })
      .then(function () {
        form.reset();
        fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
        setStatus(SUCCESS, 'ok');
      })
      .catch(function () {
        setStatus('Something went wrong. Please email me directly instead.', 'error');
      })
      .finally(function () {
        setLoading(false);
      });
  });
})();
