const KEYS = {
  products: 'nova_products_v1',
  cart: 'nova_cart_v1',
  orders: 'nova_orders_v1',
  payments: 'nova_payments_v1',
  settings: 'nova_settings_v1'
};

const demoProducts = [
  {id:'p1',name:'Camisa Essential Linen',category:'Moda',sku:'MOD-001',price:189.90,oldPrice:229.90,stock:18,sizes:['P','M','G','GG'],active:true,badge:'NOVO',description:'Camisa de caimento leve com visual minimalista e acabamento refinado para composições versáteis.',image:'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=85',created:6},
  {id:'p2',name:'Tênis Urban Core',category:'Calçados',sku:'CAL-014',price:349.90,oldPrice:null,stock:7,sizes:['37','38','39','40','41','42'],active:true,badge:'DESTAQUE',description:'Tênis urbano de linhas limpas, solado confortável e construção pensada para uso diário.',image:'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85',created:5},
  {id:'p3',name:'Bolsa Studio Mini',category:'Acessórios',sku:'ACE-008',price:249.90,oldPrice:299.90,stock:11,sizes:['Único'],active:true,badge:'-17%',description:'Bolsa compacta estruturada com acabamento sofisticado e espaço essencial para a rotina.',image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',created:4},
  {id:'p4',name:'Vaso Organic Sand',category:'Casa',sku:'CAS-031',price:129.90,oldPrice:null,stock:4,sizes:['Único'],active:true,badge:'ÚLTIMAS',description:'Peça decorativa de formas orgânicas e acabamento neutro para compor ambientes contemporâneos.',image:'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=85',created:3},
  {id:'p5',name:'Blazer Structure',category:'Moda',sku:'MOD-022',price:399.90,oldPrice:459.90,stock:9,sizes:['P','M','G'],active:true,badge:'BEST SELLER',description:'Blazer estruturado com corte contemporâneo, ideal para elevar produções casuais e formais.',image:'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85',created:2},
  {id:'p6',name:'Mocassim Classic Soft',category:'Calçados',sku:'CAL-026',price:319.90,oldPrice:null,stock:15,sizes:['36','37','38','39','40'],active:true,badge:'',description:'Mocassim clássico de construção macia, acabamento elegante e conforto prolongado.',image:'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=900&q=85',created:1},
  {id:'p7',name:'Óculos Frame 02',category:'Acessórios',sku:'ACE-015',price:179.90,oldPrice:null,stock:22,sizes:['Único'],active:true,badge:'NOVO',description:'Armação contemporânea com linhas marcantes e acabamento leve.',image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85',created:7},
  {id:'p8',name:'Manta Texture Natural',category:'Casa',sku:'CAS-044',price:219.90,oldPrice:259.90,stock:6,sizes:['Único'],active:true,badge:'-15%',description:'Manta de textura aconchegante em paleta natural para sofá, poltrona ou cama.',image:'https://images.unsplash.com/photo-1583845112203-29329902330b?auto=format&fit=crop&w=900&q=85',created:8}
];

const demoPayments = [
  {id:'pay_pix',name:'Pix',description:'QR Code e Pix Copia e Cola',icon:'PIX',type:'pix',active:true,pixMode:'key',pixKey:'',pixMerchantName:'NOVA STORE',pixMerchantCity:'CAMPO GRANDE',pixDescription:'PEDIDO ONLINE'},
  {id:'pay_credit',name:'Cartão de crédito',description:'Parcele em até 6x',icon:'CRÉD',type:'credit',active:true,maxInstallments:6,interestFreeInstallments:6},
  {id:'pay_debit',name:'Cartão de débito',description:'Pagamento à vista',icon:'DÉB',type:'debit',active:true},
  {id:'pay_boleto',name:'Boleto bancário',description:'Vencimento em até 2 dias úteis',icon:'BLT',type:'invoice',active:false}
];

const demoSettings = {storeName:'NOVA STORE',freeShipping:299,shipping:19.90,email:'atendimento@novastore.com.br',favicon:'',faviconSource:''};

let products = load(KEYS.products, demoProducts);
let cart = load(KEYS.cart, []);
let orders = load(KEYS.orders, []);
let payments = normalizePayments(load(KEYS.payments, demoPayments),false);
if(localStorage.getItem('nova_payments_schema_v2')!=='1'){payments=normalizePayments(payments,true);localStorage.setItem(KEYS.payments,JSON.stringify(payments));localStorage.setItem('nova_payments_schema_v2','1');}
let settings = {...structuredCloneSafe(demoSettings), ...load(KEYS.settings, demoSettings)};
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
  if(!payload){target.innerHTML='<div class="qr-placeholder">Configure o Pix no Admin</div>';return;}
  if(typeof QRCode==='undefined'){target.innerHTML='<div class="qr-placeholder">QR indisponível. Use o código Copia e Cola.</div>';return;}
  new QRCode(target,{text:payload,width:size,height:size,colorDark:'#111111',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
}

function init(){
  renderProducts();
  renderCart();
  renderFooterPayments();
  setupMasks();
  applyThemeToStore();
  applySiteIdentity();
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
    panel.innerHTML=`<div class="checkout-payment-detail pix-checkout-detail"><div class="payment-detail-heading"><span class="payment-detail-icon">PIX</span><div><strong>Pagamento via Pix</strong><small>${p.pixMode==='payload'?'QR baseado no código Pix configurado':'QR gerado para '+money(total)}</small></div></div>${configured?`<div class="pix-payment-grid"><div id="checkoutPixQr" class="pix-qr-box"></div><div class="pix-code-side"><span>PIX COPIA E COLA</span><textarea readonly id="checkoutPixCode">${escapeHtml(payload)}</textarea><button type="button" onclick="copyTextValue(document.getElementById('checkoutPixCode').value,'Código Pix copiado!')">COPIAR CÓDIGO PIX</button><small>Abra o app do seu banco, escaneie o QR Code ou use o Pix Copia e Cola.</small></div></div>`:`<div class="payment-config-warning"><strong>Pix ainda não configurado.</strong><span>O administrador precisa cadastrar uma chave Pix ou um código Pix Copia e Cola.</span></div>`}<div class="payment-real-note">O pedido ficará como <strong>aguardando confirmação</strong> até o recebimento ser verificado.</div></div>`;
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
    if(!payload){showToast('O Pix ainda não foi configurado pelo administrador.');return;}
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
  save(KEYS.products,products);save(KEYS.orders,orders);save(KEYS.cart,cart);renderCart();renderProducts();closeModal('checkoutModal');showOrderSuccess(order,payment);
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

function openAdminLogin(){ document.getElementById('adminPassword').value='';openModal('adminLoginModal');setTimeout(()=>document.getElementById('adminPassword').focus(),100); }
function adminLogin(){
  if(document.getElementById('adminPassword').value!=='admin123'){showToast('Senha incorreta.');return;}
  closeModal('adminLoginModal');document.getElementById('storeApp').classList.remove('active');document.getElementById('adminApp').classList.add('active');renderAdminAll();
}
function exitAdmin(){ document.getElementById('adminApp').classList.remove('active');document.getElementById('storeApp').classList.add('active');renderProducts();renderFooterPayments();applyThemeToStore(); }
const pageTitles={dashboard:['PAINEL','Visão geral'],editor:['SITE','Editor da loja'],products:['CATÁLOGO','Produtos'],orders:['VENDAS','Pedidos'],payments:['CHECKOUT','Pagamentos'],settings:['SISTEMA','Configurações']};
function showAdminSection(name,btn){
  document.querySelectorAll('.admin-section').forEach(x=>x.classList.remove('active'));document.getElementById('admin-'+name).classList.add('active');
  document.querySelectorAll('.admin-nav').forEach(x=>x.classList.remove('active')); if(btn)btn.classList.add('active');
  document.getElementById('adminPageEyebrow').textContent=pageTitles[name][0];document.getElementById('adminPageTitle').textContent=pageTitles[name][1];
  document.querySelector('.admin-sidebar').classList.remove('open');
  if(name==='editor')initVisualEditor();if(name==='products')renderAdminProducts();if(name==='orders')renderOrders();if(name==='payments')renderPaymentsAdmin();if(name==='settings')loadSettingsForm();if(name==='dashboard')renderDashboard();
}
function renderAdminAll(){ renderDashboard();renderAdminProducts();renderOrders();renderPaymentsAdmin();loadSettingsForm(); }
function renderDashboard(){
  const sales=orders.filter(o=>o.status!=='Cancelado').reduce((s,o)=>s+o.total,0), count=orders.length, active=products.filter(p=>p.active).length, stock=products.reduce((s,p)=>s+Number(p.stock||0),0);
  document.getElementById('metricSales').textContent=money(sales);document.getElementById('metricOrders').textContent=count;
  document.getElementById('metricPending').textContent=`${orders.filter(o=>['Recebido','Em preparação'].includes(o.status)).length} aguardando processamento`;
  document.getElementById('metricProducts').textContent=active;document.getElementById('metricStock').textContent=`${stock} unidades em estoque`;
  document.getElementById('metricTicket').textContent=money(count?sales/count:0);
  const cats=['Moda','Calçados','Casa','Acessórios']; const max=Math.max(1,...cats.map(c=>products.filter(p=>p.category===c).reduce((s,p)=>s+p.stock,0)));
  document.getElementById('performanceBars').innerHTML=cats.map(c=>{const n=products.filter(p=>p.category===c).reduce((s,p)=>s+p.stock,0);return `<div class="perf-row"><span>${c}</span><div class="bar"><i style="width:${Math.round(n/max*100)}%"></i></div><strong>${n} un.</strong></div>`}).join('');
  const low=products.filter(p=>p.stock<=7).sort((a,b)=>a.stock-b.stock).slice(0,5);
  document.getElementById('lowStockList').innerHTML=low.length?low.map(p=>`<div class="low-stock-item"><img src="${escapeHtml(p.image)}"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.sku)}</span></div><span class="stock-pill">${p.stock} un.</span></div>`).join(''):'<div class="empty-state"><strong>Estoque saudável.</strong></div>';
  document.getElementById('recentOrders').innerHTML=ordersTableHtml(orders.slice(0,5),false);
}
function renderAdminProducts(){
  const q=(document.getElementById('adminProductSearch')?.value||'').toLowerCase(), cat=document.getElementById('adminCategoryFilter')?.value||'Todos';
  let list=products.filter(p=>(cat==='Todos'||p.category===cat)&&(`${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q)));
  document.getElementById('adminProductsTable').innerHTML=`<table class="admin-table"><thead><tr><th>PRODUTO</th><th>SKU</th><th>PREÇO</th><th>ESTOQUE</th><th>STATUS</th><th>AÇÕES</th></tr></thead><tbody>${list.map(p=>`<tr>
    <td><div class="table-product"><img src="${escapeHtml(p.image)}"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.category)}</span></div></div></td>
    <td>${escapeHtml(p.sku)}</td><td>${money(p.price)}</td><td>${p.stock} un.</td><td><span class="status ${p.active?'active':'inactive'}">${p.active?'Ativo':'Oculto'}</span></td>
    <td><div class="table-actions"><button onclick="openProductEditor('${p.id}')">Editar</button><button onclick="deleteProduct('${p.id}')">Excluir</button></div></td></tr>`).join('')||'<tr><td colspan="6">Nenhum produto encontrado.</td></tr>'}</tbody></table>`;
}
function openProductEditor(id=null){
  const p=id?products.find(x=>x.id===id):null;
  document.getElementById('productEditorTitle').textContent=p?'Editar produto':'Novo produto';
  document.getElementById('editProductId').value=p?.id||'';document.getElementById('editName').value=p?.name||'';document.getElementById('editCategory').value=p?.category||'Moda';
  document.getElementById('editSku').value=p?.sku||'';document.getElementById('editPrice').value=p?.price??'';document.getElementById('editOldPrice').value=p?.oldPrice??'';
  document.getElementById('editStock').value=p?.stock??0;document.getElementById('editSizes').value=(p?.sizes||['Único']).join(', ');
  document.getElementById('editImage').value=p?.image||'';document.getElementById('editDescription').value=p?.description||'';document.getElementById('editActive').checked=p?.active??true;openModal('productEditorModal');
}
function saveProduct(){
  const id=document.getElementById('editProductId').value, name=document.getElementById('editName').value.trim(), price=Number(document.getElementById('editPrice').value);
  if(!name||!price){showToast('Informe nome e preço do produto.');return;}
  const obj={id:id||uid('p'),name,category:document.getElementById('editCategory').value,sku:document.getElementById('editSku').value.trim()||'SKU-'+Date.now().toString().slice(-5),price,oldPrice:Number(document.getElementById('editOldPrice').value)||null,stock:Number(document.getElementById('editStock').value)||0,sizes:document.getElementById('editSizes').value.split(',').map(x=>x.trim()).filter(Boolean),image:document.getElementById('editImage').value.trim()||'https://placehold.co/800x1000/f1f1f1/777?text=Produto',description:document.getElementById('editDescription').value.trim(),active:document.getElementById('editActive').checked,badge:id?(products.find(x=>x.id===id)?.badge||''):'NOVO',created:id?(products.find(x=>x.id===id)?.created||Date.now()):Date.now()};
  const idx=products.findIndex(x=>x.id===id);if(idx>=0)products[idx]=obj;else products.unshift(obj);
  save(KEYS.products,products);closeModal('productEditorModal');renderAdminProducts();renderDashboard();showToast('Produto salvo com sucesso.');
}
function deleteProduct(id){
  const p=products.find(x=>x.id===id);if(!p)return;
  if(!confirm(`Excluir "${p.name}"?`))return;
  products=products.filter(x=>x.id!==id);cart=cart.filter(x=>x.productId!==id);save(KEYS.products,products);save(KEYS.cart,cart);renderAdminProducts();renderDashboard();showToast('Produto removido.');
}
function ordersTableHtml(list,actions=true){
  return `<table class="admin-table"><thead><tr><th>PEDIDO</th><th>CLIENTE</th><th>DATA</th><th>PAGAMENTO</th><th>TOTAL</th><th>STATUS</th>${actions?'<th>AÇÃO</th>':''}</tr></thead><tbody>${list.map(o=>{
    const pay=payments.find(p=>p.id===o.paymentId),payStatus=o.paymentStatus||'Pendente';return `<tr><td><strong>${o.id}</strong></td><td>${escapeHtml(o.customer.name)}</td><td>${new Date(o.createdAt).toLocaleDateString('pt-BR')}</td><td><div class="payment-table-cell"><strong>${escapeHtml(pay?.name||'—')}</strong>${o.paymentDetails?.installments?`<span>${o.paymentDetails.installments}x</span>`:''}<small class="payment-status-label ${paymentStatusClass(payStatus)}">${escapeHtml(payStatus)}</small>${actions&&payStatus!=='Pago'?`<button onclick="updatePaymentStatus('${o.id}','Pago')">Marcar pago</button>`:''}</div></td><td><strong>${money(o.total)}</strong></td><td><span class="status ${statusClass(o.status)}">${o.status}</span></td>${actions?`<td><select onchange="updateOrderStatus('${o.id}',this.value)">${['Recebido','Em preparação','Enviado','Concluído','Cancelado'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td>`:''}</tr>`;
  }).join('')||`<tr><td colspan="${actions?7:6}">Nenhum pedido registrado ainda.</td></tr>`}</tbody></table>`;
}
function paymentStatusClass(s){return s==='Pago'?'paid':s.includes('Aguardando')?'waiting':s.includes('gateway')?'gateway':'pending';}
function updatePaymentStatus(id,status){const o=orders.find(x=>x.id===id);if(!o)return;o.paymentStatus=status;save(KEYS.orders,orders);renderOrders();renderDashboard();showToast('Status do pagamento atualizado.');}

function statusClass(s){return {'Recebido':'recebido','Em preparação':'preparacao','Enviado':'enviado','Concluído':'concluido','Cancelado':'cancelado'}[s]||''}
function renderOrders(){
  const q=(document.getElementById('adminOrderSearch')?.value||'').toLowerCase(), status=document.getElementById('orderStatusFilter')?.value||'Todos';
  const list=orders.filter(o=>(status==='Todos'||o.status===status)&&(`${o.id} ${o.customer.name}`.toLowerCase().includes(q)));
  document.getElementById('ordersTable').innerHTML=ordersTableHtml(list,true);
}
function updateOrderStatus(id,status){const o=orders.find(x=>x.id===id);if(o){o.status=status;save(KEYS.orders,orders);renderOrders();renderDashboard();showToast('Status do pedido atualizado.');}}

function paymentAdminSummary(p){
  if(p.type==='pix')return p.pixMode==='payload'?(p.pixPayload?'Código Pix configurado':'Código Pix não configurado'):(p.pixKey?`Chave: ${maskPixKey(p.pixKey)}`:'Chave Pix não configurada');
  if(p.type==='credit')return `Até ${clamp(p.maxInstallments||1,1,12)}x • sem juros até ${clamp(p.interestFreeInstallments||p.maxInstallments||1,1,12)}x`;
  if(p.type==='debit')return 'Pagamento à vista • requer gateway para cobrança online';
  return p.description||'Forma de pagamento';
}
function maskPixKey(key){const s=String(key||'');if(s.length<=8)return s;return s.slice(0,4)+'••••'+s.slice(-4);}
function renderPaymentsAdmin(){
  document.getElementById('paymentsAdminList').innerHTML=payments.map(p=>`<div class="payment-admin-card payment-admin-card-v2">
    <div class="payment-admin-icon">${escapeHtml(p.icon)}</div><div class="payment-admin-copy"><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.description||'')}</span><small>${escapeHtml(paymentAdminSummary(p))}</small></div>
    <label class="switch"><input type="checkbox" ${p.active?'checked':''} onchange="togglePayment('${p.id}',this.checked)"><i></i></label>
    <div class="payment-admin-actions"><button class="payment-edit" onclick="openPaymentEditor('${p.id}')">Configurar</button><button class="payment-delete" onclick="deletePayment('${p.id}')">Remover</button></div>
  </div>`).join('')||'<div class="empty-state"><strong>Nenhuma forma cadastrada.</strong></div>';
}
function openPaymentEditor(id=''){
  const p=id?payments.find(x=>x.id===id):null;
  document.getElementById('paymentEditId').value=p?.id||'';
  document.getElementById('paymentEditorTitle').textContent=p?'Configurar pagamento':'Adicionar pagamento';
  document.getElementById('paymentName').value=p?.name||'';
  document.getElementById('paymentDescription').value=p?.description||'';
  document.getElementById('paymentIcon').value=p?.icon||'';
  document.getElementById('paymentType').value=p?.type||'pix';
  renderPaymentTypeFields(p);openModal('paymentEditorModal');
}
function renderPaymentTypeFields(existing=null){
  const type=document.getElementById('paymentType').value,id=document.getElementById('paymentEditId').value,p=existing||(id?payments.find(x=>x.id===id):null)||{};
  const box=document.getElementById('paymentTypeFields');if(!box)return;
  if(type==='pix')box.innerHTML=`<div class="payment-config-section"><span class="payment-config-kicker">CONFIGURAÇÃO PIX</span><h3>Gerar QR Code real</h3><p>Use uma chave Pix para gerar um BR Code com o valor do pedido, ou cole um código Pix Copia e Cola pronto.</p><label class="wide">Modo<select id="paymentPixMode" onchange="togglePixModeFields()"><option value="key" ${(p.pixMode||'key')==='key'?'selected':''}>Gerar pela chave Pix</option><option value="payload" ${p.pixMode==='payload'?'selected':''}>Usar código Pix Copia e Cola pronto</option></select></label><div id="pixKeyFields"><div class="field-grid"><label class="wide">Chave Pix<input id="paymentPixKey" value="${escapeHtml(p.pixKey||'')}" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"></label><label>Nome do recebedor<input id="paymentPixMerchantName" value="${escapeHtml(p.pixMerchantName||settings.storeName||'NOVA STORE')}" maxlength="25"></label><label>Cidade<input id="paymentPixMerchantCity" value="${escapeHtml(p.pixMerchantCity||'CAMPO GRANDE')}" maxlength="15"></label><label class="wide">Descrição curta<input id="paymentPixDescription" value="${escapeHtml(p.pixDescription||'PEDIDO ONLINE')}" maxlength="40"></label></div></div><div id="pixPayloadFields" class="hidden"><label class="wide">Pix Copia e Cola<textarea id="paymentPixPayload" rows="5" placeholder="00020126...">${escapeHtml(p.pixPayload||'')}</textarea></label><small>O código será convertido em QR Code exatamente como foi informado.</small></div></div>`;
  else if(type==='credit')box.innerHTML=`<div class="payment-config-section"><span class="payment-config-kicker">CARTÃO DE CRÉDITO</span><h3>Parcelamento exibido ao cliente</h3><div class="field-grid"><label>Máximo de parcelas<select id="paymentMaxInstallments">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===Number(p.maxInstallments||6)?'selected':''}>Até ${n}x</option>`).join('')}</select></label><label>Sem juros até<select id="paymentInterestFree">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===Number(p.interestFreeInstallments||p.maxInstallments||6)?'selected':''}>${n}x</option>`).join('')}</select></label></div><div class="payment-security-note compact"><strong>Processamento real</strong><span>Para cobrar o cartão, conecte Mercado Pago, Stripe ou outro PSP por backend. O checkout desta versão não armazena cartão/CVV.</span></div></div>`;
  else if(type==='debit')box.innerHTML=`<div class="payment-config-section"><span class="payment-config-kicker">CARTÃO DE DÉBITO</span><h3>Pagamento à vista</h3><p>O débito será exibido como opção separada no checkout. A cobrança real depende do gateway/banco integrado.</p></div>`;
  else box.innerHTML=`<div class="payment-config-section"><p>Esta forma usará o nome e a descrição configurados acima.</p></div>`;
  if(type==='pix')setTimeout(togglePixModeFields,0);
}
function togglePixModeFields(){const mode=document.getElementById('paymentPixMode')?.value||'key';document.getElementById('pixKeyFields')?.classList.toggle('hidden',mode!=='key');document.getElementById('pixPayloadFields')?.classList.toggle('hidden',mode!=='payload');}
function savePayment(){
  const id=document.getElementById('paymentEditId').value,name=document.getElementById('paymentName').value.trim(),type=document.getElementById('paymentType').value;if(!name){showToast('Informe o nome da forma de pagamento.');return;}
  const existing=id?payments.find(x=>x.id===id):null,obj={...(existing||{}),id:id||uid('pay'),name,description:document.getElementById('paymentDescription').value.trim()||'Disponível no checkout',icon:(document.getElementById('paymentIcon').value.trim()||name.slice(0,4)).toUpperCase(),type,active:existing?.active??true};
  if(type==='pix'){
    obj.pixMode=document.getElementById('paymentPixMode')?.value||'key';obj.pixKey=document.getElementById('paymentPixKey')?.value.trim()||'';obj.pixMerchantName=document.getElementById('paymentPixMerchantName')?.value.trim()||settings.storeName||'NOVA STORE';obj.pixMerchantCity=document.getElementById('paymentPixMerchantCity')?.value.trim()||'CAMPO GRANDE';obj.pixDescription=document.getElementById('paymentPixDescription')?.value.trim()||'PEDIDO ONLINE';obj.pixPayload=document.getElementById('paymentPixPayload')?.value.trim()||'';
    if(obj.pixMode==='key'&&!obj.pixKey){showToast('Informe a chave Pix para gerar o QR Code.');return;}if(obj.pixMode==='payload'&&!obj.pixPayload){showToast('Cole o código Pix Copia e Cola.');return;}
  }
  if(type==='credit'){obj.maxInstallments=clamp(document.getElementById('paymentMaxInstallments')?.value||1,1,12);obj.interestFreeInstallments=clamp(document.getElementById('paymentInterestFree')?.value||obj.maxInstallments,1,obj.maxInstallments);obj.description=`Parcele em até ${obj.maxInstallments}x`;}
  if(type==='debit'&&!document.getElementById('paymentDescription').value.trim())obj.description='Pagamento à vista';
  const idx=payments.findIndex(x=>x.id===obj.id);if(idx>=0)payments[idx]=obj;else payments.push(obj);payments=normalizePayments(payments,false);save(KEYS.payments,payments);closeModal('paymentEditorModal');renderPaymentsAdmin();renderFooterPayments();showToast('Forma de pagamento salva.');
}
function togglePayment(id,active){const p=payments.find(x=>x.id===id);if(p){p.active=active;save(KEYS.payments,payments);renderFooterPayments();}}
function deletePayment(id){const p=payments.find(x=>x.id===id);if(!p)return;if(!confirm(`Remover ${p.name}?`))return;payments=payments.filter(x=>x.id!==id);save(KEYS.payments,payments);renderPaymentsAdmin();renderFooterPayments();}

function renderFooterPayments(){const el=document.getElementById('footerPayments');if(el)el.textContent=payments.filter(p=>p.active).map(p=>p.name).join(' • ')||'Consulte no checkout';}

function loadSettingsForm(){document.getElementById('settingStoreName').value=settings.storeName;document.getElementById('settingFreeShipping').value=settings.freeShipping;document.getElementById('settingShipping').value=settings.shipping;document.getElementById('settingEmail').value=settings.email;renderFaviconPreview();}
function saveSettings(){settings={...settings,storeName:document.getElementById('settingStoreName').value||'NOVA STORE',freeShipping:Number(document.getElementById('settingFreeShipping').value)||0,shipping:Number(document.getElementById('settingShipping').value)||0,email:document.getElementById('settingEmail').value};save(KEYS.settings,settings);applySiteIdentity();renderFaviconPreview();showToast('Configurações salvas.');}
function resetDemoData(){
  if(!confirm('Restaurar todos os dados demonstrativos? Produtos, pedidos, pagamentos e carrinho locais serão redefinidos.'))return;
  products=structuredCloneSafe(demoProducts);cart=[];orders=[];payments=structuredCloneSafe(demoPayments);settings=structuredCloneSafe(demoSettings);themePublished=structuredCloneSafe(defaultTheme);editorDraft=structuredCloneSafe(defaultTheme);
  save(KEYS.products,products);save(KEYS.cart,cart);save(KEYS.orders,orders);save(KEYS.payments,payments);save(KEYS.settings,settings);save(THEME_KEY,themePublished);save(THEME_DRAFT_KEY,editorDraft);resetEditorHistory();renderAdminAll();renderCart();applyThemeToStore();applySiteIdentity();showToast('Dados demonstrativos restaurados.');
}
function exportStoreData(){
  const data={exportedAt:new Date().toISOString(),products,orders,payments,settings};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='nova-store-dados.json';a.click();URL.revokeObjectURL(url);showToast('Dados exportados.');
}
function setupMasks(){
  const cpf=document.getElementById('checkoutCpf'); cpf?.addEventListener('input',()=>{let v=cpf.value.replace(/\D/g,'').slice(0,11);cpf.value=v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2')});
  const cep=document.getElementById('checkoutCep'); cep?.addEventListener('input',()=>{let v=cep.value.replace(/\D/g,'').slice(0,8);cep.value=v.replace(/(\d{5})(\d)/,'$1-$2')});
  const phone=document.getElementById('checkoutPhone'); phone?.addEventListener('input',()=>{let v=phone.value.replace(/\D/g,'').slice(0,11);phone.value=v.length>10?v.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3'):v.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3')});
}
/* =========================
   EDITOR VISUAL DA LOJA
   Inspirado em editores por seções/blocos com preview em tempo real.
========================= */
const THEME_KEY = 'nova_theme_published_v1';
const THEME_DRAFT_KEY = 'nova_theme_draft_v1';
const defaultTheme = {
  global:{fontBody:'DM Sans',fontHeading:'Manrope',pageBg:'#ffffff',textColor:'#111111',buttonBg:'#111111',buttonText:'#ffffff',buttonRadius:0},
  announcement:{enabled:true,text:'FRETE GRÁTIS ACIMA DE R$ 299 • TROCA FÁCIL • COMPRA SEGURA',bg:'#111111',color:'#ffffff'},
  header:{enabled:true,logo:'NOVA STORE',logoImage:'',logoImageSource:'',logoImageSize:38,sticky:true,bg:'#ffffff',color:'#111111'},
  hero:{enabled:true,eyebrow:'COLEÇÃO 2026',title:'Design que combina\ncom a sua rotina.',text:'Peças selecionadas para vestir, viver e transformar o seu dia.',primary:'COMPRAR AGORA',secondary:'VER COLEÇÃO',primaryBg:'#ffffff',primaryText:'#111111',primaryHoverBg:'#111111',primaryHoverText:'#ffffff',secondaryBg:'transparent',secondaryText:'#ffffff',secondaryBorder:'#ffffff',secondaryHoverBg:'#ffffff',secondaryHoverText:'#111111',image:'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2000&q=88',height:72,overlay:46,align:'left'},
  benefits:{enabled:true,items:[
    {title:'Compra segura',text:'Ambiente protegido'},
    {title:'Entrega para todo Brasil',text:'Consulte o prazo no checkout'},
    {title:'Troca facilitada',text:'Processo simples e rápido'}
  ]},
  catalog:{enabled:true,eyebrow:'SELEÇÃO ESPECIAL',title:'Descubra seus favoritos',columns:4,bg:'#ffffff'},
  editorial:{enabled:true,eyebrow:'NOVA ESSÊNCIA',title:'Menos excesso.\nMais identidade.',text:'Uma curadoria de peças versáteis, pensadas para durar além da tendência.',button:'EXPLORAR',buttonBg:'#ffffff',buttonText:'#111111',buttonHoverBg:'#111111',buttonHoverText:'#ffffff',image:'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?auto=format&fit=crop&w=1900&q=88',overlay:48},
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
let editorDraft = mergeThemeDefaults(defaultTheme, load(THEME_DRAFT_KEY, themePublished));
let selectedEditorSection = 'hero';
let editorHistory = [];
let editorHistoryIndex = -1;
let editorInitialized = false;
let editorDraggedSection = null;

const editorSectionMeta = {
  announcement:{label:'Barra de anúncio',desc:'Mensagem promocional',fixed:true},
  header:{label:'Cabeçalho',desc:'Logo e navegação',fixed:true},
  hero:{label:'Banner principal',desc:'Imagem, título e botões'},
  benefits:{label:'Benefícios',desc:'Diferenciais da loja'},
  catalog:{label:'Catálogo de produtos',desc:'Vitrine principal'},
  editorial:{label:'Banner editorial',desc:'Campanha ou coleção'},
  newsletter:{label:'Newsletter',desc:'Captura de e-mail'},
  footer:{label:'Rodapé',desc:'Links e informações',fixed:true}
};

function initVisualEditor(){
  if(!editorInitialized){
    editorDraft=load(THEME_DRAFT_KEY,themePublished);
    resetEditorHistory();
    editorInitialized=true;
  }
  renderEditorSectionList();
  renderEditorInspector();
  renderStorePreview();
  updateEditorHistoryButtons();
}

function resetEditorHistory(){
  editorHistory=[JSON.stringify(editorDraft)];
  editorHistoryIndex=0;
  updateEditorHistoryButtons();
}
function commitEditorSnapshot(){
  const snapshot=JSON.stringify(editorDraft);
  if(editorHistory[editorHistoryIndex]===snapshot)return;
  editorHistory=editorHistory.slice(0,editorHistoryIndex+1);
  editorHistory.push(snapshot);
  if(editorHistory.length>60)editorHistory.shift(); else editorHistoryIndex++;
  if(editorHistoryIndex>=editorHistory.length)editorHistoryIndex=editorHistory.length-1;
  updateEditorHistoryButtons();
}
function updateEditorHistoryButtons(){
  const u=document.getElementById('undoEditorBtn'),r=document.getElementById('redoEditorBtn');
  if(u)u.disabled=editorHistoryIndex<=0;
  if(r)r.disabled=editorHistoryIndex>=editorHistory.length-1;
}
function editorUndo(){
  if(editorHistoryIndex<=0)return;
  editorHistoryIndex--;editorDraft=JSON.parse(editorHistory[editorHistoryIndex]);persistEditorDraft();refreshEditorUI();
}
function editorRedo(){
  if(editorHistoryIndex>=editorHistory.length-1)return;
  editorHistoryIndex++;editorDraft=JSON.parse(editorHistory[editorHistoryIndex]);persistEditorDraft();refreshEditorUI();
}
function refreshEditorUI(){renderEditorSectionList();renderEditorInspector();renderStorePreview();updateEditorHistoryButtons();}
function persistEditorDraft(){
  save(THEME_DRAFT_KEY,editorDraft);
  const state=document.getElementById('editorSaveState');if(state)state.textContent='Rascunho salvo automaticamente';
}
function publishTheme(){
  themePublished=structuredCloneSafe(editorDraft);save(THEME_KEY,themePublished);save(THEME_DRAFT_KEY,editorDraft);applyThemeToStore();
  const state=document.getElementById('editorSaveState');if(state)state.textContent='Publicado agora';showToast('Alterações publicadas na loja.');
}
function resetEditorDraft(){
  if(!confirm('Descartar o rascunho e voltar para a versão publicada?'))return;
  editorDraft=structuredCloneSafe(themePublished);persistEditorDraft();resetEditorHistory();refreshEditorUI();showToast('Rascunho descartado.');
}
function setPreviewDevice(device,btn){
  const stage=document.getElementById('previewStage');if(!stage)return;stage.className='preview-stage '+device;
  document.querySelectorAll('.device-switcher button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');
}
function selectEditorSection(key){
  selectedEditorSection=key;renderEditorSectionList();renderEditorInspector();renderStorePreview();
}
function showHiddenSectionsMenu(){
  const menu=document.getElementById('hiddenSectionsMenu');if(!menu)return;
  const hidden=Object.keys(editorSectionMeta).filter(k=>k!=='global'&&editorDraft[k]&&editorDraft[k].enabled===false);
  menu.innerHTML=hidden.length?hidden.map(k=>`<button onclick="reactivateEditorSection('${k}')">＋ ${escapeHtml(editorSectionMeta[k].label)}</button>`).join(''):'<button disabled>Todas as seções estão ativas</button>';
  menu.classList.toggle('hidden');
}
function reactivateEditorSection(key){
  if(editorDraft[key])editorDraft[key].enabled=true;persistEditorDraft();commitEditorSnapshot();document.getElementById('hiddenSectionsMenu')?.classList.add('hidden');refreshEditorUI();
}
function toggleEditorSection(key,enabled){
  if(editorDraft[key])editorDraft[key].enabled=enabled;persistEditorDraft();commitEditorSnapshot();renderEditorSectionList();renderEditorInspector();renderStorePreview();
}
function editorDragStart(e,key){editorDraggedSection=key;e.dataTransfer.effectAllowed='move';e.currentTarget.classList.add('dragging');}
function editorDragEnd(e){e.currentTarget.classList.remove('dragging');editorDraggedSection=null;}
function editorDragOver(e){e.preventDefault();e.dataTransfer.dropEffect='move';}
function editorDrop(e,targetKey){
  e.preventDefault();if(!editorDraggedSection||editorDraggedSection===targetKey)return;
  const order=[...editorDraft.order],from=order.indexOf(editorDraggedSection),to=order.indexOf(targetKey);if(from<0||to<0)return;
  order.splice(from,1);order.splice(to,0,editorDraggedSection);editorDraft.order=order;persistEditorDraft();commitEditorSnapshot();renderEditorSectionList();renderStorePreview();
}
function renderEditorSectionList(){
  const wrap=document.getElementById('editorSectionList');if(!wrap)return;
  const keys=['announcement','header',...editorDraft.order,'footer'];
  wrap.innerHTML=keys.map(k=>{
    const meta=editorSectionMeta[k],enabled=editorDraft[k]?.enabled!==false,draggable=!meta.fixed;
    return `<div class="editor-section-item ${selectedEditorSection===k?'active':''} ${enabled?'':'hidden-section'}" ${draggable?'draggable="true"':''} onclick="selectEditorSection('${k}')" ${draggable?`ondragstart="editorDragStart(event,'${k}')" ondragend="editorDragEnd(event)" ondragover="editorDragOver(event)" ondrop="editorDrop(event,'${k}')"`:''}>
      <span class="editor-drag">${draggable?'⋮⋮':'•'}</span><div class="editor-section-copy"><strong>${meta.label}</strong><small>${meta.desc}</small></div>
      <div class="editor-section-actions"><button title="${enabled?'Ocultar':'Exibir'}" onclick="event.stopPropagation();toggleEditorSection('${k}',${!enabled})">${enabled?'◉':'○'}</button></div>
    </div>`;
  }).join('');
  const globalBtn=document.querySelector('.theme-settings-button');if(globalBtn)globalBtn.classList.toggle('active',selectedEditorSection==='global');
}
function getThemeValue(path){return path.split('.').reduce((o,k)=>o==null?undefined:o[k],editorDraft)}
function setThemeValue(path,value){
  const parts=path.split('.');let obj=editorDraft;parts.slice(0,-1).forEach(k=>obj=obj[k]);obj[parts.at(-1)]=value;
}
function updateEditorValue(path,value,type='text'){
  if(type==='number')value=Number(value);if(type==='boolean')value=!!value;
  setThemeValue(path,value);persistEditorDraft();renderStorePreview();
}
function toggleField(path,checked){updateEditorValue(path,checked,'boolean');commitEditorSnapshot();renderEditorSectionList();}
function inspectorInput(label,path,type='text',extra=''){
  const val=getThemeValue(path)??'';
  if(type==='textarea')return `<label class="inspector-field"><span>${label}</span><textarea ${extra} oninput="updateEditorValue('${path}',this.value)" onchange="commitEditorSnapshot()">${escapeHtml(val)}</textarea></label>`;
  if(type==='select')return '';
  return `<label class="inspector-field"><span>${label}</span><input type="${type}" value="${escapeHtml(val)}" ${extra} oninput="updateEditorValue('${path}',this.value,'${type==='number'||type==='range'?'number':'text'}')" onchange="commitEditorSnapshot()"></label>`;
}
function inspectorSelect(label,path,options){
  const val=getThemeValue(path);return `<label class="inspector-field"><span>${label}</span><select onchange="updateEditorValue('${path}',this.value);commitEditorSnapshot()">${options.map(([v,l])=>`<option value="${escapeHtml(v)}" ${String(v)===String(val)?'selected':''}>${escapeHtml(l)}</option>`).join('')}</select></label>`;
}
function inspectorColor(label,path){
  const val=getThemeValue(path)||'#000000';return `<label class="inspector-field"><span>${label}</span><div class="color-field-row"><input type="color" value="${escapeHtml(val)}" oninput="updateEditorValue('${path}',this.value)" onchange="commitEditorSnapshot()"><input type="text" value="${escapeHtml(val)}" oninput="updateEditorValue('${path}',this.value)" onchange="commitEditorSnapshot()"></div></label>`;
}
function inspectorToggle(label,path,help=''){
  const checked=!!getThemeValue(path);return `<div class="inspector-toggle"><span><strong>${label}</strong>${help?`<small>${help}</small>`:''}</span><label class="inspector-switch"><input type="checkbox" ${checked?'checked':''} onchange="toggleField('${path}',this.checked)"><i></i></label></div>`;
}
function sectionInspectorHeader(key,title,desc){return `<div class="inspector-header"><span class="inspector-kicker">EDITOR VISUAL</span><h3>${title}</h3><p>${desc}</p></div>${key!=='global'?inspectorToggle('Exibir seção',`${key}.enabled`,'Oculta ou mostra esta área na loja'):''}`}
function inspectorLogoUpload(){
  const src=editorDraft.header.logoImage||'';
  return `<div class="inspector-field"><span>Logo em imagem</span><div class="inspector-asset-upload"><div class="inspector-asset-preview">${src?`<img src="${src}" alt="Prévia da logo">`:'<span>Nenhuma logo enviada</span>'}</div><div class="inspector-upload-actions"><label>${src?'Trocar':'Enviar'} logo<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onchange="handleEditorLogoUpload(this)"></label>${src?'<button type="button" onclick="editCurrentLogoImage()">Editar imagem</button><button type="button" onclick="removeEditorLogo()">Remover</button>':''}</div></div><small class="inspector-note">Após selecionar, ajuste recorte, zoom, posição, tamanho e arredondamento antes de aplicar.</small></div>`;
}
function renderEditorInspector(){
  const el=document.getElementById('editorInspector');if(!el)return;const k=selectedEditorSection;let html='';
  if(k==='global')html=sectionInspectorHeader(k,'Design global','Defina a identidade visual usada em toda a loja.')+
    `<div class="inspector-group"><span class="inspector-group-title">TIPOGRAFIA</span>${inspectorSelect('Fonte dos textos','global.fontBody',[['DM Sans','DM Sans'],['Manrope','Manrope'],['Arial','Arial'],['Georgia','Georgia']])}${inspectorSelect('Fonte dos títulos','global.fontHeading',[['Manrope','Manrope'],['DM Sans','DM Sans'],['Arial','Arial'],['Georgia','Georgia']])}</div>`+
    `<div class="inspector-group"><span class="inspector-group-title">CORES</span>${inspectorColor('Fundo da página','global.pageBg')}${inspectorColor('Texto principal','global.textColor')}${inspectorColor('Botões','global.buttonBg')}${inspectorColor('Texto dos botões','global.buttonText')}</div>`+
    `<div class="inspector-group"><span class="inspector-group-title">BOTÕES</span>${inspectorInput('Arredondamento (px)','global.buttonRadius','range','min="0" max="30" step="1"')}</div>`;
  else if(k==='announcement')html=sectionInspectorHeader(k,'Barra de anúncio','Edite a faixa promocional exibida no topo da loja.')+`<div class="inspector-group">${inspectorInput('Mensagem','announcement.text','textarea')}${inspectorColor('Cor de fundo','announcement.bg')}${inspectorColor('Cor do texto','announcement.color')}</div>`;
  else if(k==='header')html=sectionInspectorHeader(k,'Cabeçalho','Personalize a marca e o comportamento da navegação.')+`<div class="inspector-group"><span class="inspector-group-title">MARCA</span>${inspectorInput('Nome da loja','header.logo')}${inspectorLogoUpload()}${inspectorInput('Altura da logo (px)','header.logoImageSize','range','min="20" max="80" step="1"')}</div><div class="inspector-group"><span class="inspector-group-title">CABEÇALHO</span>${inspectorToggle('Cabeçalho fixo','header.sticky','Permanece visível durante a rolagem')}${inspectorColor('Fundo','header.bg')}${inspectorColor('Texto e ícones','header.color')}</div>`;
  else if(k==='hero')html=sectionInspectorHeader(k,'Banner principal','A primeira área de destaque da página inicial.')+`<div class="inspector-group"><span class="inspector-group-title">CONTEÚDO</span>${inspectorInput('Texto superior','hero.eyebrow')}${inspectorInput('Título','hero.title','textarea')}${inspectorInput('Descrição','hero.text','textarea')}${inspectorInput('Botão principal','hero.primary')}${inspectorInput('Botão secundário','hero.secondary')}</div><div class="inspector-group"><span class="inspector-group-title">CORES DOS BOTÕES</span>${inspectorColor('Fundo do botão principal','hero.primaryBg')}${inspectorColor('Texto do botão principal','hero.primaryText')}${inspectorColor('Hover do botão principal','hero.primaryHoverBg')}${inspectorColor('Texto no hover principal','hero.primaryHoverText')}${inspectorColor('Fundo do botão secundário','hero.secondaryBg')}${inspectorColor('Texto do botão secundário','hero.secondaryText')}${inspectorColor('Borda do botão secundário','hero.secondaryBorder')}${inspectorColor('Hover do botão secundário','hero.secondaryHoverBg')}${inspectorColor('Texto no hover secundário','hero.secondaryHoverText')}</div><div class="inspector-group"><span class="inspector-group-title">IMAGEM E LAYOUT</span>${inspectorInput('URL da imagem','hero.image')}${inspectorSelect('Alinhamento','hero.align',[['left','Esquerda'],['center','Centro'],['right','Direita']])}${inspectorInput('Altura (% da tela)','hero.height','range','min="45" max="95" step="1"')}${inspectorInput('Escurecimento da imagem','hero.overlay','range','min="0" max="80" step="1"')}</div>`;
  else if(k==='benefits')html=sectionInspectorHeader(k,'Benefícios','Edite os três diferenciais exibidos abaixo do banner.')+`<div class="inspector-group">${[0,1,2].map((i)=>`<span class="inspector-group-title">ITEM ${i+1}</span>${inspectorInput('Título',`benefits.items.${i}.title`)}${inspectorInput('Descrição',`benefits.items.${i}.text`)}`).join('')}</div>`;
  else if(k==='catalog')html=sectionInspectorHeader(k,'Catálogo de produtos','Configure o cabeçalho e a grade da vitrine principal.')+`<div class="inspector-group">${inspectorInput('Texto superior','catalog.eyebrow')}${inspectorInput('Título','catalog.title')}${inspectorSelect('Colunas no desktop','catalog.columns',[[2,'2 colunas'],[3,'3 colunas'],[4,'4 colunas'],[5,'5 colunas']])}${inspectorColor('Fundo da seção','catalog.bg')}</div>`;
  else if(k==='editorial')html=sectionInspectorHeader(k,'Banner editorial','Campanha visual para destacar uma coleção ou mensagem.')+`<div class="inspector-group">${inspectorInput('Texto superior','editorial.eyebrow')}${inspectorInput('Título','editorial.title','textarea')}${inspectorInput('Descrição','editorial.text','textarea')}${inspectorInput('Texto do botão','editorial.button')}${inspectorColor('Fundo do botão','editorial.buttonBg')}${inspectorColor('Texto do botão','editorial.buttonText')}${inspectorColor('Cor ao passar o mouse','editorial.buttonHoverBg')}${inspectorColor('Texto ao passar o mouse','editorial.buttonHoverText')}${inspectorInput('URL da imagem','editorial.image')}${inspectorInput('Escurecimento da imagem','editorial.overlay','range','min="0" max="80" step="1"')}</div>`;
  else if(k==='newsletter')html=sectionInspectorHeader(k,'Newsletter','Área para captação de contatos e novidades.')+`<div class="inspector-group">${inspectorInput('Texto superior','newsletter.eyebrow')}${inspectorInput('Título','newsletter.title','textarea')}${inspectorInput('Texto do botão','newsletter.button')}${inspectorColor('Fundo da seção','newsletter.bg')}${inspectorColor('Fundo do botão','newsletter.buttonBg')}${inspectorColor('Texto do botão','newsletter.buttonText')}${inspectorColor('Cor ao passar o mouse','newsletter.buttonHoverBg')}${inspectorColor('Texto ao passar o mouse','newsletter.buttonHoverText')}</div>`;
  else if(k==='footer')html=sectionInspectorHeader(k,'Rodapé','Controle as cores da área institucional da loja.')+`<div class="inspector-group">${inspectorColor('Fundo','footer.bg')}${inspectorColor('Texto','footer.color')}</div>`;
  el.innerHTML=html;
}

function previewClickAttr(key){return `onclick="parent.selectEditorSection('${key}')"`}
function previewOutline(key){return selectedEditorSection===key?'editor-selected':''}
function readAndResizeImage(file,{maxWidth=600,maxHeight=240,square=false,type='image/png'}={}){
  return new Promise((resolve,reject)=>{
    if(!file)return reject(new Error('Arquivo ausente'));
    if(file.size>5*1024*1024)return reject(new Error('A imagem deve ter no máximo 5 MB.'));
    const reader=new FileReader();reader.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));
    reader.onload=()=>{
      const img=new Image();img.onerror=()=>reject(new Error('Formato de imagem inválido.'));
      img.onload=()=>{
        let w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
        if(square){const size=Math.min(128,maxWidth,maxHeight);const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,size);const scale=Math.min(size/w,size/h);const dw=w*scale,dh=h*scale;ctx.drawImage(img,(size-dw)/2,(size-dh)/2,dw,dh);resolve(canvas.toDataURL(type,.92));return;}
        const scale=Math.min(1,maxWidth/w,maxHeight/h);w=Math.round(w*scale);h=Math.round(h*scale);const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);resolve(canvas.toDataURL(type,.92));
      };img.src=reader.result;
    };reader.readAsDataURL(file);
  });
}
async function handleEditorLogoUpload(input){
  const file=input.files?.[0];if(!file)return;
  try{
    const source=await readAndResizeImage(file,{maxWidth:1000,maxHeight:1000,type:'image/webp'});
    editorDraft.header.logoImageSource=source;
    openImageAdjustEditor('logo',source);
  }catch(e){showToast(e.message||'Não foi possível carregar a logo.');}finally{input.value='';}
}
function editCurrentLogoImage(){const source=editorDraft.header.logoImageSource||editorDraft.header.logoImage;if(source)openImageAdjustEditor('logo',source);}
function removeEditorLogo(){editorDraft.header.logoImage='';editorDraft.header.logoImageSource='';persistEditorDraft();commitEditorSnapshot();renderEditorInspector();renderStorePreview();showToast('Logo removida do rascunho.');}
async function handleFaviconUpload(input){
  const file=input.files?.[0];if(!file)return;
  try{
    const source=await readAndResizeImage(file,{maxWidth:800,maxHeight:800,type:'image/webp'});
    settings.faviconSource=source;
    openImageAdjustEditor('favicon',source);
  }catch(e){showToast(e.message||'Não foi possível carregar o ícone.');}finally{input.value='';}
}
function editCurrentFavicon(){const source=settings.faviconSource||settings.favicon;if(source)openImageAdjustEditor('favicon',source);}
function removeFavicon(){settings.favicon='';settings.faviconSource='';save(KEYS.settings,settings);applySiteIdentity();renderFaviconPreview();showToast('Ícone do site removido.');}

let imageAdjustState={target:null,source:'',img:null,aspect:'original',zoom:100,x:0,y:0,radius:0,displaySize:38,dragging:false,lastX:0,lastY:0};
function openImageAdjustEditor(target,source){
  const img=new Image();img.onload=()=>{
    imageAdjustState={target,source,img,aspect:target==='favicon'?'square':'original',zoom:100,x:0,y:0,radius:target==='favicon'?18:0,displaySize:Number(editorDraft?.header?.logoImageSize)||38,dragging:false,lastX:0,lastY:0};
    document.getElementById('imageAdjustTitle').textContent=target==='favicon'?'Editar ícone do site':'Editar logo da loja';
    document.getElementById('imageAdjustSubtitle').textContent=target==='favicon'?'Recorte, amplie, reposicione e arredonde o ícone antes de aplicar.':'Ajuste a logo antes de adicioná-la ao rascunho da loja.';
    document.getElementById('imageAdjustApplyButton').textContent=target==='favicon'?'Aplicar ícone':'Aplicar logo';
    document.getElementById('imageAdjustAspectOptions').classList.toggle('hidden',target==='favicon');
    document.getElementById('imageAdjustDisplaySizeControl').classList.toggle('hidden',target!=='logo');
    syncImageAdjustControls();renderImageAdjustCanvas();openModal('imageAdjustModal');setupImageAdjustDrag();
  };img.onerror=()=>showToast('Não foi possível abrir a imagem selecionada.');img.src=source;
}
function closeImageAdjustEditor(){closeModal('imageAdjustModal');imageAdjustState.dragging=false;}
function resetImageAdjustEditor(){
  imageAdjustState.zoom=100;imageAdjustState.x=0;imageAdjustState.y=0;imageAdjustState.radius=imageAdjustState.target==='favicon'?18:0;imageAdjustState.aspect=imageAdjustState.target==='favicon'?'square':'original';imageAdjustState.displaySize=Number(editorDraft?.header?.logoImageSize)||38;
  syncImageAdjustControls();renderImageAdjustCanvas();
}
function setImageAdjustAspect(aspect,btn){imageAdjustState.aspect=aspect;document.querySelectorAll('#imageAdjustAspectOptions button').forEach(b=>b.classList.remove('active'));btn?.classList.add('active');imageAdjustState.x=0;imageAdjustState.y=0;renderImageAdjustCanvas();}
function setImageAdjustRadius(v){imageAdjustState.radius=Number(v);syncImageAdjustControls();renderImageAdjustCanvas();}
function syncImageAdjustControls(){
  const map=[['imageAdjustZoom',imageAdjustState.zoom],['imageAdjustX',imageAdjustState.x],['imageAdjustY',imageAdjustState.y],['imageAdjustRadius',imageAdjustState.radius],['imageAdjustDisplaySize',imageAdjustState.displaySize]];map.forEach(([id,v])=>{const e=document.getElementById(id);if(e)e.value=v});
  const z=document.getElementById('imageAdjustZoomValue'),x=document.getElementById('imageAdjustXValue'),y=document.getElementById('imageAdjustYValue'),r=document.getElementById('imageAdjustRadiusValue'),d=document.getElementById('imageAdjustDisplaySizeValue');if(z)z.textContent=`${Math.round(imageAdjustState.zoom)}%`;if(x)x.textContent=Math.round(imageAdjustState.x);if(y)y.textContent=Math.round(imageAdjustState.y);if(r)r.textContent=`${Math.round(imageAdjustState.radius)}%`;if(d)d.textContent=`${Math.round(imageAdjustState.displaySize)} px`;
  document.querySelectorAll('#imageAdjustAspectOptions button').forEach(b=>b.classList.toggle('active',b.dataset.aspect===imageAdjustState.aspect));
}
function updateImageAdjustFromControls(){
  imageAdjustState.zoom=Number(document.getElementById('imageAdjustZoom').value);imageAdjustState.x=Number(document.getElementById('imageAdjustX').value);imageAdjustState.y=Number(document.getElementById('imageAdjustY').value);imageAdjustState.radius=Number(document.getElementById('imageAdjustRadius').value);imageAdjustState.displaySize=Number(document.getElementById('imageAdjustDisplaySize').value);syncImageAdjustControls();renderImageAdjustCanvas();
}
function imageAdjustDimensions(){
  const img=imageAdjustState.img;if(imageAdjustState.target==='favicon'||imageAdjustState.aspect==='square')return [720,720];if(imageAdjustState.aspect==='wide')return [1000,400];
  const ratio=Math.max(.45,Math.min(4,(img?.naturalWidth||1)/(img?.naturalHeight||1)));return ratio>=1?[1000,Math.round(1000/ratio)]:[Math.round(720*ratio),720];
}
function roundedRectPath(ctx,x,y,w,h,r){const rr=Math.max(0,Math.min(r,Math.min(w,h)/2));ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}
function renderImageAdjustCanvas(){
  const canvas=document.getElementById('imageAdjustCanvas'),img=imageAdjustState.img;if(!canvas||!img)return;const [cw,ch]=imageAdjustDimensions();canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,cw,ch);
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,base=Math.max(cw/iw,ch/ih),scale=base*(imageAdjustState.zoom/100),dw=iw*scale,dh=ih*scale,extraX=Math.max(0,dw-cw),extraY=Math.max(0,dh-ch),dx=(cw-dw)/2+(imageAdjustState.x/100)*(extraX/2),dy=(ch-dh)/2+(imageAdjustState.y/100)*(extraY/2),radius=(Math.min(cw,ch)/2)*(imageAdjustState.radius/50);
  ctx.save();roundedRectPath(ctx,0,0,cw,ch,radius);ctx.clip();ctx.drawImage(img,dx,dy,dw,dh);ctx.restore();
}
function setupImageAdjustDrag(){
  const canvas=document.getElementById('imageAdjustCanvas');if(!canvas||canvas.dataset.dragReady==='1')return;canvas.dataset.dragReady='1';
  canvas.addEventListener('pointerdown',e=>{imageAdjustState.dragging=true;imageAdjustState.lastX=e.clientX;imageAdjustState.lastY=e.clientY;canvas.classList.add('dragging');canvas.setPointerCapture?.(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!imageAdjustState.dragging)return;const dx=e.clientX-imageAdjustState.lastX,dy=e.clientY-imageAdjustState.lastY;imageAdjustState.lastX=e.clientX;imageAdjustState.lastY=e.clientY;imageAdjustState.x=Math.max(-100,Math.min(100,imageAdjustState.x+dx*.7));imageAdjustState.y=Math.max(-100,Math.min(100,imageAdjustState.y+dy*.7));syncImageAdjustControls();renderImageAdjustCanvas()});
  const stop=()=>{imageAdjustState.dragging=false;canvas.classList.remove('dragging')};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
}
function exportAdjustedImage(maxW,maxH,type='image/png',quality=.94){
  const source=document.getElementById('imageAdjustCanvas');
  if(!source||!source.width||!source.height)throw new Error('A prévia da imagem não está pronta.');
  const scale=Math.min(1,maxW/source.width,maxH/source.height),out=document.createElement('canvas');
  out.width=Math.max(1,Math.round(source.width*scale));out.height=Math.max(1,Math.round(source.height*scale));
  out.getContext('2d').drawImage(source,0,0,out.width,out.height);
  return out.toDataURL(type,quality);
}
function exportImageAdjustSource(maxDimension=1000){
  const img=imageAdjustState.img;if(!img)return imageAdjustState.source||'';
  const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,scale=Math.min(1,maxDimension/Math.max(iw,ih));
  const out=document.createElement('canvas');out.width=Math.max(1,Math.round(iw*scale));out.height=Math.max(1,Math.round(ih*scale));
  out.getContext('2d').drawImage(img,0,0,out.width,out.height);
  return out.toDataURL('image/webp',.88);
}
function applyImageAdjustEditor(){
  const btn=document.getElementById('imageAdjustApplyButton');
  if(!imageAdjustState.target||!imageAdjustState.img){showToast('Nenhuma imagem pronta para aplicar.');return;}
  const previousText=btn?.textContent||'Aplicar imagem';if(btn){btn.disabled=true;btn.textContent='Aplicando...';}
  try{
    updateImageAdjustFromControls();
    if(imageAdjustState.target==='logo'){
      const adjusted=exportAdjustedImage(800,800,'image/webp',.92);
      const compactSource=exportImageAdjustSource(1000);
      editorDraft.header.logoImage=adjusted;
      editorDraft.header.logoImageSource=compactSource;
      editorDraft.header.logoImageSize=imageAdjustState.displaySize;
      const saved=save(THEME_DRAFT_KEY,editorDraft);
      commitEditorSnapshot();
      closeImageAdjustEditor();
      renderEditorInspector();renderStorePreview();
      const state=document.getElementById('editorSaveState');if(state)state.textContent=saved?'Rascunho salvo automaticamente':'Alteração aplicada; armazenamento local cheio';
      showToast(saved?'Logo aplicada ao rascunho. Clique em Publicar alterações para exibir na loja.':'Logo aplicada nesta sessão, mas não foi possível salvar no navegador.');
    }else if(imageAdjustState.target==='favicon'){
      const adjusted=exportAdjustedImage(128,128,'image/png',.94);
      settings.favicon=adjusted;
      settings.faviconSource=exportImageAdjustSource(512);
      const saved=save(KEYS.settings,settings);
      closeImageAdjustEditor();
      applySiteIdentity();renderFaviconPreview();
      showToast(saved?'Ícone ajustado e aplicado ao site.':'Ícone aplicado nesta sessão, mas não foi possível salvar no navegador.');
    }
  }catch(e){
    console.error(e);showToast(e?.message||'Não foi possível aplicar a imagem.');
  }finally{
    if(btn&&document.body.contains(btn)){btn.disabled=false;btn.textContent=previousText;}
  }
}

