// =========================================================
// LAURA MB — SITE PÚBLICO
// Produtos: Supabase (fonte oficial)
// Carrinho/checkout: etapa atual preservada do projeto original
// =========================================================

const SUPABASE_URL = 'https://kxhgeyblhvnkysywkwwk.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_216TPTCjDS1N37XIAY9ZPQ_AltxdZic';

const KEYS = {
  cart: 'nova_cart_v1',
  orders: 'nova_orders_v1',
  payments: 'nova_payments_v1',
  settings: 'nova_settings_v1'
};

const demoPayments = [
  {id:'pay_pix',name:'Pix',description:'QR Code e Pix Copia e Cola',icon:'PIX',type:'pix',active:true,pixMode:'key',pixKey:'',pixMerchantName:'LAURA MB',pixMerchantCity:'CAMPO GRANDE',pixDescription:'PEDIDO ONLINE'},
  {id:'pay_credit',name:'Cartão de crédito',description:'Parcele em até 6x',icon:'CRÉD',type:'credit',active:true,maxInstallments:6,interestFreeInstallments:6},
  {id:'pay_debit',name:'Cartão de débito',description:'Pagamento à vista',icon:'DÉB',type:'debit',active:true},
  {id:'pay_boleto',name:'Boleto bancário',description:'Vencimento em até 2 dias úteis',icon:'BLT',type:'invoice',active:false}
];

const demoSettings = {
  storeName:'LAURA MB',
  freeShipping:299,
  shipping:19.90,
  email:'',
  favicon:'',
  faviconSource:''
};

let products = [];
let cart = load(KEYS.cart, []);
let orders = load(KEYS.orders, []);
let payments = normalizePayments(load(KEYS.payments, demoPayments), false);
if(localStorage.getItem('nova_payments_schema_v2')!=='1'){
  payments=normalizePayments(payments,true);
  localStorage.setItem(KEYS.payments,JSON.stringify(payments));
  localStorage.setItem('nova_payments_schema_v2','1');
}
let settings = {...structuredCloneSafe(demoSettings), ...load(KEYS.settings, demoSettings)};
if(!settings.storeName || settings.storeName === 'NOVA STORE') settings.storeName = 'LAURA MB';
let storeSettingsUpdatedAt = '';

function cacheBustAsset(url,stamp=''){
  const value=String(url||'').trim();if(!value)return '';
  if(value.startsWith('data:'))return value;
  try{const u=new URL(value);u.searchParams.set('v',String(stamp?Date.parse(stamp)||stamp:Date.now()));return u.toString();}catch{return value;}
}

async function loadStoreSettingsFromSupabase(){
  const select='store_name,support_email,free_shipping_min,default_shipping,favicon_url,updated_at';
  const endpoint=`${SUPABASE_URL}/rest/v1/store_settings?id=eq.1&select=${encodeURIComponent(select)}`;
  try{
    const response=await fetch(endpoint,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY},cache:'no-store'});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const rows=await response.json(),row=Array.isArray(rows)?rows[0]:null;if(!row)return false;
    storeSettingsUpdatedAt=row.updated_at||'';
    settings={...settings,storeName:row.store_name||settings.storeName||'LAURA MB',email:row.support_email||settings.email||'',freeShipping:Number(row.free_shipping_min??settings.freeShipping??299),shipping:Number(row.default_shipping??settings.shipping??19.90),favicon:row.favicon_url?cacheBustAsset(row.favicon_url,row.updated_at):''};
    return true;
  }catch(error){console.warn('Configurações públicas da loja indisponíveis:',error);return false;}
}
let currentProduct = null;
let selectedSize = null;
let checkoutPaymentSession = null;


