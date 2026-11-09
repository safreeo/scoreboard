/* SCOREBOARD R155 - Practice format field-test refinements */
(function(){
  'use strict';
  function isOne(){return !!document.querySelector('.setup-page #r155ApplyFormat');}
  window.r155MarkPreviewDirty=function(){
    const b=document.getElementById('r155ApplyFormat');
    if(b){b.classList.remove('r155-applied');b.classList.add('r155-ready');}
  };
  window.r155ApplyPreview=function(){
    if(!isOne())return;
    if(typeof syncSetup==='function')syncSetup();
    const m=S.setup.multi||{};
    const n=Math.max(2,Number(S.setup.rounds)||2);
    const one=m.roundMode==='one';
    const ends=one?m.roundEnds.slice(0,n).reduce((sum,v)=>sum+(Number(v)||0),0):m.endsByDistance.reduce((sum,v)=>sum+(Number(v)||0),0)*n;
    const arrows=Number(S.setup.arrows)||0;
    const preview=document.getElementById('r155FormatPreview');
    if(preview){
      const rows=Array.from({length:n},(_,i)=>{
        if(one)return '<div>R'+(i+1)+': '+(Number(m.roundDistances[i])||30)+'m × '+(Number(m.roundEnds[i])||1)+'E</div>';
        const items=m.distances.map((d,di)=>({d,e:m.endsByDistance[di]}));
        if(m.orders?.[i]==='desc')items.reverse();
        return '<div>R'+(i+1)+': '+items.map(x=>x.d+'m × '+x.e+'E').join(' → ')+'</div>';
      }).join('');
      preview.innerHTML='<b>FORMAT PREVIEW</b>'+rows+'<small>'+arrows+' Arrows/End • Total '+ends+' Ends • '+(ends*arrows)+' Arrows</small>';
    }
    const b=document.getElementById('r155ApplyFormat');
    if(b){b.classList.remove('r155-ready');b.classList.add('r155-applied');}
  };
  document.addEventListener('input',function(e){
    if(!isOne())return;
    if(e.target.closest?.('.multi-common-layout,.multi-distance-grid,.multi-round-list,.multi-count-full'))window.r155MarkPreviewDirty();
  },true);
  document.addEventListener('change',function(e){
    if(!isOne())return;
    if(e.target.closest?.('.r155-common,.r155-one-round-grid'))window.r155MarkPreviewDirty();
  },true);
})();