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

// Event Timing groups events belonging to one interaction. Values below the
// requested 16ms threshold are censored, not invented zero-duration samples.
export function interactionMetrics(entries,interactionCount){
 const groups=new Map();
 for(const e of entries)if(Number.isSafeInteger(e.interactionId)&&e.interactionId>0&&Number.isFinite(e.duration)&&e.duration>=0)groups.set(e.interactionId,Math.max(groups.get(e.interactionId)||0,e.duration));
 const observed=[...groups.values()].sort((a,b)=>b-a);
 const count=Number.isSafeInteger(interactionCount)&&interactionCount>=groups.size?interactionCount:null;
 const index=count===null?0:Math.floor(count/50);
 return {observedInteractions:groups.size,interactionCount:count,labInpCandidateMs:observed[index]??null,belowThresholdMs:observed[index]===undefined?16:null};
}
