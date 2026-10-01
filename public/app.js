const form = document.getElementById('searchForm');
const results = document.getElementById('results');
const message = document.getElementById('message');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const summary = document.getElementById('summary');

const money = value => new Intl.NumberFormat('en-IN', {style:'currency', currency:'INR', maximumFractionDigits:0}).format(value);

function buildUrl(){
  const city = document.getElementById('city').value.trim();
  const min = document.getElementById('minPrice').value;
  const max = document.getElementById('maxPrice').value;
  const params = new URLSearchParams({city});
  if(min !== '') params.set('minPrice', min);
  if(max !== '') params.set('maxPrice', max);
  return `/api/hotels?${params.toString()}`;
}

function renderHotels(hotels){
  if(!hotels.length){
    results.innerHTML = '<div class="empty">No hotels matched this search.</div>';
    summary.hidden = false;
    document.getElementById('hotelCount').textContent = '0';
    document.getElementById('lowestPrice').textContent = '—';
    document.getElementById('supplierCount').textContent = '0';
    return;
  }
  results.innerHTML = hotels.map(h => `<article class="hotel-card"><div class="hotel-top"><div><h3>${escapeHtml(h.name)}</h3><div class="supplier">Selected from ${escapeHtml(h.supplier)}</div></div><div class="price">${money(h.price)}<small>best available price</small></div></div><span class="commission">${h.commissionPct}% commission</span></article>`).join('');
  summary.hidden = false;
  document.getElementById('hotelCount').textContent = hotels.length;
  document.getElementById('lowestPrice').textContent = money(Math.min(...hotels.map(h=>h.price)));
  document.getElementById('supplierCount').textContent = new Set(hotels.map(h=>h.supplier)).size;
}

function escapeHtml(value){return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

async function search(){
  message.textContent = '';
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching…';
  results.innerHTML = '<div class="empty">Temporal is coordinating supplier requests…</div>';
  try{
    const response = await fetch(buildUrl());
    const data = await response.json();
    if(!response.ok) throw new Error(data.message || 'Unable to load hotels');
    renderHotels(data);
  }catch(error){
    message.textContent = error.message;
    results.innerHTML = '<div class="empty">The request could not be completed. Check the API and Temporal worker.</div>';
  }finally{
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search hotels';
  }
}

async function loadHealth(){
  const health = document.getElementById('health');
  try{
    const response = await fetch('/health');
    const data = await response.json();
    const a = data.suppliers?.supplierA || 'DOWN';
    const b = data.suppliers?.supplierB || 'DOWN';
    health.innerHTML = `<span class="pill ${a==='UP'?'up':'down'}">Supplier A: ${a}</span><span class="pill ${b==='UP'?'up':'down'}">Supplier B: ${b}</span>`;
  }catch{
    health.innerHTML = '<span class="pill down">Health check unavailable</span>';
  }
}

form.addEventListener('submit', e => {e.preventDefault(); search();});
refreshBtn.addEventListener('click', search);
loadHealth();
search();