function renderFaviconPreview(){const el=document.getElementById('faviconPreview');if(!el)return;el.innerHTML=settings.favicon?`<img src="${settings.favicon}" alt="Ícone atual">`:`<span>${escapeHtml((settings.storeName||'N').trim().charAt(0).toUpperCase()||'N')}</span>`;}
function applySiteIdentity(){
  const fav=document.getElementById('siteFavicon');if(fav)fav.href=settings.favicon||'data:,';
  document.title=`${settings.storeName||themePublished?.header?.logo||'Loja Online'} — Loja Online`;
  const checkout=document.querySelector('#checkoutModal .checkout-top .brand');if(checkout)renderBrandElement(checkout,themePublished);
}
function renderBrandElement(el,t=themePublished,footer=false){
  if(!el)return;const image=t?.header?.logoImage||'',name=t?.header?.logo||settings.storeName||'Loja';const size=Number(t?.header?.logoImageSize)||38;
  el.innerHTML=`${image?`<img class="brand-logo-image" src="${image}" alt="${escapeHtml(name)}" style="height:${footer?Math.round(size*1.15):size}px">`:''}<span class="brand-name">${escapeHtml(name)}</span>`;
}

function renderStorePreview(){
  const frame=document.getElementById('storePreviewFrame');if(!frame)return;try{frame.__restoreY=frame.contentWindow?.scrollY||frame.__restoreY||0}catch(e){};frame.onload=()=>{try{frame.contentWindow.scrollTo(0,frame.__restoreY||0)}catch(e){}};const t=editorDraft;
  const productCards=products.filter(p=>p.active).slice(0,8).map(p=>`<article class="p"><div class="pi"><img src="${escapeHtml(p.image)}"><button>ADICIONAR</button></div><div class="pd"><span>${escapeHtml(p.name)}</span><b>${money(p.price)}</b></div><small>${escapeHtml(p.category)}</small></article>`).join('');
  const sections={
    hero:t.hero.enabled?`<section class="hero ${previewOutline('hero')} align-${t.hero.align}" ${previewClickAttr('hero')} style="min-height:${t.hero.height}vh;background-image:linear-gradient(rgba(0,0,0,.${String(Math.round(t.hero.overlay)).padStart(2,'0')}),rgba(0,0,0,.${String(Math.round(t.hero.overlay)).padStart(2,'0')})),url('${escapeHtml(t.hero.image)}')"><div><em>${escapeHtml(t.hero.eyebrow)}</em><h1>${escapeHtml(t.hero.title).replace(/\n/g,'<br>')}</h1><p>${escapeHtml(t.hero.text)}</p><div class="actions"><button>${escapeHtml(t.hero.primary)}</button><button class="ghost">${escapeHtml(t.hero.secondary)}</button></div></div></section>`:'',
    benefits:t.benefits.enabled?`<section class="benefits ${previewOutline('benefits')}" ${previewClickAttr('benefits')}>${t.benefits.items.map(x=>`<div><b>${escapeHtml(x.title)}</b><span>${escapeHtml(x.text)}</span></div>`).join('')}</section>`:'',
    catalog:t.catalog.enabled?`<section class="catalog ${previewOutline('catalog')}" ${previewClickAttr('catalog')} style="background:${t.catalog.bg}"><em>${escapeHtml(t.catalog.eyebrow)}</em><h2>${escapeHtml(t.catalog.title)}</h2><div class="grid" style="grid-template-columns:repeat(${Number(t.catalog.columns)||4},1fr)">${productCards}</div></section>`:'',
    editorial:t.editorial.enabled?`<section class="editorial ${previewOutline('editorial')}" ${previewClickAttr('editorial')} style="background-image:linear-gradient(90deg,rgba(0,0,0,.${String(Math.round(t.editorial.overlay)).padStart(2,'0')}),transparent),url('${escapeHtml(t.editorial.image)}')"><div><em>${escapeHtml(t.editorial.eyebrow)}</em><h2>${escapeHtml(t.editorial.title).replace(/\n/g,'<br>')}</h2><p>${escapeHtml(t.editorial.text)}</p><button>${escapeHtml(t.editorial.button)}</button></div></section>`:'',
    newsletter:t.newsletter.enabled?`<section class="news ${previewOutline('newsletter')}" ${previewClickAttr('newsletter')} style="background:${t.newsletter.bg}"><em>${escapeHtml(t.newsletter.eyebrow)}</em><h2>${escapeHtml(t.newsletter.title)}</h2><div><input placeholder="Seu melhor e-mail"><button class="newsletter-cta" style="background:${escapeHtml(t.newsletter.buttonBg)};color:${escapeHtml(t.newsletter.buttonText)};border:0">${escapeHtml(t.newsletter.button)}</button></div></section>`:''
  };
  const main=t.order.map(k=>sections[k]||'').join('');
  frame.srcdoc=`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}body{margin:0;background:${t.global.pageBg};color:${t.global.textColor};font-family:'${escapeHtml(t.global.fontBody)}',Arial,sans-serif}button,input{font:inherit}button{cursor:pointer;border-radius:${Number(t.global.buttonRadius)||0}px}.sel{outline:2px solid #4b7bec!important;outline-offset:-2px}.editor-selected{outline:3px solid #4b7bec!important;outline-offset:-3px;position:relative}.editor-selected:after{content:'Editando';position:absolute;left:10px;top:10px;background:#4b7bec;color:#fff;font-size:8px;padding:5px 7px;z-index:20;letter-spacing:.5px}em{font-style:normal;font-size:8px;letter-spacing:2px;font-weight:700}h1,h2{font-family:'${escapeHtml(t.global.fontHeading)}',Arial,sans-serif}.ann{padding:8px 15px;text-align:center;font-size:8px;letter-spacing:1.3px;background:${t.announcement.bg};color:${t.announcement.color}}header{height:62px;display:flex;align-items:center;justify-content:space-between;padding:0 4%;background:${t.header.bg};color:${t.header.color};border-bottom:1px solid #eee;${t.header.sticky?'position:sticky;top:0;z-index:10;':''}}header strong{font-family:'${escapeHtml(t.global.fontHeading)}';font-size:17px}.preview-brand{display:flex;align-items:center;gap:8px;min-width:0}.preview-brand img{height:${Number(t.header.logoImageSize)||38}px;max-width:130px;object-fit:contain}.preview-brand span{white-space:nowrap}header nav{display:flex;gap:20px;font-size:9px}header .icons{font-size:14px}.hero{background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:7%;color:#fff}.hero>div{max-width:620px}.hero.align-center{justify-content:center;text-align:center}.hero.align-center>div{margin:auto}.hero.align-right{justify-content:flex-end;text-align:right}.hero h1{font-size:clamp(36px,6vw,76px);line-height:.98;letter-spacing:-3px;margin:12px 0}.hero p{max-width:500px;font-size:13px;line-height:1.55}.actions{display:flex;gap:7px;margin-top:20px}.align-center .actions{justify-content:center}.align-right .actions{justify-content:flex-end}.hero button,.editorial button,.news button{transition:background-color .22s ease,color .22s ease,transform .22s ease,box-shadow .22s ease}.hero button:hover,.editorial button:hover,.news button:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.16)}.hero button,.editorial button{border:0;background:${t.global.buttonBg};color:${t.global.buttonText};padding:13px 18px;font-size:8px;font-weight:700;letter-spacing:.8px}.hero .primary-cta:hover{background:${t.hero.primaryHoverBg}!important;color:${t.hero.primaryHoverText}!important}.hero .ghost{background:transparent;color:#fff;border:1px solid #fff}.hero .secondary-cta:hover{background:${t.hero.secondaryHoverBg}!important;color:${t.hero.secondaryHoverText}!important}.editorial .editorial-cta:hover{background:${t.editorial.buttonHoverBg}!important;color:${t.editorial.buttonHoverText}!important}.news .newsletter-cta:hover{background:${t.newsletter.buttonHoverBg}!important;color:${t.newsletter.buttonHoverText}!important}.benefits{display:grid;grid-template-columns:repeat(3,1fr);padding:18px 4%;border-bottom:1px solid #eee}.benefits div{text-align:center;display:flex;flex-direction:column;gap:3px}.benefits b{font-size:9px;text-transform:uppercase}.benefits span{font-size:8px;color:#777}.catalog{padding:65px 4%}.catalog h2,.news h2{font-size:32px;letter-spacing:-1.3px;margin:8px 0 25px}.grid{display:grid;gap:10px}.pi{aspect-ratio:4/5;background:#eee;position:relative;overflow:hidden}.pi img{width:100%;height:100%;object-fit:cover}.pi button{position:absolute;left:8px;right:8px;bottom:8px;border:0;background:#fff;padding:9px;font-size:7px}.pd{display:flex;justify-content:space-between;gap:5px;margin-top:9px;font-size:9px}.p small{font-size:7px;color:#888}.editorial{min-height:500px;margin:0 4% 55px;background-size:cover;background-position:center;display:flex;align-items:center;padding:7%;color:#fff}.editorial>div{max-width:500px}.editorial h2{font-size:48px;line-height:1;letter-spacing:-2px;margin:10px 0}.editorial p{font-size:11px;line-height:1.6}.news{text-align:center;padding:65px 20px}.news h2{margin-bottom:25px}.news>div{max-width:430px;margin:auto;display:flex;border-bottom:1px solid #222}.news input{flex:1;border:0;background:transparent;padding:12px;outline:none}.news button{border:0;background:none;font-size:8px;font-weight:700}.footer{background:${t.footer.bg};color:${t.footer.color};padding:45px 4%;display:grid;grid-template-columns:2fr 1fr 1fr;gap:25px}.footer strong{font-family:'${escapeHtml(t.global.fontHeading)}';font-size:18px}.footer div{display:flex;flex-direction:column;gap:7px}.footer span{font-size:8px;opacity:.68}
  @media(max-width:700px){header nav{display:none}.hero{padding:35px 20px}.hero h1{font-size:42px;letter-spacing:-2px}.benefits{grid-template-columns:1fr;gap:14px}.grid{grid-template-columns:repeat(2,1fr)!important}.catalog{padding:45px 14px}.editorial{margin:0 14px 45px;min-height:460px;padding:30px}.editorial h2{font-size:38px}.footer{grid-template-columns:1fr}.editor-selected:after{display:none}}
  </style></head><body>${t.announcement.enabled?`<div class="ann ${previewOutline('announcement')}" ${previewClickAttr('announcement')}>${escapeHtml(t.announcement.text)}</div>`:''}${t.header.enabled?`<header class="${previewOutline('header')}" ${previewClickAttr('header')}><strong class="preview-brand">${t.header.logoImage?`<img src="${t.header.logoImage}" alt="Logo">`:''}<span>${escapeHtml(t.header.logo)}</span></strong><nav><span>Novidades</span><span>Moda</span><span>Calçados</span><span>Casa</span></nav><div class="icons">⌕　🛍</div></header>`:''}${main}${t.footer.enabled?`<footer class="footer ${previewOutline('footer')}" ${previewClickAttr('footer')}><strong class="preview-brand">${t.header.logoImage?`<img src="${t.header.logoImage}" alt="Logo">`:''}<span>${escapeHtml(t.header.logo)}</span></strong><div><b>ATENDIMENTO</b><span>Central de ajuda</span><span>Trocas e devoluções</span></div><div><b>INSTITUCIONAL</b><span>Sobre nós</span><span>Privacidade</span></div></footer>`:''}</body></html>`;
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
