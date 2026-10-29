'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=s=>String(s??'').trim().replace(/\\n/g,'\n');
const norm=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const title=s=>clean(s).toLocaleLowerCase('es').replace(/^\p{L}/u,c=>c.toLocaleUpperCase('es'));
const source='https://docs.google.com/spreadsheets/d/11Ztrxd5k_GyVfUXZZBgBkQJmvTwO8haj8VVWkbW6ZoE/edit?gid=886468410';
let data,props=[],mode='todo',selected,tab='general',backFocus;
function valid(s){return !!s&&!/^#(N\/A|REF!|ERROR!|VALUE!)/.test(s)}
function val(s){return valid(s)?esc(s):'<span class="muted">Pendiente de documentar</span>'}
function shape(p){let n=norm(p.name);return /ESCALINATA|EXHIBIDOR|ALZADOR|BODEGON/.test(n)?'tier':/CENEFA|PORTAPRECIO|PORTAPRECIO|GANCHERA/.test(n)?'strip':/ACRILICO|HABLADOR|CUBO|PECERA|BANDEJA/.test(n)?'':'generic'}
function art(p){return '<div class="mini3d '+shape(p)+'" aria-hidden="true"><i></i><i></i><i></i></div>'}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';setTimeout(()=>$('#toast').style.display='none',3000)}
function setMode(m){mode=m;$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));render()}
function render(){
const q=norm($('#search').value),b=$('#brand').value,m=$('#material').value;
const results=props.filter(p=>(!q||norm([p.name,p.code,p.material,p.brand,p.use].join(' ')).includes(q))&&(!b||p.brand===b)&&(!m||p.material===m));
$('#count').textContent=results.length+' de '+props.length+' piezas · '+(mode==='produccion'?'Vista de producción':mode==='tienda'?'Vista de tienda':'Catálogo universal');
$('#cards').innerHTML=results.length?results.map(p=>'<button class="card" data-id="'+p.id+'" aria-label="Abrir ficha de '+esc(p.name)+'"><div class="cardArt"><span class="brandTag">'+esc(p.brand.replace(/ - LILIPRINT/g,''))+'</span>'+art(p)+'<small class="artNote">ILUSTRACIÓN ORIENTATIVA · NO ES FOTO</small></div><div class="cardInfo"><span class="code">'+esc(valid(p.code)?p.code:'CÓDIGO PENDIENTE')+'</span><h3>'+esc(title(p.name))+'</h3><div class="specs">'+esc(p.material||'Material pendiente')+' · '+esc(p.caliber||'Calibre pendiente')+'</div><div class="cardBottom"><b>'+esc(mode==='tienda'?'Vida útil: '+(p.life||'por definir'):mode==='produccion'?(p.measure||'Medidas pendientes'):(p.cost||'Costo pendiente'))+'</b><span>Ver ficha ↗</span></div></div></button>').join(''):'<div class="empty">No encontramos piezas con esos filtros.<br><button id="reset">Limpiar filtros</button></div>';
$$('[data-id]').forEach(b=>b.onclick=()=>openProp(Number(b.dataset.id)));
if($('#reset'))$('#reset').onclick=()=>{$('#search').value='';$('#brand').value='';$('#material').value='';render()};
}
function field(label,value){return '<div class="datum"><small>'+esc(label)+'</small><p>'+val(value)+'</p></div>'}
function criteria(p){
const hits=[];
for(const t of data.tabs.slice(1)){
const head=t.values[0];
for(let i=1;i<t.values.length;i++){const r=t.values[i];if(norm(r[3])===norm(p.name)&&norm(r[5])===norm(p.brand)&&norm(r[0])===norm(p.material)&&norm(r[1])===norm(p.caliber)){hits.push({sheet:t.range.split('!')[0].replace(/^'|'$/g,''),code:clean(r[2]),items:head.slice(6).map((h,j)=>[clean(h),clean(r[j+6])]).filter(x=>x[1]!=='')})}}
}
return hits;
}
function content(p,t){
if(t==='cuidados')return '<div class="care"><div><h3>Uso y manipulación</h3><p>'+val(p.care)+'</p></div><div><h3>Almacenamiento</h3><p>'+val(p.storage)+'</p></div></div><div class="dataGrid">'+field('Vida útil estimada',p.life)+field('Tipo de uso',p.use)+'</div><div class="fileRow"><b>Imagen de implementación</b><p>'+ (p.implementation?esc(p.implementation):'Pendiente de incorporar una imagen verificable del manual.')+'</p></div><div class="notice">La vida útil es una referencia del manual, no una garantía. Si falta una recomendación específica, solicita validación al área encargada de props antes de aplicar productos o procedimientos de limpieza.</div>';
if(t==='produccion')return '<div class="dataGrid">'+field('Código de fabricación',p.code)+field('Material',p.material)+field('Calibre (según manual)',p.caliber)+field('Medidas del prop',p.measure)+field('Medidas del POP',p.pop)+field('Área / marca',p.brand)+'</div><div class="fileRow"><b>Línea de troquel / archivo de fabricación</b><p>'+esc(p.die||'Archivo no documentado')+'</p>'+(p.links.length?p.links.map(u=>'<a href="'+esc(u)+'" target="_blank" rel="noopener">Abrir archivo en Drive ↗</a>').join(' '):'<span class="muted">'+(p.die?'El manual registra un nombre de archivo, pero no un enlace de descarga.':'Pendiente de enlazar el archivo aprobado.')+'</span>')+'</div><div class="notice">Confirma versión del plano, escala, unidades y aprobación antes de producir. Las ilustraciones de este sitio no son planos ni modelos de fabricación. Los enlaces de Drive conservan sus permisos originales.</div>';
if(t==='criterios'){let hits=criteria(p);return '<h3>Criterios de distribución</h3><p class="muted">Coincidencias exactas por nombre, área, material y calibre. El código se conserva tal como aparece en cada pestaña.</p>'+ (hits.length?hits.map(c=>'<div class="fileRow"><b>'+esc(c.sheet)+'</b><p>Código en criterios: '+esc(c.code)+'</p>'+(norm(c.code)!==norm(p.code)?'<div class="notice">Este código difiere del catálogo base ('+esc(p.code||'pendiente')+'). Validar la equivalencia con el área encargada antes de solicitar o fabricar.</div>':'')+c.items.map(x=>'<div class="criteriaRow"><small>'+esc(x[0])+'</small><span>'+esc(x[1])+'</span></div>').join('')+'</div>').join(''):'<div class="notice">No se encontró una coincidencia exacta validable en las pestañas de criterios. Consulta el manual fuente y confirma la distribución con el área encargada.</div>')}
if(t==='solicitar')return '<h3>Prepara la reposición de esta pieza</h3><div class="dataGrid">'+field('Prop',p.name)+field('Código para identificar',p.code)+field('Área / marca',p.brand)+field('Tipo de solicitud (manual)',p.request)+field('Motivo de solicitud (manual)',p.reason)+field('Cantidad requerida','Por indicar por el solicitante')+'</div><div class="notice"><b>Formulario oficial pendiente</b><p>Prepara identificación de tienda, contacto, cantidad, descripción de la novedad, fotos y fecha requerida. El radicado, las aprobaciones y el seguimiento se definirán con el área encargada. No se envía información desde este sitio.</p></div><a class="outline" href="#solicitudes" id="fullGuide">Ver guía completa de solicitudes →</a>';
return '<div class="dataGrid">'+field('Código de fabricación',p.code)+field('Material',p.material)+field('Calibre (según manual)',p.caliber)+field('Área / marca',p.brand)+field('Medidas del prop',p.measure)+field('Medidas del POP',p.pop)+field('Tipo de uso',p.use)+field('Costo unitario referencial',p.cost)+field('Vida útil estimada',p.life)+field('Tipo de solicitud',p.request)+field('Motivo de la solicitud',p.reason)+field('Código QR',p.qr||'Futuro · pendiente de definir')+'</div><div class="notice">La referencia 3D es conceptual. Fotografía del prop, imagen de implementación y modelo 3D exacto pendientes de incorporar. Los valores y unidades se muestran tal como figuran en la hoja; los campos vacíos o con error requieren validación.</div>';
}
function drawDetail(){
const p=selected;
$('#detailBody').innerHTML='<div class="detailTop"><div class="detailArt" id="rotateArt" tabindex="0" role="group" aria-label="Ilustración 3D orientativa. Usa las flechas izquierda y derecha para girarla.">'+art(p)+'<small>3D CONCEPTUAL · NO APTO PARA FABRICACIÓN<br>Arrastra o usa ← → para girar</small></div><div><span class="code">'+esc(valid(p.code)?p.code:'CÓDIGO PENDIENTE DE VALIDAR')+'</span><h2>'+esc(title(p.name))+'</h2><div class="detailTags"><span>'+esc(p.brand)+'</span><span>'+esc(p.material||'Material pendiente')+'</span></div><div class="detailButtons"><button id="copy">Copiar enlace de esta pieza ↗</button><a href="'+source+'&range=A'+p.row+':R'+p.row+'" target="_blank" rel="noopener">Ver fila en manual ↗</a></div><p class="muted">Foto de referencia: pendiente de incorporar.<br>Costo: '+esc(p.cost||'por documentar')+' · Vida útil: '+esc(p.life||'por documentar')+'</p></div></div><div class="tabs" role="tablist">'+[['general','Información'],['cuidados','Uso y cuidados'],['produccion','Producción'],['criterios','Distribución'],['solicitar','Reposición']].map(([k,v])=>'<button role="tab" aria-selected="'+(tab===k)+'" class="'+(tab===k?'active':'')+'" data-tab="'+k+'">'+v+'</button>').join('')+'</div><div class="detailContent" role="tabpanel">'+content(p,tab)+'</div>';
$$('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;drawDetail();$('#detail [data-tab="'+tab+'"]').focus()});
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(location.origin+location.pathname+'#prop-'+p.id);toast('Enlace copiado')}catch{toast('Copia el enlace desde la barra del navegador')}};
if($('#fullGuide'))$('#fullGuide').onclick=()=>$('#detail').close();
let artEl=$('#rotateArt'),angle=-28,start=null;
function turn(a){angle=a;artEl.querySelector('.mini3d').style.transform='rotateX(-15deg) rotateY('+angle+'deg)'}
artEl.onpointerdown=e=>{start=[e.clientX,angle];artEl.setPointerCapture(e.pointerId)};
artEl.onpointermove=e=>{if(start)turn(start[1]+e.clientX-start[0])};artEl.onpointerup=artEl.onpointercancel=()=>start=null;
artEl.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();turn(angle+(e.key==='ArrowLeft'?-15:15))}};
}
function openProp(id,fromHash=false){selected=props.find(p=>p.id===id);if(!selected)return;backFocus=document.activeElement;tab=mode==='tienda'?'cuidados':mode==='produccion'?'produccion':'general';drawDetail();if(!$('#detail').open)$('#detail').showModal();if(!fromHash)history.replaceState(null,'','#prop-'+id)}
$('#close').onclick=()=>$('#detail').close();$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close()}});
$('#detail').addEventListener('close',()=>{if(location.hash.startsWith('#prop-'))history.replaceState(null,'','#catalogo');backFocus?.focus()});
$('#print').onclick=()=>{const previous=tab;$('#detailBody').querySelector('.detailContent').innerHTML=['general','cuidados','produccion','criterios','solicitar'].map(t=>content(selected,t)).join('');window.print();tab=previous;drawDetail()};
$$('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
$$('[data-role]').forEach(b=>b.onclick=()=>{if(b.dataset.role==='gestion'){location.hash='solicitudes';return}setMode(b.dataset.role);location.hash='catalogo'});
['search','brand','material'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));
fetch('catalog-source.json').then(r=>{if(!r.ok)throw Error('catalog');return r.json()}).then(d=>{data=d;props=d.tabs[0].values.slice(1).map((r,i)=>{const c=r.map(clean);return {id:i+1,row:i+2,material:c[0]||'',caliber:c[1]||'',qr:c[2]||'',code:c[3]||'',name:c[4]||'',image:c[5]||'',brand:c[6]||'',measure:c[7]||'',pop:c[8]||'',implementation:c[9]||'',request:c[10]||'',reason:c[11]||'',die:c[12]||'',use:c[13]||'',cost:c[14]||'',life:c[15]||'',care:c[16]||'',storage:c[17]||'',links:d.links.filter(x=>x.row===i+2&&x.col===12).flatMap(x=>x.urls).filter(u=>/^https:\/\//.test(u))}}).filter(p=>p.name);
$('#total').textContent=props.length;
for(const [id,key]of [['brand','brand'],['material','material']])$('#'+id).innerHTML+=[...new Set(props.map(p=>p[key]).filter(Boolean))].sort().map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('');
render();if(location.hash.startsWith('#prop-'))openProp(Number(location.hash.slice(6)),true);window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#prop-'))openProp(Number(location.hash.slice(6)),true)})}).catch(()=>{$('#cards').innerHTML='<div class="empty">No pudimos cargar el catálogo. Recarga la página o consulta el <a href="'+source+'">manual fuente ↗</a>.</div>';$('#count').textContent='Catálogo temporalmente no disponible'});