function load(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if(!raw){ localStorage.setItem(key, JSON.stringify(fallback)); return structuredCloneSafe(fallback); }
    return JSON.parse(raw);
  }catch(e){ return structuredCloneSafe(fallback); }
}
function structuredCloneSafe(v){ return JSON.parse(JSON.stringify(v)); }
function save(key, value){
  try{localStorage.setItem(key, JSON.stringify(value));return true;}
  catch(e){console.error('Falha ao salvar dados locais:',e);return false;}
}
function money(v){ return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function uid(prefix){ return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function normalizePayments(list,ensureDefaults=true){
  let arr=Array.isArray(list)?structuredCloneSafe(list):[];
  arr=arr.map((p,i)=>{
    const out={...p};
    const n=String(out.name||'').toLowerCase();
    if(out.type==='instant' && n.includes('pix'))out.type='pix';
    if(out.type==='card')out.type=n.includes('déb')||n.includes('deb')?'debit':'credit';
    if(out.type==='pix')Object.assign(out,{pixMode:out.pixMode||'key',pixKey:out.pixKey||'',pixMerchantName:out.pixMerchantName||'NOVA STORE',pixMerchantCity:out.pixMerchantCity||'CAMPO GRANDE',pixDescription:out.pixDescription||'PEDIDO ONLINE',pixPayload:out.pixPayload||''});
    if(out.type==='credit'){out.maxInstallments=Math.max(1,Math.min(12,Number(out.maxInstallments||6)));out.interestFreeInstallments=Math.max(1,Math.min(out.maxInstallments,Number(out.interestFreeInstallments||out.maxInstallments)));}
    return out;
  });
  const ensure=(type,base)=>{if(!arr.some(p=>p.type===type))arr.push(structuredCloneSafe(base));};
  if(ensureDefaults){ensure('pix',demoPayments.find(p=>p.type==='pix'));ensure('credit',demoPayments.find(p=>p.type==='credit'));ensure('debit',demoPayments.find(p=>p.type==='debit'));}
  return arr;
}
function clamp(n,min,max){return Math.max(min,Math.min(max,Number(n)||0));}
function normalizeAscii(value,max=99){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9 $%*+\-./:]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);}
function pixTlv(id,value){const v=String(value??'');return id+String(v.length).padStart(2,'0')+v;}
function pixCrc16(payload){let crc=0xFFFF;for(let i=0;i<payload.length;i++){crc^=payload.charCodeAt(i)<<8;for(let j=0;j<8;j++)crc=(crc&0x8000)?((crc<<1)^0x1021):(crc<<1);crc&=0xFFFF;}return crc.toString(16).toUpperCase().padStart(4,'0');}
function pixTxid(value){const s=String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,25);return s||'***';}
function buildPixPayload(payment,amount,txid){
  if(payment.pixMode==='payload'&&String(payment.pixPayload||'').trim())return String(payment.pixPayload).replace(/\s+/g,'').trim();
  const key=String(payment.pixKey||'').trim();if(!key)return '';
  const gui=pixTlv('00','br.gov.bcb.pix');
  const keyField=pixTlv('01',key);
  const desc=normalizeAscii(payment.pixDescription||'',40);
  let merchantAccount=gui+keyField+(desc?pixTlv('02',desc):'');
  if(merchantAccount.length>99)merchantAccount=gui+keyField;
  const merchant=normalizeAscii(payment.pixMerchantName||settings.storeName||'LOJA ONLINE',25)||'LOJA ONLINE';
  const city=normalizeAscii(payment.pixMerchantCity||'CAMPO GRANDE',15)||'CAMPO GRANDE';
  let payload=pixTlv('00','01')+pixTlv('26',merchantAccount)+pixTlv('52','0000')+pixTlv('53','986');
  const numericAmount=Number(amount||0);if(numericAmount>0)payload+=pixTlv('54',numericAmount.toFixed(2));
  payload+=pixTlv('58','BR')+pixTlv('59',merchant)+pixTlv('60',city)+pixTlv('62',pixTlv('05',pixTxid(txid)))+'6304';
  return payload+pixCrc16(payload);
}
function copyTextValue(text,message='Copiado para a área de transferência.'){
  const value=String(text||'');
  if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(value).then(()=>showToast(message)).catch(()=>fallbackCopy());else fallbackCopy();
  function fallbackCopy(){const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();try{document.execCommand('copy');showToast(message);}catch(e){showToast('Não foi possível copiar automaticamente.');}ta.remove();}
}
function renderQrInto(targetId,payload,size=210){
  const target=document.getElementById(targetId);if(!target)return;target.innerHTML='';
  if(!payload){target.innerHTML='<div class="qr-placeholder">Pix indisponível</div>';return;}
  if(typeof QRCode==='undefined'){target.innerHTML='<div class="qr-placeholder">QR indisponível. Use o código Copia e Cola.</div>';return;}
  new QRCode(target,{text:payload,width:size,height:size,colorDark:'#111111',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}


function mapSupabaseProduct(row){
  return {
    id: String(row.id),
    name: row.name || 'Produto',
    slug: row.slug || '',
    category: row.category || 'Moda',
    sku: row.sku || '',
    price: Number(row.price || 0),
    oldPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    stock: Math.max(0, Number(row.stock || 0)),
    sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : ['Único'],
    active: row.active !== false,
    featured: Boolean(row.featured),
    badge: row.badge || '',
    description: row.description || '',
    image: row.main_image_url || 'https://placehold.co/800x1000/f1f1f1/777?text=Produto',
    sortOrder: Number(row.sort_order || 0),
    created: row.created_at ? new Date(row.created_at).getTime() : 0
  };
}

function renderCatalogLoading(){
  const grid=document.getElementById('productGrid');
  const empty=document.getElementById('emptyCatalog');
  if(empty) empty.classList.add('hidden');
  if(grid) grid.innerHTML='<div class="catalog-loading" style="grid-column:1/-1;padding:54px 0;text-align:center;color:#777;font-size:12px;letter-spacing:.4px">Carregando produtos...</div>';
}

async function loadProductsFromSupabase(){
  const select = [
    'id','name','slug','description','category','sku','price','compare_at_price',
    'stock','sizes','active','featured','badge','main_image_url','sort_order','created_at'
  ].join(',');
  const endpoint = `${SUPABASE_URL}/rest/v1/products?select=${encodeURIComponent(select)}`;

  try{
    const response = await fetch(endpoint, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY
      }
    });

    if(!response.ok){
      const detail = await response.text();
      throw new Error(`Supabase respondeu ${response.status}: ${detail}`);
    }

    const rows = await response.json();
    products = Array.isArray(rows) ? rows.map(mapSupabaseProduct) : [];
    return true;
  }catch(error){
    console.error('Não foi possível carregar o catálogo do Supabase:', error);
    products = [];
    const grid=document.getElementById('productGrid');
    if(grid) grid.innerHTML='<div style="grid-column:1/-1;padding:54px 20px;text-align:center"><strong>Não foi possível carregar os produtos agora.</strong><br><span style="display:block;margin-top:8px;color:#777;font-size:12px">Atualize a página em alguns instantes.</span></div>';
    showToast('Não foi possível carregar o catálogo.');
    return false;
  }
}

