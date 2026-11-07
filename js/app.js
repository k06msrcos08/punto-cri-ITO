// Lógica de la interfaz
let showRes=false,reports=[],uid='local',admin=false,tab='map',zoom=1,draft=null,cat=null;
const $=s=>document.querySelector(s);
const esc=s=>{const d=document.createElement('div');d.textContent=s==null?'':s;return d.innerHTML};
const ban=t=>{const b=$('#ban');b.textContent=t;b.style.display='block'};

function init(){
  uid=Storage.userId();
  $('#live').textContent=Storage.mode==='nube'?'🟢 en vivo':'💾 local';
  $('#adm').onclick=()=>{
    if(admin){admin=false}else{const p=prompt('PIN de administrador:');if(p===ADMIN_PIN)admin=true;else if(p!==null)alert('PIN incorrecto')}
    $('#adm').textContent=admin?'🔓 Admin':'🔒 Admin';draw();
  };
  Storage.subscribe(l=>{reports=l;draw()});
}
const save=r=>Storage.add(r);
const patch=(id,d)=>Storage.update(id,d);
const remove=id=>Storage.remove(id);
function pins(){return reports.filter(r=>showRes||r.status!=='resuelto').map(r=>`<div class="pin" data-id="${esc(r.id)}" style="left:${r.x*100}%;top:${r.y*100}%">${CATS[r.cat]?CATS[r.cat][0]:'📍'}<i style="background:${ST[r.status]?ST[r.status][1]:'#888'}"></i></div>`).join('')+(draft?`<div class="pin" style="left:${draft.x*100}%;top:${draft.y*100}%">📌</div>`:'')}
function draw(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  const m=$('#main');
  if(tab==='map'){
    const keep=$('#scroll');const sl=keep?keep.scrollLeft:0,st=keep?keep.scrollTop:0;
    m.innerHTML=`<div id="mapwrap"><div id="tools"><button class="btn" id="zi">＋</button><button class="btn" id="zo">－</button><button class="btn" id="tr">${showRes?'Ocultar':'Ver'} resueltos (${reports.filter(r=>r.status==='resuelto').length})</button><small class="mut" id="hint">Toca dentro del campus para marcar el problema.</small></div><div id="scroll"><div id="stage" style="width:${zoom*100}%"><img src="img/croquis.jpg" alt="Croquis del Instituto Tecnológico de Oaxaca"><svg viewBox="0 0 1 1" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><polygon points="${POLY.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#1f7a4d" stroke-width=".004" stroke-dasharray=".01 .008" vector-effect="non-scaling-stroke"/></svg>${pins()}</div></div></div>`;
    const sc=$('#scroll');sc.scrollLeft=sl;sc.scrollTop=st;
    $('#tr').onclick=()=>{showRes=!showRes;draw()};$('#zi').onclick=()=>{zoom=Math.min(4,zoom+.5);draw()};$('#zo').onclick=()=>{zoom=Math.max(1,zoom-.5);draw()};
    $('#stage').onclick=e=>{
      const p=e.target.closest('.pin');
      if(p&&p.dataset.id){detail(p.dataset.id);return}
      const r=$('#stage img').getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      if(!inside(x,y)){const hn=$('#hint');hn.textContent='⚠️ Marca dentro del perímetro punteado del campus.';hn.style.color='var(--r)';setTimeout(()=>{hn.textContent='Toca dentro del campus para marcar el problema.';hn.style.color=''},3000);return}
      draft={x,y,place:zoneAt(x,y)};cat=null;form();draw();
    };
  }else if(tab==='list'){
    const l=reports.filter(r=>showRes||r.status!=='resuelto').sort((a,b)=>(b.ts||0)-(a.ts||0));
    m.innerHTML=`<p><button class="btn" id="tr">${showRes?'Ocultar':'Ver'} resueltos (${reports.filter(r=>r.status==='resuelto').length})</button></p>`+(l.length?l.map(r=>`<div class="card" data-id="${esc(r.id)}"><b>${CATS[r.cat]?CATS[r.cat][0]+' '+CATS[r.cat][1]:''}</b> · ${esc(r.place)} <span class="tag" style="background:${ST[r.status][1]}">${ST[r.status][0]}</span><br><span>${esc(r.desc)}</span><br><small>👍 ${(r.voters||[]).length} lo vieron</small></div>`).join(''):'<p class="mut">No hay reportes activos. Ve al mapa y crea el primero.</p>');
    m.querySelectorAll('.card').forEach(c=>c.onclick=()=>detail(c.dataset.id));$('#tr').onclick=()=>{showRes=!showRes;draw()};
  }else stats(m);
}
function stats(m){
  const n=reports.length,res=reports.filter(r=>r.status==='resuelto');
  const by=(f)=>{const o={};reports.forEach(r=>{const k=f(r);o[k]=(o[k]||0)+1});return Object.entries(o).sort((a,b)=>b[1]-a[1])};
  const bars=(arr,lab)=>{const mx=Math.max(1,...arr.map(a=>a[1]));return arr.map(a=>`<div class="row"><span>${esc(lab(a[0]))}</span><div class="bar" style="width:${a[1]/mx*100}%"></div><b>${a[1]}</b></div>`).join('')||'<small class="mut">Sin datos todavía.</small>'};
  const hrs=res.filter(r=>r.doneTs&&r.ts).map(r=>(r.doneTs-r.ts)/36e5);
  const avg=hrs.length?(hrs.reduce((a,b)=>a+b,0)/hrs.length).toFixed(1)+' h':'—';
  const eco=reports.filter(r=>r.cat==='agua'||r.cat==='luz'||r.cat==='clima').length;
  m.innerHTML=`<div class="kpis"><div class="card"><b>${n}</b><small>reportes</small></div><div class="card"><b>${n?Math.round(res.length/n*100):0}%</b><small>resueltos</small></div><div class="card"><b>${avg}</b><small>tiempo medio</small></div></div>
  <div class="card"><b>Por tipo de problema</b>${bars(by(r=>r.cat),k=>CATS[k]?CATS[k][0]+' '+CATS[k][1]:k)}</div>
  <div class="card"><b>Zonas con más reportes</b>${bars(by(r=>r.place).slice(0,6),k=>k)}</div>
  <div class="card"><b>Relación con los ODS</b>${bars(by(r=>ODS[r.cat]||'—'),k=>k)}<small class="mut">${eco} de ${n} reportes son de desperdicio de agua o energía.</small></div>`;
}
function form(){
  const s=$('#sheet');s.classList.add('show');
  s.innerHTML=`<b>Nuevo reporte</b><label>¿Qué pasa?</label><div class="cats">${Object.entries(CATS).map(([k,v])=>`<button data-c="${k}">${v[0]}<br>${v[1]}</button>`).join('')}</div>
  <p class="mut" style="margin:10px 0 0">📍 Zona detectada: <b>${esc(draft.place)}</b></p>
  <label>Descripción breve</label><textarea id="ds" rows="3" maxlength="300" placeholder="Ej. No hay agua en los baños (planta alta)"></textarea>
  <p style="display:flex;gap:8px;margin:12px 0 0"><button class="btn p" id="ok">Enviar reporte</button><button class="btn" id="no">Cancelar</button></p><small class="mut" id="er"></small>`;
  s.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;s.querySelectorAll('[data-c]').forEach(x=>x.classList.toggle('on',x===b))});
  $('#no').onclick=close;
  $('#ok').onclick=async()=>{
    const ds=$('#ds').value.trim();
    if(!cat||!ds){$('#er').textContent='Elige un tipo y escribe una descripción.';return}
    await save({cat,place:draft.place,desc:ds,x:draft.x,y:draft.y,status:'pendiente',voters:[uid],ts:Date.now()});
    close();
  };
}
function detail(id){
  const r=reports.find(x=>x.id===id);if(!r)return;
  const s=$('#sheet');s.classList.add('show');draft=null;
  const voted=(r.voters||[]).includes(uid);
  s.innerHTML=`<b>${CATS[r.cat][0]} ${CATS[r.cat][1]}</b> <span class="tag" style="background:${ST[r.status][1]}">${ST[r.status][0]}</span><p>${esc(r.desc)}</p><small class="mut">${esc(r.place)} · ${new Date(r.ts).toLocaleString('es-MX')}</small>
  <p style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn p" id="vt" ${voted?'disabled':''}>👍 Yo también lo vi (${(r.voters||[]).length})</button><button class="btn" id="cl">Cerrar</button></p>
  ${admin?`<label>Estado (solo administrador)</label><p style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(ST).map(([k,v])=>`<button class="btn" data-s="${k}">${v[0]}</button>`).join('')}<button class="btn" id="dl" style="color:var(--r)">🗑️ Eliminar</button></p>`:''}`;
  $('#cl').onclick=close;
  $('#vt').onclick=async()=>{await patch(id,{voters:[...(r.voters||[]),uid]});detail(id)};
  const dl=$('#dl');if(dl)dl.onclick=async()=>{if(!confirm('¿Eliminar este reporte definitivamente?'))return;await remove(id);close()};
  s.querySelectorAll('[data-s]').forEach(b=>b.onclick=async()=>{await patch(id,{status:b.dataset.s,doneTs:b.dataset.s==='resuelto'?Date.now():null});close()});
}
function close(){draft=null;$('#sheet').classList.remove('show');draw()}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;close()});
init();
