// Start from usable HTML. Collapse navigation, tabs and the form only after setup.
export {};

const menuToggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const navElement = document.querySelector<HTMLElement>('#navigation');
if (menuToggle && navElement) {
  const closeMenu = () => {
    navElement.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    navElement.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  document.addEventListener('click', event => {
    if (!navElement.contains(event.target as Node) && !menuToggle.contains(event.target as Node)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuToggle.focus();
    }
  });
  navElement.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  matchMedia('(min-width:681px)').addEventListener('change', event => {
    if (event.matches) closeMenu();
  });
  navElement.closest('header')?.setAttribute('data-menu-ready', '');
  menuToggle.hidden = false;
}

document.querySelectorAll<HTMLElement>('[data-workflow]').forEach(workflow => {
  const tabs = [...workflow.querySelectorAll<HTMLAnchorElement>('[data-workflow-tab]')];
  const tablist = workflow.querySelector<HTMLElement>('[data-workflow-tabs]');
  if (!tabs.length || !tablist) return;
  tablist.setAttribute('role', 'tablist');
  const choose = (tab: HTMLAnchorElement) => tabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    const panel = workflow.querySelector<HTMLElement>(item.hash);
    if (panel) panel.hidden = !active;
  });
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', tab.hash.slice(1));
    const panel = workflow.querySelector<HTMLElement>(tab.hash);
    panel?.setAttribute('role', 'tabpanel');
    if (panel) panel.tabIndex = 0;
    tab.addEventListener('click', event => { event.preventDefault(); choose(tab); });
    tab.addEventListener('keydown', event => {
      let next: number | undefined;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (event.key === ' ') { event.preventDefault(); choose(tab); }
      if (next !== undefined) { event.preventDefault(); choose(tabs[next]); tabs[next].focus(); }
    });
  });
  const orientation = matchMedia('(max-width:680px)');
  const updateOrientation = () => tablist.setAttribute('aria-orientation', orientation.matches ? 'horizontal' : 'vertical');
  orientation.addEventListener('change', updateOrientation);
  updateOrientation();
  choose(tabs.find(tab => tab.hash === location.hash) || tabs[0]);
  workflow.setAttribute('data-workflow-ready', '');
});

const form = document.querySelector<HTMLFormElement>('[data-enquiry-form]');
if (form) {
  const topic = form.querySelector<HTMLSelectElement>('#interest')!;
  const feedback = form.querySelector<HTMLElement>('[data-form-feedback]')!;
  const result = form.querySelector<HTMLElement>('[data-email-result]')!;
  const draft = form.querySelector<HTMLTextAreaElement>('[data-email-draft]')!;
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
  const fieldset = form.querySelector<HTMLFieldSetElement>('fieldset')!;
  const requested = new URLSearchParams(location.search).get('interest');
  if ([...topic.options].some(option => option.value === requested)) topic.value = requested!;
  const recipient = form.dataset.recipient!;
  let sending = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity()) return;
    const fields = new FormData(form);
    const payload = {
      email: String(fields.get('email') || '').trim(),
      interest: topic.options[topic.selectedIndex].textContent || '',
      message: String(fields.get('message') || '').trim(),
    };
    const endpoint = form.dataset.endpoint;
    if (endpoint) {
      sending = true;
      fieldset.disabled = true;
      submit.disabled = true;
      form.setAttribute('aria-busy', 'true');
      feedback.textContent = 'Sending your enquiry…';
      try {
        const url = new URL(endpoint);
        if (url.protocol !== 'https:') throw new Error('An HTTPS form endpoint is required.');
        const response = await fetch(url, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error('The enquiry could not be submitted.');
        feedback.textContent = 'Your enquiry has been sent. Thank you for getting in touch.';
        form.reset();
        result.hidden = true;
      } catch {
        feedback.textContent = `We could not confirm delivery. Please email ${recipient} directly. Your details remain in the form.`;
      } finally {
        sending = false;
        fieldset.disabled = false;
        submit.disabled = false;
        form.removeAttribute('aria-busy');
      }
      return;
    }
    const subject = `Cyentific enquiry: ${payload.interest}`;
    const body = `Hello Cyentific,\n\n${payload.message || 'I would like to discuss ' + payload.interest.toLowerCase() + '.'}\n\nWork email: ${payload.email}\nInterest: ${payload.interest}`;
    draft.value = `To: ${recipient}\nSubject: ${subject}\n\n${body}`;
    form.querySelector<HTMLAnchorElement>('[data-open-email]')!.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    result.hidden = false;
    feedback.textContent = 'Draft prepared. It has not been sent.';
    result.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
  });
  form.querySelector('[data-copy-email]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.value);
      feedback.textContent = 'Enquiry copied. Paste it into your email app to send.';
    } catch {
      draft.focus(); draft.select();
      feedback.textContent = 'Select and copy the prepared enquiry above.';
    }
  });
  // Disabled controls and a POST method protect the fallback if this script is unavailable.
  fieldset.disabled = false;
  form.hidden = false;
  document.querySelector<HTMLElement>('[data-enquiry-fallback]')?.setAttribute('hidden', '');
}