async function init(){
  renderCatalogLoading();
  renderFooterPayments();
  setupMasks();
  await loadStoreSettingsFromSupabase();
  applyThemeToStore();
  applySiteIdentity();

  const loaded = await loadProductsFromSupabase();
  if(loaded) renderProducts();
  renderCart();
}
document.addEventListener('DOMContentLoaded', init);


function showToast(msg){
  const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show');
  clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}
function toggleSearch(){ document.getElementById('searchBar').classList.toggle('hidden'); document.getElementById('searchInput').focus(); }
function scrollToProducts(){ document.getElementById('catalog').scrollIntoView({behavior:'smooth'}); }
function setCategory(cat){ document.getElementById('categoryFilter').value=cat; renderProducts(); scrollToProducts(); }
function showStoreHome(){ window.scrollTo({top:0,behavior:'smooth'}); }

function getVisibleProducts(){
  let list=products.filter(p=>p.active);
  const cat=document.getElementById('categoryFilter')?.value||'Todos';
  const q=(document.getElementById('searchInput')?.value||'').trim().toLowerCase();
  if(cat!=='Todos') list=list.filter(p=>p.category===cat);
  if(q) list=list.filter(p=>`${p.name} ${p.category} ${p.sku}`.toLowerCase().includes(q));
  const sort=document.getElementById('sortFilter')?.value||'featured';
  if(sort==='low') list.sort((a,b)=>a.price-b.price);
  if(sort==='high') list.sort((a,b)=>b.price-a.price);
  if(sort==='featured') list.sort((a,b)=>(Number(b.featured)-Number(a.featured))||(a.sortOrder-b.sortOrder)||((b.created||0)-(a.created||0)));
  if(sort==='new') list.sort((a,b)=>(b.created||0)-(a.created||0));
  return list;
}
function renderProducts(){
  const grid=document.getElementById('productGrid'); if(!grid) return;
  const list=getVisibleProducts();
  grid.innerHTML=list.map(p=>`
    <article class="product-card">
      <div class="product-image" onclick="openProduct('${p.id}')">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/800x1000/f1f1f1/777?text=Produto'">
        ${p.badge?`<span class="product-badge">${escapeHtml(p.badge)}</span>`:''}
        <button class="quick-add" onclick="event.stopPropagation(); quickAdd('${p.id}')">${p.stock>0?'ADICIONAR AO CARRINHO':'ESGOTADO'}</button>
      </div>
      <div class="product-info" onclick="openProduct('${p.id}')">
        <div class="product-topline">
          <div><div class="product-name">${escapeHtml(p.name)}</div><div class="product-category">${escapeHtml(p.category)}</div></div>
          <div class="product-price">${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:''}${money(p.price)}</div>
        </div>
      </div>
    </article>`).join('');
  document.getElementById('emptyCatalog').classList.toggle('hidden',list.length>0);
}
function openProduct(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  currentProduct=p; selectedSize=(p.sizes&&p.sizes[0])||'Único';
  document.getElementById('modalProductImage').src=p.image;
  document.getElementById('modalProductCategory').textContent=p.category;
  document.getElementById('modalProductName').textContent=p.name;
  document.getElementById('modalProductPrice').innerHTML=`${p.oldPrice?`<span class="old-price">${money(p.oldPrice)}</span>`:''}${money(p.price)}`;
  document.getElementById('modalProductDescription').textContent=p.description||'';
  document.getElementById('modalStock').textContent=p.stock>0?`${p.stock} unidades disponíveis`:'Produto esgotado';
  document.getElementById('modalSizes').innerHTML=(p.sizes||['Único']).map((s,i)=>`<button class="size-btn ${i===0?'selected':''}" onclick="selectSize('${escapeHtml(s)}',this)">${escapeHtml(s)}</button>`).join('');
  const btn=document.getElementById('modalAddButton'); btn.disabled=p.stock<=0; btn.textContent=p.stock>0?'ADICIONAR AO CARRINHO':'PRODUTO ESGOTADO';
  btn.onclick=()=>addToCart(p.id,selectedSize);
  openModal('productModal');
}
function selectSize(size,el){ selectedSize=size; document.querySelectorAll('#modalSizes .size-btn').forEach(b=>b.classList.remove('selected')); el.classList.add('selected'); }
function quickAdd(id){
  const p=products.find(x=>x.id===id); if(!p||p.stock<=0){showToast('Produto esgotado.');return;}
  addToCart(id,(p.sizes&&p.sizes[0])||'Único',false);
}
function addToCart(id,size='Único',close=true){
  const p=products.find(x=>x.id===id); if(!p||p.stock<=0)return;
  const existing=cart.find(x=>x.productId===id&&x.size===size);
  const currentQty=existing?existing.qty:0;
  if(currentQty>=p.stock){showToast('Quantidade máxima em estoque atingida.');return;}
  if(existing)existing.qty++; else cart.push({productId:id,size,qty:1});
  save(KEYS.cart,cart); renderCart(); if(close)closeModal('productModal'); showToast('Produto adicionado ao carrinho.');
}
function renderCart(){
  const totalQty=cart.reduce((s,i)=>s+i.qty,0);
  document.getElementById('cartCount').textContent=totalQty;
  document.getElementById('cartTitleCount').textContent=`${totalQty} ${totalQty===1?'item':'itens'}`;
  const wrap=document.getElementById('cartItems');
  wrap.innerHTML=cart.map((item,idx)=>{
    const p=products.find(x=>x.id===item.productId); if(!p)return '';
    return `<div class="cart-item">
      <img src="${escapeHtml(p.image)}" alt="">
      <div class="cart-item-info"><strong>${escapeHtml(p.name)}</strong><span>Tamanho: ${escapeHtml(item.size)}</span><span>${p.sku}</span>
        <div class="qty-control"><button onclick="changeQty(${idx},-1)">−</button><span>${item.qty}</span><button onclick="changeQty(${idx},1)">+</button></div>
        <button class="remove-link" onclick="removeCartItem(${idx})">Remover</button>
      </div><div class="cart-item-price">${money(p.price*item.qty)}</div>
    </div>`;
  }).join('');
  const empty=cart.length===0;
  document.getElementById('cartEmpty').classList.toggle('hidden',!empty);
  document.getElementById('cartSummary').classList.toggle('hidden',empty);
  document.getElementById('cartSubtotal').textContent=money(cartTotal());
}
function cartTotal(){ return cart.reduce((s,i)=>{const p=products.find(x=>x.id===i.productId); return s+(p?p.price*i.qty:0)},0); }
function changeQty(idx,delta){
  const item=cart[idx]; if(!item)return; const p=products.find(x=>x.id===item.productId);
  if(delta>0&&item.qty>=p.stock){showToast('Quantidade máxima em estoque atingida.');return;}
  item.qty+=delta; if(item.qty<=0)cart.splice(idx,1); save(KEYS.cart,cart);renderCart();
}
function removeCartItem(idx){ cart.splice(idx,1);save(KEYS.cart,cart);renderCart(); }
function openCart(){ document.getElementById('drawerBackdrop').classList.add('open');document.getElementById('cartDrawer').classList.add('open'); }
function closeCart(){ document.getElementById('drawerBackdrop').classList.remove('open');document.getElementById('cartDrawer').classList.remove('open'); }

