(function () {
  const config = window.VERGE_CONFIG || {};

  // Fill placeholders: data-config="supportEmail" etc. Links with
  // data-config-mailto get a mailto: href, optionally with a subject.
  document.querySelectorAll('[data-config]').forEach((el) => {
    const value = config[el.dataset.config];
    if (value) el.textContent = value;
  });
  // Phones open their mail app from a mailto: link. Most computers have no
  // mail app set up (people use Gmail in the browser), so a mailto: link
  // does nothing there: on computers, open Gmail's compose window instead.
  const isComputer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('[data-config-mailto]').forEach((el) => {
    const to = encodeURIComponent(config.supportEmail);
    const subject = el.dataset.subject ? encodeURIComponent(el.dataset.subject) : '';
    if (isComputer) {
      el.href = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}${subject ? `&su=${subject}` : ''}`;
      el.target = '_blank';
      el.rel = 'noopener';
    } else {
      el.href = `mailto:${config.supportEmail}${subject ? `?subject=${subject}` : ''}`;
    }
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

  // Where visitors came from: share links tagged like ?ref=whatsapp (or
  // ?utm_source=...). Kept for the visit, so reading another page first
  // still counts. Only short lowercase tags are kept; the database checks
  // the same rule.
  const refKey = 'verge_ref';
  const params = new URLSearchParams(window.location.search);
  const rawRef = (params.get('ref') || params.get('utm_source') || '').toLowerCase();
  let ref = /^[a-z0-9_-]{1,40}$/.test(rawRef) ? rawRef : null;
  try {
    if (ref) sessionStorage.setItem(refKey, ref);
    else ref = sessionStorage.getItem(refKey);
  } catch (_) {
    // Storage blocked (private mode): use this page's tag only.
  }

  // Waitlist forms. Insert-only: the site can add an email but never read
  // the list. A repeat email comes back as 409 and is treated as success.
  document.querySelectorAll('form.waitlist').forEach((form) => {
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const trap = form.querySelector('input[name="website"]');
    const extra = form.querySelector('.form-extra');
    const groups = [...form.querySelectorAll('.chip-group')];

    // Each question takes one answer at most; tapping the chosen chip again
    // clears it.
    groups.forEach((group) => {
      const chips = [...group.querySelectorAll('.chip')];
      chips.forEach((chip) =>
        chip.addEventListener('click', () => {
          const wasOn = chip.getAttribute('aria-pressed') === 'true';
          chips.forEach((c) => c.setAttribute('aria-pressed', 'false'));
          chip.setAttribute('aria-pressed', String(!wasOn));
        }),
      );
    });
    // e.g. { platform: 'iphone', heard_from: 'tiktok' }; null if unanswered.
    const answers = () =>
      Object.fromEntries(
        groups.map((group) => [
          group.dataset.field,
          group.querySelector('.chip[aria-pressed="true"]')?.dataset.value || null,
        ]),
      );
    const clearAnswers = () =>
      form.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));

    // Keep the form short until someone starts signing up.
    const reveal = () => extra?.classList.add('show');
    input.addEventListener('focus', reveal);
    input.addEventListener('input', reveal);

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
          body: JSON.stringify({
            email,
            source: form.dataset.source || 'site',
            ...answers(),
            ref,
          }),
        });

        if (response.ok) {
          form.reset();
          clearAnswers();
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
