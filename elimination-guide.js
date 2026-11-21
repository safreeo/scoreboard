(function(){
'use strict';
let current=15, mode='list';
const t=(en,bm)=>typeof infoLang!=='undefined'&&infoLang==='BM'?bm:en;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function model(n){
 const size=2**Math.floor(Math.log2(n)),bye=2*size-n;
 const prelim=Array.from({length:n-size},(_,i)=>({id:'P'+(i+1),a:bye+i+1,b:n-i}));
 const map=new Map(prelim.map(p=>[p.a,p.id]));
 let order=[1,2];while(order.length<size){const sum=order.length*2+1;order=order.flatMap(x=>[x,sum-x]);}
 let names=order.map(s=>s<=bye?'#'+s:'Winner '+map.get(s));
 const rounds=[];
 while(names.length>1){
  const label=names.length===2?'FINAL':names.length===4?'SF':names.length===8?'QF':'R'+names.length;
  const matches=Array.from({length:names.length/2},(_,i)=>({id:label+(label==='FINAL'?'':i+1),a:names[i*2],b:names[i*2+1]}));
  rounds.push({label,matches});names=matches.map(m=>'Winner '+m.id);
 }
 return {n,size,bye,prelim,rounds};
}
function report(m){
 const out=['ELIMINATION ROUND','Participants: '+m.n,'Bye: '+m.bye,'Bye seeds: '+(m.bye?'#1–#'+m.bye:'None'),'Main bracket: Top '+m.size,'','PRELIMINARY'];
 m.prelim.forEach(p=>out.push(p.id+': #'+p.a+' vs #'+p.b));
 m.rounds.forEach(r=>{out.push('',r.label);r.matches.forEach(p=>out.push(p.id+': '+p.a+' vs '+p.b));});
 out.push('','3RD / 4TH PLACE','Loser SF1 vs Loser SF2');return out.join('\n');
}
function svg(m){
 const stages=(m.prelim.length?[{label:'PRELIM',matches:m.prelim.map(p=>({id:p.id,a:'#'+p.a,b:'#'+p.b}))}]:[]).concat(m.rounds);
 const width=stages.length*205+24,top=70,unit=58,first=Math.max(m.prelim.length,m.size/2),height=Math.max(440,top+first*unit+115);
 let s='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Elimination bracket"><rect width="100%" height="100%" fill="#f7f9fc"/>';
 const positions=[];
 stages.forEach((stage,k)=>{
  const x=12+k*205,prelim=k===0&&m.prelim.length>0,mainIndex=k-(m.prelim.length?1:0);
  s+='<text x="'+x+'" y="28" font-size="13" font-weight="700" fill="#14345b">'+esc(stage.label)+'</text>';
  const ys=stage.matches.map((p,i)=>prelim?top+i*unit:top+(Math.pow(2,mainIndex)*unit-unit)/2+i*Math.pow(2,mainIndex)*unit);
  positions.push(ys);
  stage.matches.forEach((p,i)=>{
   const y=ys[i];
   s+='<rect x="'+x+'" y="'+y+'" width="180" height="47" rx="7" fill="#fff" stroke="#9aafc8"/><text x="'+(x+7)+'" y="'+(y+13)+'" font-size="10" font-weight="700" fill="#346194">'+esc(p.id)+'</text>';
   s+='<text x="'+(x+7)+'" y="'+(y+27)+'" font-size="10" fill="#18324e">'+esc(p.a)+'</text><text x="'+(x+7)+'" y="'+(y+41)+'" font-size="10" fill="#18324e">'+esc(p.b)+'</text>';
  });
 });
 const offset=m.prelim.length?1:0;
 for(let k=offset;k<stages.length-1;k++){
  positions[k].forEach((y,i)=>{
   const x=12+k*205+180,mid=positions[k+1][Math.floor(i/2)]+23;
   s+='<path d="M '+x+' '+(y+23)+' H '+(x+10)+' V '+mid+' H '+(x+23)+'" stroke="#7691ac" fill="none" stroke-width="1.5"/>';
  });
 }
 const tx=12+(stages.length-1)*205,ty=positions[stages.length-1][0]+70;
 s+='<rect x="'+tx+'" y="'+ty+'" width="180" height="61" rx="7" fill="#e6f3e9" stroke="#78aa8c"/><text x="'+(tx+7)+'" y="'+(ty+17)+'" font-size="11" font-weight="700" fill="#185d3e">3RD / 4TH PLACE</text><text x="'+(tx+7)+'" y="'+(ty+36)+'" font-size="11" fill="#18324e">Loser SF1</text><text x="'+(tx+7)+'" y="'+(ty+51)+'" font-size="11" fill="#18324e">Loser SF2</text></svg>';
 return s;
}
function draw(){
 const root=document.getElementById('elimination-results');if(!root)return;
 const n=Number(current);
 if(!Number.isInteger(n)||n<4||n>40){root.innerHTML='<p style="color:#b91c1c">'+t('Enter a whole number from 4 to 40.','Masukkan nombor bulat antara 4 hingga 40.')+'</p>';return;}
 const m=model(n);
 let h='<div class="el-stats"><div><b>'+n+'</b><small>'+t('Participants','Peserta')+'</small></div><div><b>'+m.bye+'</b><small>Bye</small></div><div><b>'+m.prelim.length+'</b><small>'+t('Preliminary','Awal')+'</small></div><div><b>Top '+m.size+'</b><small>Bracket</small></div></div>';
 h+='<div class="el-switch"><button class="btn '+(mode==='list'?'el-active':'soft')+'" onclick="elView(\'list\')">'+t('MATCH LIST','SENARAI PERLAWANAN')+'</button><button class="btn '+(mode==='bracket'?'el-active':'soft')+'" onclick="elView(\'bracket\')">'+t('FULL BRACKET','CARTA PENUH')+'</button></div>';
 if(mode==='bracket'){
  h+='<p class="el-note">'+t('Swipe sideways to view the entire bracket. # means seed; Winner and Loser refer to match outcomes.','Leret ke sisi untuk melihat keseluruhan carta. # ialah seed; Winner dan Loser merujuk keputusan perlawanan.')+'</p><div class="el-scroll">'+svg(m)+'</div>';
 }else{
  h+='<h3>'+t('Bye Allocation','Penentuan Bye')+'</h3><p>'+(m.bye?'#1'+(m.bye>1?' – #'+m.bye:'')+' → Top '+m.size:t('No Bye.','Tiada Bye.'))+'</p><h3>'+t('Preliminary Matches','Perlawanan Awal')+'</h3>';
  h+=m.prelim.length?m.prelim.map(p=>'<div class="el-match"><b>'+p.id+'</b><span>#'+p.a+' vs #'+p.b+'</span></div>').join(''):'<p>—</p>';
  m.rounds.forEach(r=>{h+='<h3>'+r.label+'</h3>'+r.matches.map(p=>'<div class="el-match"><b>'+p.id+'</b><span>'+esc(p.a)+' vs '+esc(p.b)+'</span></div>').join('');});
  h+='<h3>'+t('3rd / 4th Place','Tempat Ke-3 / Ke-4')+'</h3><div class="el-match"><b>3RD</b><span>Loser SF1 vs Loser SF2</span></div>';
 }
 h+='<button class="btn soft" onclick="elCopy()">'+t('COPY RESULTS','SALIN KEPUTUSAN')+'</button>';
 root.innerHTML=h;
}
window.elView=v=>{mode=v;draw();};
window.elCount=v=>{current=v;draw();};
window.elCopy=()=>{const str=report(model(Number(current)));if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(str).then(()=>alert(t('Copied.','Disalin.'))).catch(()=>prompt('Copy:',str));else prompt('Copy:',str);};
window.eliminationGuide=()=>{
 const bm=typeof infoLang!=='undefined'&&infoLang==='BM';
 page(head(bm?'PANDUAN PUSINGAN PENYINGKIRAN':'ELIMINATION ROUND GUIDE')+'<section class="card el-guide"><h2>'+(bm?'Kalkulator Bye & Carta Perlawanan':'Bye Calculator & Match Bracket')+'</h2><p class="el-note">'+(bm?'Seed #1 ialah peserta ranking tertinggi. Panduan ini tidak merekod keputusan.':'Seed #1 is the highest-ranked participant. This guide does not record match results.')+'</p><label for="el-input">'+(bm?'Jumlah peserta / pasukan (4–40)':'Number of participants / teams (4–40)')+'</label><input id="el-input" type="number" min="4" max="40" step="1" value="'+current+'" oninput="elCount(this.value)" style="display:block;width:100%;padding:12px;margin:8px 0 14px;border:1px solid #9eafc3;border-radius:9px;font-size:18px"/><div id="elimination-results"></div></section>','elimination');
 draw();
};
})();