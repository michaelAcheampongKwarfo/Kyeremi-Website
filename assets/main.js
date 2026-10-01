(function () {
  const config = window.VERGE_CONFIG || {};

  // Fill placeholders: data-config="supportEmail" etc. Links with
  // data-config-mailto get a mailto: href, optionally with a subject.
  document.querySelectorAll('[data-config]').forEach((el) => {
    const value = config[el.dataset.config];
    if (value) el.textContent = value;
  });
  document.querySelectorAll('[data-config-mailto]').forEach((el) => {
    const subject = el.dataset.subject
      ? `?subject=${encodeURIComponent(el.dataset.subject)}`
      : '';
    el.href = `mailto:${config.supportEmail}${subject}`;
  });

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Mobile menu.
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }),
    );
  }

  // Waitlist forms. Insert-only: the site can add an email but never read
  // the list. A repeat email comes back as 409 and is treated as success.
  document.querySelectorAll('form.waitlist').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button');
    const status = form.querySelector('.form-status');
    const trap = form.querySelector('input[name="website"]');

    const show = (message, kind) => {
      status.textContent = message;
      status.dataset.kind = kind;
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      // Bots fill every field; people never see this one.
      if (trap && trap.value) return;

      const email = input.value.trim();
      if (!input.checkValidity() || !email) {
        show('Enter a valid email address.', 'error');
        input.focus();
        return;
      }

      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Joining…';
      show('', '');

      try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/waitlist`, {
          method: 'POST',
          headers: {
            apikey: config.supabaseKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ email, source: form.dataset.source || 'site' }),
        });

        if (response.ok) {
          form.reset();
          show("You're on the list. We'll email you once when Verge launches.", 'success');
        } else if (response.status === 409) {
          show("You're already on the list. We'll be in touch.", 'success');
        } else if (response.status === 400) {
          show('That email address doesn’t look right. Please check it.', 'error');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (_) {
        show("Couldn't join right now. Check your connection and try again.", 'error');
      } finally {
        button.disabled = false;
        button.textContent = label;
      }
    });
  });
})();
