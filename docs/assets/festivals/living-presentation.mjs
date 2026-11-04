// Five authored prototypes, not religious calendar evidence or approved release art.
// Original artwork and category colours are never replaced by these atmospheres.
export const THEMES=Object.freeze({
 diwali:{name:'Diwali',motif:'lamp',path:'categories/01-deities-sub-deities-and-divine-forms/lakshmi/',summary:'Lamp-light, maroon and gold, with an ornamental rangoli perimeter.',greeting:'May this season of light bring peace and well-being.'},
 holi:{name:'Holi',motif:'petal',path:'categories/01-deities-sub-deities-and-divine-forms/krishna/',summary:'Spring colour clouds and drifting floral shapes, outside the reading surface.',greeting:'Wishing you a peaceful and joyful spring celebration.'},
 shivaratri:{name:'Maha Shivaratri',motif:'moon',path:'categories/01-deities-sub-deities-and-divine-forms/shiva-mahesh/',summary:'Midnight blue, silver moonlight and a calm celestial perimeter.',greeting:'A peaceful Maha Shivaratri to you and your family.'},
 chhath:{name:'Chhath',motif:'sun',path:'categories/01-deities-sub-deities-and-divine-forms/surya/',summary:'Sunrise gold and river-like horizontal light, without invented ritual instructions.',greeting:'Warm wishes for Chhath.'},
 pongal:{name:'Pongal',motif:'grain',path:'categories/01-deities-sub-deities-and-divine-forms/surya/',summary:'Harvest green, warm sunlight and a geometric kolam-inspired perimeter.',greeting:'Wishing you peace and abundance this Pongal.'}
});
// Abstract ornaments only. No deity is generated or modified; no external assets.
const paths={
 lamp:'M8 28Q30 48 52 28Z M30 24C20 16 30 9 30 4C39 15 40 20 30 24Z M9 49H51 M18 43H42',
 petal:'M30 47C5 42 4 18 9 9C23 9 30 18 30 28C30 18 37 9 51 9C56 28 48 43 30 47Z M30 47V28',
 moon:'M40 5C12 9 10 43 40 52C2 57 1 6 40 5Z M46 14V24 M41 19H51 M48 36V42 M45 39H51',
 sun:'M5 39H55 M10 46H50 M18 53H42 M16 32A14 14 0 0 1 28 16A14 14 0 0 1 44 32 M30 3V10 M7 14L13 20 M53 14L47 20 M3 29H10 M50 29H57',
 grain:'M30 54V8 M30 20C14 20 13 10 14 6C26 6 30 12 30 20Z M30 32C46 32 47 22 46 18C34 18 30 24 30 32Z M30 44C14 44 13 34 14 30C26 30 30 36 30 44Z'
};
export function ornament(document,motif){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 60 60');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
 const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[motif]||paths.petal);
 svg.append(path);return svg;
}
export function quality({effects='auto',reducedMotion=false,highContrast=false,dataSaver=false,cores=8,memory=8}={}){
 return effects==='auto'&&!reducedMotion&&!highContrast&&!dataSaver&&cores>=4&&memory>=4?'full':'calm';
}
