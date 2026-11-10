/* R157: replace legacy multiple-distance end rules with per-distance resizing. */
(function(){
  'use strict';
  const previousApply=window.applyEnds;
  window.applyEnds=function(){
    if(typeof S!=='undefined' && S.setup?.practiceType==='target' && S.setup.distanceMode==='multiple' && typeof window.r157NativeApplyEnds==='function'){
      return window.r157NativeApplyEnds();
    }
    return previousApply?.();
  };
  const previousManage=window.manageEnds;
  window.manageEnds=function(){
    const result=previousManage?.();
    if(typeof S!=='undefined' && S.setup?.practiceType==='target' && S.setup.distanceMode==='multiple'){
      const value=document.getElementById('manageEndValue');
      if(value){
        const m=S.setup.multi||{};
        value.textContent=String(m.roundMode==='all'?Number(m.endsByDistance?.[0])||1:Number(m.roundEnds?.[0])||1);
      }
    }
    return result;
  };
})();