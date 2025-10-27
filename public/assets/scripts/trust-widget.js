(function () {
  const widget = document.querySelector('[data-trust-widget]');
  if (!widget) {
    return;
  }

  const modalId = widget.getAttribute('aria-controls');
  const modal = document.getElementById(modalId);
  if (!modal) {
    return;
  }

  const panel = modal.querySelector('.trust-modal__panel');
  const evidenceContainer = modal.querySelector('#trust-modal-evidence');
  const scoreEls = [
    document.getElementById('trust-widget-score'),
    document.getElementById('trust-modal-score'),
  ];
  const attractionEl = document.getElementById('trust-modal-a');
  const mLiftEl = document.getElementById('trust-modal-m');
  const updatedEl = document.getElementById('trust-modal-updated');
  const howLink = document.getElementById('trust-modal-how');
  const closeElements = modal.querySelectorAll('[data-close]');
  let focusableElements = [];
  let previouslyFocused;

  const TRUST_FOCUS_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  function refreshFocusable() {
    focusableElements = Array.from(
      panel.querySelectorAll(TRUST_FOCUS_SELECTORS.join(','))
    );
  }

  function openModal() {
    if (!modal.hidden) return;
    previouslyFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    widget.setAttribute('aria-expanded', 'true');
    modal.dispatchEvent(new CustomEvent('trust:open'));
    refreshFocusable();
    const target = focusableElements.find((el) => el.dataset && el.dataset.focus === 'initial');
    if (target) {
      target.focus();
    } else if (panel) {
      panel.setAttribute('tabindex', '-1');
      panel.focus();
    }
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    widget.setAttribute('aria-expanded', 'false');
    if (panel && panel.hasAttribute('tabindex')) {
      panel.removeAttribute('tabindex');
    }
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== 'Tab' || focusableElements.length === 0) {
      return;
    }
    const { activeElement } = document;
    const currentIndex = focusableElements.indexOf(activeElement);
    let nextIndex = currentIndex;
    if (event.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === focusableElements.length - 1 ? 0 : currentIndex + 1;
    }
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      focusableElements[nextIndex].focus();
    }
  }

  widget.addEventListener('click', openModal);
  widget.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal();
    }
  });

  closeElements.forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  modal.addEventListener('keydown', handleKeydown);
  modal.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.dataset.close === 'true') {
      closeModal();
    }
  });

  function renderEvidence(evidence) {
    evidenceContainer.textContent = '';
    if (!Array.isArray(evidence) || evidence.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'trust-modal__empty';
      empty.textContent = 'No supporting evidence is available yet.';
      evidenceContainer.appendChild(empty);
      refreshFocusable();
      return;
    }

    const fragment = document.createDocumentFragment();
    evidence.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'trust-modal__evidence';

      if (item.metric) {
        const metric = document.createElement('span');
        metric.className = 'trust-modal__metric';
        metric.textContent = item.metric;
        article.appendChild(metric);
      }

      const title = document.createElement('h3');
      title.textContent = item.title || 'Untitled insight';
      article.appendChild(title);

      if (item.description) {
        const description = document.createElement('p');
        description.textContent = item.description;
        article.appendChild(description);
      }

      if (item.source) {
        const source = document.createElement('p');
        source.className = 'trust-modal__source';
        source.textContent = item.source;
        article.appendChild(source);
      }

      fragment.appendChild(article);
    });

    evidenceContainer.appendChild(fragment);
    refreshFocusable();
  }

  function populateTrustData(data) {
    if (!data) return;
    if (typeof data.score !== 'undefined') {
      scoreEls.forEach((el) => {
        if (el) {
          el.textContent = String(data.score);
        }
      });
      widget.setAttribute('aria-label', `Trust score ${data.score}`);
    }
    if (attractionEl && data.attraction) {
      attractionEl.textContent = data.attraction;
    }
    if (mLiftEl && data.mLift) {
      mLiftEl.textContent = data.mLift;
    }
    if (updatedEl && data.updated) {
      const updatedDate = new Date(data.updated);
      if (!Number.isNaN(updatedDate.getTime())) {
        updatedEl.dateTime = updatedDate.toISOString();
        updatedEl.textContent = updatedDate.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    }
    if (howLink && data.howUrl) {
      howLink.href = data.howUrl;
    }
    renderEvidence(data.evidence);
  }

  function showError(message) {
    evidenceContainer.textContent = '';
    const error = document.createElement('p');
    error.className = 'trust-modal__error';
    error.textContent = message;
    evidenceContainer.appendChild(error);
    refreshFocusable();
  }

  const source = widget.dataset.trustSource;
  if (source) {
    fetch(source)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load trust data: ${response.status}`);
        }
        return response.json();
      })
      .then(populateTrustData)
      .catch(() => {
        showError('Trust data is temporarily unavailable. Please try again later.');
      });
  } else {
    showError('Trust data source is not configured.');
  }
})();
