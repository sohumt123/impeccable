// <hc-slot-picker>: a grid of appointment times. Emits `slot-select` with the chosen "HH:MM".
(() => {
  const fmt = (t) => {
    const [h, m] = t.split(':').map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  class HcSlotPicker extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._slots = [];
      this._value = '';
    }

    get value() { return this._value; }
    set slots(list) {
      this._slots = list || [];
      if (!this._slots.includes(this._value)) this._value = '';
      this.render();
    }
    get slots() { return this._slots; }

    connectedCallback() { this.render(); }

    buttons() { return [...this.shadowRoot.querySelectorAll('button')]; }

    choose(t) {
      this._value = t;
      for (const b of this.buttons()) b.setAttribute('aria-pressed', String(b.dataset.t === t));
      this.dispatchEvent(new CustomEvent('slot-select', { detail: t, bubbles: true, composed: true }));
    }

    render() {
      const label = this.getAttribute('label') || 'Available times';
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; }
          .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
          button {
            font: inherit; font-weight: 600; padding: 12px 8px; min-height: 44px; border-radius: 6px;
            border: 1px solid #0f6b66; background: #fff; color: #0f6b66; cursor: pointer;
          }
          button:hover { background: #e3f0ef; }
          button[aria-pressed="true"] { background: #0f6b66; color: #fff; }
          button:focus-visible { outline: 3px solid #e0a100; outline-offset: 2px; }
        </style>
        <div class="grid" role="group" aria-label="${label}">
          ${this._slots.map((t) => `<button type="button" data-t="${t}" aria-pressed="${t === this._value}">${fmt(t)}</button>`).join('')}
        </div>`;
      const grid = this.shadowRoot.querySelector('.grid');
      grid.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) this.choose(b.dataset.t);
      });
      grid.addEventListener('keydown', (e) => {
        const btns = this.buttons();
        const i = btns.indexOf(this.shadowRoot.activeElement);
        if (i < 0) return;
        let n = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = i - 1;
        else if (e.key === 'Tab') n = e.shiftKey ? i - 1 : i + 1;
        else return;
        e.preventDefault();
        btns[(n + btns.length) % btns.length].focus();
      });
    }
  }

  customElements.define('hc-slot-picker', HcSlotPicker);
})();
