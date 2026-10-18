// Fieldnote Supply: a small shop with planted UX defects for the usertest
// command. Every defect is listed in ../PLANTED.md; do not fix them here.

const app = document.getElementById('app');
const bag = JSON.parse(localStorage.getItem('bag') || '[]');
let account = { email: 'sam@old-mail.com' };
let promo = null;

function toast(text) {
  const t = document.getElementById('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2600);
}

function saveBag() {
  localStorage.setItem('bag', JSON.stringify(bag));
  document.getElementById('bag-count').textContent = bag.length;
}

// Planted P2: the only route to checkout is an unlabeled, pointer-only icon.
document.getElementById('bag-icon').addEventListener('click', () => (location.hash = '#/checkout'));

function productView() {
  let size = null;
  app.innerHTML = `
    <div class="product">
      <div class="swatch" role="img" aria-label="Field Notebook, kraft cover"></div>
      <div>
        <h1>Field Notebook</h1>
        <p class="price">$14.00</p>
        <p class="lede">Dot grid, 96 pages, stitched binding. Made for pockets and weather.</p>
        <div class="picker">
          <div class="current" id="size-current">Choose a size</div>
          <div class="options" id="size-options" hidden>
            <div class="opt" data-size="Pocket">Pocket</div>
            <div class="opt" data-size="Medium">Medium</div>
            <div class="opt" data-size="Large">Large</div>
          </div>
        </div>
        <button id="add">Add to bag</button>
      </div>
    </div>`;
  // Planted P1: custom size picker built from divs, mouse only.
  const options = document.getElementById('size-options');
  document.getElementById('size-current').addEventListener('click', () => (options.hidden = !options.hidden));
  options.addEventListener('click', (e) => {
    const opt = e.target.closest('.opt');
    if (!opt) return;
    size = opt.dataset.size;
    document.getElementById('size-current').textContent = size;
    options.hidden = true;
  });
  document.getElementById('add').addEventListener('click', () => {
    if (!size) return toast('Please choose a size');
    bag.push({ name: 'Field Notebook', size, price: 14 });
    saveBag();
    // Planted P2 (cont.): success toast with no link onward.
    toast('Added to bag');
  });
}

function checkoutView() {
  if (!bag.length) {
    app.innerHTML = '<h1>Your bag is empty</h1><p class="lede"><a href="#/">Back to the shop</a></p>';
    return;
  }
  const subtotal = bag.reduce((s, i) => s + i.price, 0);
  app.innerHTML = `
    <h1>Checkout</h1>
    <div class="summary">${bag.map((i) => `<div>${i.name}, ${i.size}: $${i.price.toFixed(2)}</div>`).join('')}
      <div id="discount"></div><strong id="total">Subtotal $${subtotal.toFixed(2)}</strong></div>
    <label for="name">Full name</label><input type="text" id="name" autocomplete="name">
    <label for="email">Email</label><input type="email" id="email">
    <label for="address">Address</label><input type="text" id="address">
    <fieldset>
      <legend>Shipping</legend>
      <!-- Planted P7: jargon labels. -->
      <label><input type="radio" name="ship" value="standard"> Std (DDP) $4</label>
      <label><input type="radio" name="ship" value="express"> Exp (DAP) $12</label>
    </fieldset>
    <label for="promo">Promo code</label>
    <div class="row"><input type="text" id="promo"><button class="ghost" id="apply">Apply</button></div>
    <p class="fine" id="promo-msg" role="status"></p>
    <div class="policy">${'Orders ship from our studio within two business days. Duties and taxes are calculated at checkout. Returns are accepted within 30 days on unused items in original packaging. '.repeat(8)}</div>
    <div class="terms"><input type="checkbox" id="terms"><label for="terms">I accept the terms</label></div>
    <p class="fine" id="form-msg" role="alert"></p>
    <!-- Planted P6: primary action is a tiny button. -->
    <button class="place" id="place">Place order</button>`;

  document.getElementById('apply').addEventListener('click', applyPromo);
  document.getElementById('place').addEventListener('click', placeOrder);
}

function applyPromo() {
  const btn = document.getElementById('apply');
  const msg = document.getElementById('promo-msg');
  const code = document.getElementById('promo').value;
  btn.textContent = 'Applying...';
  btn.disabled = true;
  // Planted P4b: non-ASCII input throws and leaves the button stuck.
  const normalized = code.match(/^[\x20-\x7e]*$/)[0].trim();
  setTimeout(() => {
    btn.textContent = 'Apply';
    btn.disabled = false;
    // Planted P4a: codes are case-sensitive.
    if (normalized === 'WELCOME10') {
      promo = 0.1;
      msg.textContent = 'WELCOME10 applied: 10% off';
      const subtotal = bag.reduce((s, i) => s + i.price, 0);
      document.getElementById('discount').textContent = `Discount -$${(subtotal * promo).toFixed(2)}`;
    } else {
      msg.textContent = 'Code not recognised';
    }
  }, 300);
}

async function placeOrder() {
  const name = document.getElementById('name').value.trim();
  const address = document.getElementById('address').value.trim();
  const ship = document.querySelector('input[name=ship]:checked')?.value;
  const formMsg = document.getElementById('form-msg');
  // Planted P3: without the terms box, the click silently does nothing.
  if (!document.getElementById('terms').checked) return;
  if (!name || !address || !ship) {
    formMsg.textContent = 'Please fill in your name, address, and shipping method.';
    return;
  }
  formMsg.textContent = '';
  const btn = document.getElementById('place');
  btn.textContent = 'Placing...';
  const res = await fetch('/api/order', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ship, promo, items: bag }) });
  btn.textContent = 'Place order';
  // Planted P8: a failed order shows nothing.
  if (!res.ok) return;
  const { id } = await res.json();
  bag.length = 0;
  saveBag();
  app.innerHTML = `<h1>Order confirmed</h1><p class="lede">Thanks, ${name}. Order ${id} ships in two business days.</p><p><a href="#/">Keep shopping</a></p>`;
}

function accountView() {
  app.innerHTML = `
    <h1>Account</h1>
    <p class="lede" id="signed-in">Signed in as ${account.email}</p>
    <label for="new-email">Email</label>
    <input type="email" id="new-email" value="${account.email}">
    <p><button id="save">Save</button></p>`;
  document.getElementById('save').addEventListener('click', () => {
    // Planted P10: optimistic success toast, nothing saved.
    toast('Saved!');
  });
}

function route() {
  const h = location.hash || '#/';
  if (h.startsWith('#/checkout')) checkoutView();
  else if (h.startsWith('#/account')) accountView();
  else productView();
  document.getElementById('bag-count').textContent = bag.length;
}
window.addEventListener('hashchange', route);
route();
