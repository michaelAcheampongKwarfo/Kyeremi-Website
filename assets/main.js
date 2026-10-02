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

  // An email, or a Ghana mobile number in any common form (024 123 4567,
  // 0241234567, +233 24 123 4567), which becomes +233241234567. The database
  // checks the same rules. Returns null if it's neither.
  const parseContact = (raw) => {
    const value = raw.trim();
    if (value.includes('@')) {
      return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? { email: value } : null;
    }
    const match = value.replace(/[\s().-]/g, '').match(/^(?:\+?233|0)([25]\d{8})$/);
    return match ? { phone: `+233${match[1]}` } : null;
  };

  // Waitlist forms. Insert-only: the site can add a sign-up but never read
  // the list. A repeat email or number comes back as 409 and counts as success.
  document.querySelectorAll('form.waitlist').forEach((form) => {
    const input = form.querySelector('input[name="contact"]');
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

    // Once someone has joined, offer early testing. Asked here, not on the
    // form, so joining stays one step. Not offered to iPhone users: testing
    // starts on Android.
    const offer = document.createElement('div');
    offer.className = 'tester-offer';
    offer.hidden = true;
    offer.innerHTML = `
      <p><strong>Want to try Verge before everyone else?</strong> We'll send testers a Play Store link before launch. Use Verge for two weeks and tell us what's confusing.</p>
      <button class="btn btn-small" type="button">Yes, I'd like to test</button>
      <p class="form-status" role="status" aria-live="polite"></p>`;
    status.after(offer);
    const offerButton = offer.querySelector('button');
    const offerStatus = offer.querySelector('.form-status');
    let joined = null;

    const showOffer = (contact) => {
      joined = contact;
      offerButton.hidden = false;
      offerButton.disabled = false;
      offerStatus.textContent = '';
      offer.hidden = false;
    };

    offerButton.addEventListener('click', async () => {
      offerButton.disabled = true;
      try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/waitlist_offer_to_test`, {
          method: 'POST',
          headers: { apikey: config.supabaseKey, 'Content-Type': 'application/json' },
          body: JSON.stringify(joined.email ? { p_email: joined.email } : { p_phone: joined.phone }),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        offerButton.hidden = true;
        offerStatus.textContent = "Thanks! We'll send you a Play Store link before launch.";
        offerStatus.dataset.kind = 'success';
      } catch (_) {
        offerStatus.textContent = "Couldn't save that. Check your connection and try again.";
        offerStatus.dataset.kind = 'error';
        offerButton.disabled = false;
      }
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      // Bots fill every field; people never see this one.
      if (trap && trap.value) return;

      const contact = parseContact(input.value);
      if (!contact) {
        show('Enter your email, or a Ghana phone number like 024 123 4567.', 'error');
        input.focus();
        return;
      }

      button.disabled = true;
      const label = button.textContent;
      button.textContent = 'Joining…';
      show('', '');
      offer.hidden = true;
      const { platform } = answers();

      try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/waitlist`, {
          method: 'POST',
          headers: {
            apikey: config.supabaseKey,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            ...contact,
            source: form.dataset.source || 'site',
            ...answers(),
            ref,
          }),
        });

        if (response.ok) {
          form.reset();
          clearAnswers();
          show(
            `You're on the list. We'll ${contact.email ? 'email' : 'text'} you once when Verge launches.`,
            'success',
          );
          if (platform !== 'iphone') showOffer(contact);
        } else if (response.status === 409) {
          show("You're already on the list. We'll be in touch.", 'success');
          if (platform !== 'iphone') showOffer(contact);
        } else if (response.status === 400) {
          show('That doesn’t look right. Please check it.', 'error');
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