function openCheckout(){
  if(!cart.length)return;
  checkoutPaymentSession={pixTxid:'PED'+Date.now().toString().slice(-12)};
  closeCart(); renderCheckout(); openModal('checkoutModal');
}
function checkoutTotals(){const subtotal=cartTotal(),shipping=subtotal>=settings.freeShipping?0:Number(settings.shipping||0);return{subtotal,shipping,total:subtotal+shipping};}
function renderCheckout(){
  document.getElementById('checkoutItems').innerHTML=cart.map(i=>{
    const p=products.find(x=>x.id===i.productId); if(!p)return '';
    return `<div class="checkout-item"><img src="${escapeHtml(p.image)}"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(i.size)} • Qtd. ${i.qty}</span></div><span class="checkout-line-price">${money(p.price*i.qty)}</span></div>`;
  }).join('');
  const {subtotal,shipping,total}=checkoutTotals();
  document.getElementById('checkoutSubtotal').textContent=money(subtotal);
  document.getElementById('checkoutShipping').textContent=shipping===0?'Grátis':money(shipping);
  document.getElementById('checkoutTotal').textContent=money(total);
  const active=payments.filter(p=>p.active);
  document.getElementById('paymentOptions').innerHTML=active.length?active.map((p,i)=>`
    <label class="payment-option ${i===0?'selected':''}" onclick="selectPayment(this,'${p.id}')">
      <input type="radio" name="payment" value="${p.id}" ${i===0?'checked':''}>
      <div class="payment-icon">${escapeHtml(p.icon)}</div>
      <span><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(paymentCheckoutDescription(p,total))}</small></span>
    </label>`).join(''):'<div class="empty-state"><strong>Nenhuma forma de pagamento disponível.</strong></div>';
  updateCheckoutPaymentDetails(active[0]?.id||'');
}
function paymentCheckoutDescription(p,total){
  if(p.type==='credit'){const m=clamp(p.maxInstallments||1,1,12);return `Parcele em até ${m}x de ${money(total/m)}`;}
  if(p.type==='debit')return p.description||'Pagamento à vista';
  return p.description||'Disponível no checkout';
}
function selectPayment(el,id){document.querySelectorAll('.payment-option').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');el.querySelector('input').checked=true;updateCheckoutPaymentDetails(id);}
function updateCheckoutPaymentDetails(id){
  const panel=document.getElementById('paymentDetailsPanel'),submit=document.querySelector('.checkout-submit');if(!panel)return;
  const p=payments.find(x=>x.id===id),{total}=checkoutTotals();panel.classList.remove('hidden');if(submit)submit.disabled=false;
  if(!p){panel.classList.add('hidden');return;}
  if(p.type==='pix'){
    const txid=checkoutPaymentSession?.pixTxid||('PED'+Date.now().toString().slice(-12));
    const payload=buildPixPayload(p,total,txid),configured=!!payload;
    panel.innerHTML=`<div class="checkout-payment-detail pix-checkout-detail"><div class="payment-detail-heading"><span class="payment-detail-icon">PIX</span><div><strong>Pagamento via Pix</strong><small>${p.pixMode==='payload'?'QR baseado no código Pix configurado':'QR gerado para '+money(total)}</small></div></div>${configured?`<div class="pix-payment-grid"><div id="checkoutPixQr" class="pix-qr-box"></div><div class="pix-code-side"><span>PIX COPIA E COLA</span><textarea readonly id="checkoutPixCode">${escapeHtml(payload)}</textarea><button type="button" onclick="copyTextValue(document.getElementById('checkoutPixCode').value,'Código Pix copiado!')">COPIAR CÓDIGO PIX</button><small>Abra o app do seu banco, escaneie o QR Code ou use o Pix Copia e Cola.</small></div></div>`:`<div class="payment-config-warning"><strong>Pix ainda não configurado.</strong><span>Esta forma de pagamento ainda não está configurada.</span></div>`}<div class="payment-real-note">O pedido ficará como <strong>aguardando confirmação</strong> até o recebimento ser verificado.</div></div>`;
    if(configured)setTimeout(()=>renderQrInto('checkoutPixQr',payload,205),0);else if(submit)submit.disabled=true;
  }else if(p.type==='credit'){
    const max=clamp(p.maxInstallments||1,1,12),free=clamp(p.interestFreeInstallments||max,1,max);
    panel.innerHTML=`<div class="checkout-payment-detail"><div class="payment-detail-heading"><span class="payment-detail-icon">CRÉD</span><div><strong>Cartão de crédito</strong><small>Escolha o parcelamento</small></div></div><label class="checkout-installment-field"><span>Parcelas</span><select id="checkoutInstallments">${Array.from({length:max},(_,i)=>i+1).map(n=>`<option value="${n}">${n}x de ${money(total/n)}${n<=free?' sem juros':''}</option>`).join('')}</select></label><div class="payment-gateway-note">Os dados do cartão devem ser processados por um gateway seguro. Este sistema não armazena número do cartão nem CVV.</div></div>`;
  }else if(p.type==='debit'){
    panel.innerHTML=`<div class="checkout-payment-detail"><div class="payment-detail-heading"><span class="payment-detail-icon">DÉB</span><div><strong>Cartão de débito</strong><small>Pagamento à vista de ${money(total)}</small></div></div><div class="payment-gateway-note">O débito online deve ser autorizado pelo gateway/banco conectado à loja. Nenhum dado sensível do cartão é armazenado neste site.</div></div>`;
  }else{
    panel.innerHTML=`<div class="checkout-payment-detail"><div class="payment-detail-heading"><span class="payment-detail-icon">${escapeHtml(p.icon)}</span><div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.description||'')}</small></div></div></div>`;
  }
}
function placeOrder(){
  const name=document.getElementById('checkoutName').value.trim(), email=document.getElementById('checkoutEmail').value.trim(), address=document.getElementById('checkoutAddress').value.trim();
  const paymentId=document.querySelector('input[name=payment]:checked')?.value,payment=payments.find(p=>p.id===paymentId);
  if(!name||!email||!address){showToast('Preencha nome, e-mail e endereço.');return;}
  if(!payment){showToast('Selecione uma forma de pagamento.');return;}
  for(const item of cart){ const p=products.find(x=>x.id===item.productId); if(!p||p.stock<item.qty){showToast(`Estoque insuficiente para ${p?.name||'um produto'}.`);return;} }
  const {subtotal,shipping,total}=checkoutTotals();
  let paymentDetails={},paymentStatus='Pendente';
  if(payment.type==='pix'){
    const txid=checkoutPaymentSession?.pixTxid||('PED'+Date.now().toString().slice(-12)),payload=buildPixPayload(payment,total,txid);
    if(!payload){showToast('O Pix ainda não está disponível para pagamento.');return;}
    paymentDetails={pixPayload:payload,pixTxid:txid};paymentStatus='Aguardando confirmação';
  }else if(payment.type==='credit'){
    paymentDetails={installments:Number(document.getElementById('checkoutInstallments')?.value||1)};paymentStatus='Pendente de gateway';
  }else if(payment.type==='debit')paymentStatus='Pendente de gateway';
  const order={
    id:'#'+String(1001+orders.length).padStart(5,'0'),createdAt:new Date().toISOString(),
    customer:{name,email,cpf:document.getElementById('checkoutCpf').value,phone:document.getElementById('checkoutPhone').value,address:`${address}, ${document.getElementById('checkoutNumber').value} - ${document.getElementById('checkoutCity').value}/${document.getElementById('checkoutState').value}`},
    items:structuredCloneSafe(cart),subtotal,shipping,total,paymentId,paymentType:payment.type,paymentDetails,paymentStatus,status:'Recebido'
  };
  cart.forEach(item=>{const p=products.find(x=>x.id===item.productId);p.stock-=item.qty;});orders.unshift(order);cart=[];
  save(KEYS.orders,orders);save(KEYS.cart,cart);renderCart();renderProducts();closeModal('checkoutModal');showOrderSuccess(order,payment);
}
function showOrderSuccess(order,payment){
  document.getElementById('successOrderNumber').textContent=order.id;
  const eyebrow=document.getElementById('successEyebrow'),title=document.getElementById('successTitle'),message=document.getElementById('successMessage'),details=document.getElementById('successPaymentDetails');
  eyebrow.textContent=payment.type==='pix'?'PAGAMENTO PIX':'PEDIDO REGISTRADO';
  title.textContent=payment.type==='pix'?'Finalize o pagamento via Pix':'Pedido registrado com sucesso!';
  message.innerHTML=`Seu pedido <strong>${escapeHtml(order.id)}</strong> foi registrado.`;details.classList.add('hidden');details.innerHTML='';
  if(payment.type==='pix'){
    const payload=order.paymentDetails.pixPayload;details.classList.remove('hidden');details.innerHTML=`<div class="success-pix-wrap"><div id="successPixQr" class="pix-qr-box"></div><div><strong>Total: ${money(order.total)}</strong><span>Status: aguardando confirmação</span><textarea id="successPixCode" readonly>${escapeHtml(payload)}</textarea><button type="button" onclick="copyTextValue(document.getElementById('successPixCode').value,'Código Pix copiado!')">COPIAR PIX</button></div></div>`;setTimeout(()=>renderQrInto('successPixQr',payload,190),0);
  }else if(payment.type==='credit'){
    details.classList.remove('hidden');details.innerHTML=`<div class="order-payment-summary"><strong>Cartão de crédito</strong><span>${order.paymentDetails.installments}x de ${money(order.total/order.paymentDetails.installments)}</span><small>Status: ${escapeHtml(order.paymentStatus)}</small></div>`;
  }else if(payment.type==='debit'){
    details.classList.remove('hidden');details.innerHTML=`<div class="order-payment-summary"><strong>Cartão de débito</strong><span>Pagamento à vista</span><small>Status: ${escapeHtml(order.paymentStatus)}</small></div>`;
  }
  openModal('successModal');
}

function openModal(id){ document.getElementById(id).classList.add('open');document.body.style.overflow='hidden'; }
function closeModal(id){ document.getElementById(id).classList.remove('open'); if(!document.querySelector('.modal-backdrop.open'))document.body.style.overflow=''; }
function modalBackdropClose(e,id){ if(e.target.id===id)closeModal(id); }


function renderFooterPayments(){const el=document.getElementById('footerPayments');if(el)el.textContent=payments.filter(p=>p.active).map(p=>p.name).join(' • ')||'Consulte no checkout';}

function setupMasks(){
  const cpf=document.getElementById('checkoutCpf'); cpf?.addEventListener('input',()=>{let v=cpf.value.replace(/\D/g,'').slice(0,11);cpf.value=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')});
  const cep=document.getElementById('checkoutCep'); cep?.addEventListener('input',()=>{let v=cep.value.replace(/\D/g,'').slice(0,8);cep.value=v.replace(/(\d{5})(\d)/,'$1-$2')});
  const phone=document.getElementById('checkoutPhone'); phone?.addEventListener('input',()=>{let v=phone.value.replace(/\D/g,'').slice(0,11);phone.value=v.length>10?v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'):v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3')});
}

const THEME_KEY = 'nova_theme_published_v1';
const THEME_DRAFT_KEY = 'nova_theme_draft_v1';
const defaultTheme = {
  global:{fontBody:'DM Sans',fontHeading:'Manrope',pageBg:'#ffffff',textColor:'#111111',buttonBg:'#111111',buttonText:'#ffffff',buttonRadius:0},
  announcement:{enabled:true,text:'FRETE GRÁTIS ACIMA DE R$ 299 • TROCA FÁCIL • COMPRA SEGURA',bg:'#111111',color:'#ffffff'},
  header:{enabled:true,logo:'LAURA MB',logoImage:'',logoImageSource:'',logoImageSize:38,sticky:true,bg:'#ffffff',color:'#111111'},
  hero:{enabled:true,eyebrow:'COLEÇÃO 2026',title:'Design que combina\ncom a sua rotina.',text:'Peças selecionadas para vestir, viver e transformar o seu dia.',primary:'COMPRAR AGORA',secondary:'VER COLEÇÃO',primaryBg:'#ffffff',primaryText:'#111111',primaryHoverBg:'#111111',primaryHoverText:'#ffffff',secondaryBg:'transparent',secondaryText:'#ffffff',secondaryBorder:'#ffffff',secondaryHoverBg:'#ffffff',secondaryHoverText:'#111111',image:'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=88',height:72,overlay:46,align:'left'},
  benefits:{enabled:true,items:[
    {title:'Compra segura',text:'Ambiente protegido'},
    {title:'Entrega para todo Brasil',text:'Consulte o prazo no checkout'},
    {title:'Troca facilitada',text:'Processo simples e rápido'}
  ]},
  catalog:{enabled:true,eyebrow:'SELEÇÃO ESPECIAL',title:'Descubra seus favoritos',columns:4,bg:'#ffffff'},
  editorial:{enabled:true,eyebrow:'LAURA MB',title:'Menos excesso.\nMais identidade.',text:'Uma curadoria de peças versáteis, pensadas para durar além da tendência.',button:'EXPLORAR',buttonBg:'#ffffff',buttonText:'#111111',buttonHoverBg:'#111111',buttonHoverText:'#ffffff',image:'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1900&q=88',overlay:48},
  newsletter:{enabled:true,eyebrow:'FIQUE POR DENTRO',title:'Novidades primeiro, direto para você.',button:'CADASTRAR',buttonBg:'#111111',buttonText:'#ffffff',buttonHoverBg:'#ffffff',buttonHoverText:'#111111',bg:'#f6f6f3'},
  footer:{enabled:true,bg:'#111111',color:'#ffffff'},
  order:['hero','benefits','catalog','editorial','newsletter']
};
function mergeThemeDefaults(base,current){
  if(Array.isArray(base))return Array.isArray(current)?structuredCloneSafe(current):structuredCloneSafe(base);
  if(base&&typeof base==='object'){const out={};for(const k of Object.keys(base))out[k]=mergeThemeDefaults(base[k],current?.[k]);for(const k of Object.keys(current||{}))if(!(k in out))out[k]=structuredCloneSafe(current[k]);return out;}
  return current===undefined?base:current;
}
let themePublished = mergeThemeDefaults(defaultTheme, load(THEME_KEY, defaultTheme));
if(themePublished?.header && (!themePublished.header.logo || themePublished.header.logo === 'NOVA STORE')) themePublished.header.logo='LAURA MB';


function renderFaviconPreview(){const el=document.getElementById('faviconPreview');if(!el)return;el.innerHTML=settings.favicon?`<img src="${settings.favicon}" alt="Ícone atual">`:`<span>${escapeHtml((settings.storeName||'N').trim().charAt(0).toUpperCase()||'N')}</span>`;}
function applySiteIdentity(){
  const favicon=settings.favicon||'';
  let fav=document.getElementById('siteFavicon');
  if(!fav){fav=document.createElement('link');fav.id='siteFavicon';fav.rel='icon';document.head.appendChild(fav)}
  fav.href=favicon||'data:,';
  let shortcut=document.getElementById('siteShortcutIcon');if(!shortcut){shortcut=document.createElement('link');shortcut.id='siteShortcutIcon';shortcut.rel='shortcut icon';document.head.appendChild(shortcut)}shortcut.href=favicon||'data:,';
  let apple=document.getElementById('siteAppleIcon');if(!apple){apple=document.createElement('link');apple.id='siteAppleIcon';apple.rel='apple-touch-icon';document.head.appendChild(apple)}apple.href=favicon||'data:,';
  document.title=`${settings.storeName||themePublished?.header?.logo||'Loja Online'} — Loja Online`;
  const checkout=document.querySelector('#checkoutModal .checkout-top .brand');if(checkout)renderBrandElement(checkout,themePublished);
}
function renderBrandElement(el,t=themePublished,footer=false){
  if(!el)return;const image=t?.header?.logoImage||'',name=t?.header?.logo||settings.storeName||'Loja';const size=Number(t?.header?.logoImageSize)||38;
  el.innerHTML=`${image?`<img class="brand-logo-image" src="${image}" alt="${escapeHtml(name)}" style="height:${footer?Math.round(size*1.15):size}px">`:''}<span class="brand-name">${escapeHtml(name)}</span>`;
}

function applyThemeToStore(){
  const t=themePublished||defaultTheme,store=document.getElementById('storeApp');if(!store)return;
  let style=document.getElementById('themeRuntimeStyle');if(!style){style=document.createElement('style');style.id='themeRuntimeStyle';document.head.appendChild(style)}
  style.textContent=`#storeApp{font-family:'${String(t.global.fontBody).replace(/'/g,'')}',Arial,sans-serif;background:${t.global.pageBg};color:${t.global.textColor}}#storeApp h1,#storeApp h2,#storeApp .brand,#storeApp .footer-brand{font-family:'${String(t.global.fontHeading).replace(/'/g,'')}',Arial,sans-serif}#storeApp .btn-dark{background:${t.global.buttonBg};color:${t.global.buttonText};border-radius:${Number(t.global.buttonRadius)||0}px}#storeApp .btn-light,#storeApp .btn-ghost-light{border-radius:${Number(t.global.buttonRadius)||0}px}#storeApp .hero-actions button,#storeApp .editorial-banner button,#storeApp .newsletter-form button{transition:background-color .22s ease,color .22s ease,transform .22s ease,box-shadow .22s ease}#storeApp .hero-actions button:hover,#storeApp .editorial-banner button:hover,#storeApp .newsletter-form button:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.16)}#heroSection .hero-actions button:first-child:hover{background:${t.hero.primaryHoverBg}!important;color:${t.hero.primaryHoverText}!important}#heroSection .hero-actions button:nth-child(2):hover{background:${t.hero.secondaryHoverBg}!important;color:${t.hero.secondaryHoverText}!important}#editorialSection button:hover{background:${t.editorial.buttonHoverBg}!important;color:${t.editorial.buttonHoverText}!important}#newsletterSection .newsletter-form button:hover{background:${t.newsletter.buttonHoverBg}!important;color:${t.newsletter.buttonHoverText}!important}`;
  const ann=document.getElementById('announcementBar');if(ann){ann.style.display=t.announcement.enabled?'':'none';ann.textContent=t.announcement.text;ann.style.background=t.announcement.bg;ann.style.color=t.announcement.color}
  const header=document.querySelector('#storeApp .store-header');if(header){header.style.display=t.header.enabled?'grid':'none';header.style.background=t.header.bg;header.style.color=t.header.color;header.style.position=t.header.sticky?'sticky':'relative'}
  document.querySelectorAll('#storeApp .brand').forEach(b=>renderBrandElement(b,t,false));
  const hero=document.getElementById('heroSection');if(hero){hero.style.display=t.hero.enabled?'flex':'none';hero.style.minHeight=`${t.hero.height}vh`;hero.style.backgroundImage=`url("${t.hero.image}")`;hero.style.backgroundPosition='center';const ov=hero.querySelector('.hero-overlay');if(ov)ov.style.background=`linear-gradient(90deg,rgba(0,0,0,${Number(t.hero.overlay)/100}),rgba(0,0,0,.05) 70%)`;const c=hero.querySelector('.hero-content');if(c){c.style.textAlign=t.hero.align;c.style.margin=t.hero.align==='center'?'0 auto':t.hero.align==='right'?'0 0 0 auto':''}const e=hero.querySelector('.eyebrow');if(e)e.textContent=t.hero.eyebrow;const h=hero.querySelector('h1');if(h)h.innerHTML=escapeHtml(t.hero.title).replace(/\n/g,'<br>');const p=hero.querySelector('p');if(p)p.textContent=t.hero.text;const bs=hero.querySelectorAll('.hero-actions button');if(bs[0])bs[0].textContent=t.hero.primary;if(bs[1])bs[1].textContent=t.hero.secondary}
  const benefits=document.getElementById('benefitsSection');if(benefits){benefits.style.display=t.benefits.enabled?'grid':'none';[...benefits.children].forEach((d,i)=>{if(t.benefits.items[i]){d.querySelector('strong').textContent=t.benefits.items[i].title;d.querySelector('span').textContent=t.benefits.items[i].text}})}
  const catalog=document.getElementById('catalog');if(catalog){catalog.style.display=t.catalog.enabled?'block':'none';catalog.style.background=t.catalog.bg;catalog.querySelector('.eyebrow').textContent=t.catalog.eyebrow;catalog.querySelector('h2').textContent=t.catalog.title;store.style.setProperty('--catalog-columns',Number(t.catalog.columns)||4)}
  const editorial=document.getElementById('editorialSection');if(editorial){editorial.style.display=t.editorial.enabled?'flex':'none';editorial.style.backgroundImage=`url("${t.editorial.image}")`;editorial.querySelector('.eyebrow').textContent=t.editorial.eyebrow;editorial.querySelector('h2').innerHTML=escapeHtml(t.editorial.title).replace(/\n/g,'<br>');editorial.querySelector('p').textContent=t.editorial.text;editorial.querySelector('button').textContent=t.editorial.button;let pseudo=document.getElementById('editorialRuntimeStyle');if(!pseudo){pseudo=document.createElement('style');pseudo.id='editorialRuntimeStyle';document.head.appendChild(pseudo)}pseudo.textContent=`#editorialSection:before{background:linear-gradient(90deg,rgba(0,0,0,${Number(t.editorial.overlay)/100}),transparent 70%)!important}`}
  const news=document.getElementById('newsletterSection');if(news){news.style.display=t.newsletter.enabled?'block':'none';news.style.background=t.newsletter.bg;news.querySelector('.eyebrow').textContent=t.newsletter.eyebrow;news.querySelector('h2').textContent=t.newsletter.title;const newsBtn=news.querySelector('.newsletter-form button');if(newsBtn){newsBtn.textContent=t.newsletter.button;newsBtn.style.background=t.newsletter.buttonBg;newsBtn.style.color=t.newsletter.buttonText;newsBtn.style.padding='0 14px';newsBtn.style.borderRadius=`${Number(t.global.buttonRadius)||0}px`;newsBtn.style.minWidth='120px'}}
  const footer=document.getElementById('storeFooter');if(footer){footer.style.display=t.footer.enabled?'grid':'none';footer.style.background=t.footer.bg;footer.style.color=t.footer.color;const fb=footer.querySelector('.footer-brand');if(fb)renderBrandElement(fb,t,true)}
  const main=store.querySelector('main'),map={hero:document.getElementById('heroSection'),benefits:document.getElementById('benefitsSection'),catalog:document.getElementById('catalog'),editorial:document.getElementById('editorialSection'),newsletter:document.getElementById('newsletterSection')};if(main)t.order.forEach(k=>{if(map[k])main.appendChild(map[k])});
  applySiteIdentity();
}
