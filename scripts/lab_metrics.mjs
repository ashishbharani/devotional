// Session-window CLS for a finite lab trace, never field-performance evidence.
export function layoutMetrics(entries){
 const shifts=entries.filter(e=>Number.isFinite(e.startTime)&&Number.isFinite(e.value)&&e.value>=0&&!e.hadRecentInput).toSorted((a,b)=>a.startTime-b.startTime);
 let sum=0,maximum=0,session=0,first=null,last=null;
 for(const e of shifts){
  sum+=e.value;
  if(first!==null&&e.startTime-last<1000&&e.startTime-first<5000)session+=e.value;
  else{first=e.startTime;session=e.value;}
  last=e.startTime;maximum=Math.max(maximum,session);
 }
 return {layoutShiftSum:sum,labCls:maximum};
}
