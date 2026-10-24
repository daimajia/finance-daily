const SECTIONS={x:'data/x-digest.json',earnings:'data/earnings.json',bofa:'data/bofa.json',iran:'data/iran.json'};
const cache={};const app=document.getElementById('app');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const load=k=>cache[k]||(cache[k]=fetch(SECTIONS[k]+'?v='+Date.now()).then(r=>r.json()));
const dates=d=>Object.keys(d.days||{}).sort().reverse();
const fmt=s=>{const[y,m,d]=s.split('-');return `${y}年${+m}月${+d}日`};
const handles=h=>h&&h.length?`<span class="h">${h.map(x=>`<a href="https://x.com/${encodeURIComponent(x)}" target="_blank" rel="noopener">@${esc(x)}</a>`).join('')}</span>`:'';
const unv=i=>i.unverified?'<span class="unv">未证实</span>':'';
function picker(k,list,cur){return `<div class="datebar"><span class="muted">日期</span><select onchange="location.hash='#/${k}/'+this.value">${list.map(d=>`<option value="${d}"${d===cur?' selected':''}>${fmt(d)}</option>`).join('')}</select></div>`}
function empty(d,msg){return `<div class="empty"><div class="big">Empty</div><h3>暂无数据</h3><p>${msg}</p></div>`}
function xItems(day){return day.topics.map(t=>`<div class="card topic"><h3>${esc(t.title)}</h3><ul>${t.items.map(i=>`<li>${esc(i.text)}${unv(i)} ${handles(i.handles)}</li>`).join('')}</ul></div>`).join('')}
function earnItems(day){return day.sessions.map(s=>`<div class="card"><h3>${esc(s.name)}</h3><table><thead><tr><th>代码</th><th>EPS（实际 vs 预期）</th><th>营收</th><th>要点</th><th>股价反应</th></tr></thead><tbody>${s.items.map(i=>`<tr><td class="t">${esc(i.ticker)}</td><td data-l="EPS">${esc(i.eps)||'—'}</td><td data-l="营收">${esc(i.revenue)||'—'}</td><td data-l="要点" class="note${i.notes?'':' empty-cell'}">${esc(i.notes)||'—'}</td><td data-l="反应" class="${i.dir}">${esc(i.move)||'—'}</td></tr>`).join('')}</tbody></table><div class="src">来源：${s.sources.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(new URL(u).hostname)}</a>`).join(' · ')}</div></div>`).join('')}
async function section(k,date){const d=await load(k);const list=dates(d);
 let h=`<h1>${esc(d.title)}</h1><p class="sub">${[d.schedule,d.note].filter(Boolean).map(esc).join(' · ')}</p>`;
 if(!list.length)return h+empty(d,d.nextIssue?`下一期：${fmt(d.nextIssue)}`:'敬请关注，有新进展将第一时间更新');
 const cur=list.includes(date)?date:list[0];const day=d.days[cur];h+=picker(k,list,cur);
 if(k==='x')h+=xItems(day);else if(k==='earnings')h+=earnItems(day);else h+=(day.items||[]).map(i=>`<div class="card">${esc(i.text)} ${handles(i.handles)}${i.source?` <a href="${esc(i.source)}" target="_blank">来源</a>`:''}</div>`).join('');
 return h}
async function home(){const [x,e,b,ir]=await Promise.all(['x','earnings','bofa','iran'].map(load));const hl=[];
 const xd=dates(x)[0];if(xd)x.days[xd].topics.forEach(t=>t.items.filter(i=>i.highlight).forEach(i=>hl.push({tag:t.title,html:`${esc(i.text)}${unv(i)} ${handles(i.handles)}`,href:'#/x/'+xd})));
 const ed=dates(e)[0];if(ed)e.days[ed].sessions.forEach(s=>s.items.filter(i=>i.highlight).forEach(i=>hl.push({tag:'财报·'+s.name,html:`<b>${esc(i.ticker)}</b> ${esc(i.notes||i.revenue)} — <span class="${i.dir}">${esc(i.move)}</span>`,href:'#/earnings/'+ed})));
 const tile=(k,d,info)=>`<a class="tile" href="#/${k}"><b>${esc(d.title)}</b><span>${info}</span></a>`;
 return `<h1>今日要点</h1><p class="sub">${xd?'更新于 '+fmt(xd):''} · 自动汇总各栏目重点</p><div class="card"><ul class="hl">${hl.map(i=>`<li><span class="tag">${esc(i.tag)}</span><div>${i.html} <a href="${i.href}">详情 →</a></div></li>`).join('')||'<li class="muted">暂无</li>'}</ul></div>
 <h2>栏目</h2><div class="grid">${tile('x',x,xd?'最新：'+fmt(xd):'暂无')}${tile('earnings',e,ed?'最新：'+fmt(ed)+'（美东）':'暂无')}${tile('bofa',b,b.nextIssue?'下一期：'+fmt(b.nextIssue):'暂无')}${tile('iran',ir,dates(ir)[0]?'最新：'+fmt(dates(ir)[0]):'暂无数据')}</div>`}
async function archive(){const all=await Promise.all(Object.keys(SECTIONS).map(async k=>[k,await load(k)]));
 return `<h1>归档</h1><p class="sub">按日期浏览历史内容</p>`+all.map(([k,d])=>`<div class="card"><h3>${esc(d.title)}</h3>${dates(d).map(x=>`<a class="arch-link" href="#/${k}/${x}">${fmt(x)}</a>`).join('')||'<span class="muted">暂无</span>'}</div>`).join('')}
async function route(){document.body.classList.remove('nav-open');const [,k,date]=(location.hash||'#/').split('/');
 document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#/'+(k||'')));
 try{app.innerHTML=!k?await home():k==='archive'?await archive():SECTIONS[k]?await section(k,date):'<p>页面不存在</p>'}catch(e){app.innerHTML='<p class="muted">数据加载失败，请稍后重试。</p>'}window.scrollTo(0,0)}
addEventListener('hashchange',route);route();
