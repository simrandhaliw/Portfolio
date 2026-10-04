// Keep a comparison font when navigating between local portfolio pages.
function preserveComparisonFont(root) {
 if(document.documentElement.dataset.font!=='geist')return;
 for(const link of root.querySelectorAll('a[href]')) {
  const url=new URL(link.href,location.href);
  if(url.origin===location.origin&&url.pathname.endsWith('.html')) {url.searchParams.set('font','geist');link.href=url.href;}
 }
}
preserveComparisonFont(document);

// Theme is explicit and local; first-time visitors get the light palette.
const themeButton=document.querySelector('.theme-toggle');
function syncTheme() {
 const dark=document.documentElement.dataset.theme==='dark';
 themeButton?.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);
 themeButton?.setAttribute('aria-pressed',String(dark));
 document.querySelector('meta[name="theme-color"]')?.setAttribute('content',getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim());
}
syncTheme();
themeButton?.addEventListener('click',()=>{
 const dark=document.documentElement.dataset.theme!=='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 try {localStorage.setItem('sim-theme',dark?'dark':'light');} catch {}
 syncTheme();
});
window.addEventListener('storage',event=>{if(event.key==='sim-theme'){document.documentElement.dataset.theme=event.newValue==='dark'?'dark':'light';syncTheme();}});

// Keep the masthead available on upward scrolling without covering the page
// throughout long reading sections. Focus always reveals it for keyboard users.
const masthead=document.querySelector('.site-header');
if(masthead){
 let previousY=Math.max(0,scrollY),direction=0,travel=0,frame=0;
 const show=()=>{masthead.classList.remove('is-hidden');document.documentElement.classList.remove('masthead-hidden');};
 const hide=()=>{masthead.classList.add('is-hidden');document.documentElement.classList.add('masthead-hidden');};
 const update=()=>{
  frame=0;
  const y=Math.max(0,scrollY),delta=y-previousY,nextDirection=Math.sign(delta);
  masthead.classList.toggle('is-scrolled',y>8);
  if(nextDirection&&nextDirection!==direction){direction=nextDirection;travel=0;}
  travel+=Math.abs(delta);
  // Pointer clicks leave the theme button focused; only visible keyboard focus
  // should keep the masthead open while the reader scrolls.
  if(y<=masthead.offsetHeight+24||masthead.querySelector(':focus-visible'))show();
  else if(direction>0&&travel>=28){hide();travel=0;}
  else if(direction<0&&travel>=16){show();travel=0;}
  previousY=y;
 };
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
 addEventListener('pageshow',()=>{previousY=Math.max(0,scrollY);show();update();});
 masthead.addEventListener('focusin',show);
 update();
}

// Only show success after the clipboard operation succeeds.
for(const button of document.querySelectorAll('[data-copy-email]')) {
 const feedback=button.nextElementSibling;
 let timer;
 button.addEventListener('click',async()=>{
  clearTimeout(timer);
  const email=button.dataset.copyEmail;
  let copied=false;
  try {await navigator.clipboard.writeText(email);copied=true;} catch {
   const field=document.createElement('textarea');field.value=email;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(field);field.select();
   try {copied=document.execCommand('copy');} catch {}
   field.remove();button.focus({preventScroll:true});
  }
  feedback.textContent=copied?'Copied':'Couldn’t copy. Try again.';
  timer=setTimeout(()=>{feedback.textContent='';},copied?2000:4000);
 });
}


let horizontalRegionId=0;
function enhanceScrollers(root,cleanups) {
// Reveal paired controls only when a navigation strip or table actually overflows.
// Keep native touch/trackpad scrolling and keyboard navigation intact.
for(const [index,scroller] of [...root.querySelectorAll('.selector-row,.about-nav,.table-scroll,.case-chapter-links')].entries()) {
 const isTable=scroller.classList.contains('table-scroll');
 const shell=document.createElement('div');shell.className=`horizontal-region horizontal-region--${isTable?'table':'nav'}`;
 scroller.before(shell);shell.append(scroller);
 if(!scroller.id)scroller.id=`horizontal-content-${++horizontalRegionId}`;
 const label=(scroller.getAttribute('aria-label')||'table').split('. Scroll horizontally on small screens')[0];
 const toolbar=document.createElement('div');toolbar.className='horizontal-toolbar';toolbar.hidden=true;
 if(isTable){const hint=document.createElement('span');hint.className='caption';hint.textContent='Scroll table';toolbar.append(hint);}
 const controls=document.createElement('div');controls.className='overflow-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label',`Scroll ${label}`);
 const buttons=['left','right'].map(direction=>{
  const button=document.createElement('button');button.type='button';button.className=`icon-button overflow-arrow overflow-arrow--${direction}`;
  button.setAttribute('aria-label',`Scroll ${label} ${direction}`);button.setAttribute('aria-controls',scroller.id);
  button.innerHTML='<svg class="icon" viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 10h13M10 4l6 6-6 6"/></svg>';
  button.addEventListener('click',()=>{
   if(button.getAttribute('aria-disabled')==='true')return;
   scroller.scrollBy({left:(direction==='left'?-1:1)*scroller.clientWidth*.75,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });
  controls.append(button);return button;
 });
 toolbar.append(controls);
 if(isTable)shell.prepend(toolbar);else shell.append(toolbar);
 const update=()=>{
  // Use the full shell width, so the controls do not cause their own overflow.
  const overflowing=scroller.scrollWidth>shell.clientWidth+1;
  shell.classList.toggle('is-overflowing',overflowing);
  toolbar.hidden=!overflowing;
  buttons[0].setAttribute('aria-disabled',String(scroller.scrollLeft<=1));
  buttons[1].setAttribute('aria-disabled',String(scroller.scrollLeft>=scroller.scrollWidth-scroller.clientWidth-1));
 };
 scroller.addEventListener('scroll',update,{passive:true});
 const observer=new ResizeObserver(update);cleanups.push(()=>observer.disconnect());observer.observe(shell);observer.observe(scroller);
 for(const child of scroller.children)observer.observe(child);
 update();
 document.fonts.ready.then(()=>{
  if(!scroller.isConnected)return;
  update();
  const active=!isTable&&scroller.querySelector('[aria-current="page"],[aria-current="location"],[aria-selected="true"]');
  if(active){
   const item=active.getBoundingClientRect(),view=scroller.getBoundingClientRect();
   const shift=item.left<view.left?item.left-view.left-4:item.right>view.right?item.right-view.right+4:0;
   scroller.scrollBy({left:shift,behavior:'instant'});
  }
 });
}


}

// Content effects are disposed before an About section is replaced.
window.mountPortfolioContent=function(root) {
 const controller=new AbortController(),signal=controller.signal,cleanups=[];
 preserveComparisonFont(root);
const tabs = [...root.querySelectorAll('[role="tab"]')];
function select(tab, focus=false) {
 for (const item of tabs) {
  const active = item === tab;
  item.setAttribute('aria-selected',String(active)); item.tabIndex=active?0:-1;
  const panel=document.getElementById(item.getAttribute('aria-controls'));panel.hidden=!active;panel.inert=!active;
 }
 if(focus) tab.focus({preventScroll:true});
 const strip=tab.closest('[role="tablist"]'),item=tab.getBoundingClientRect(),view=strip.getBoundingClientRect();
 const shift=item.left<view.left?item.left-view.left:item.right>view.right?item.right-view.right:0;
 if(shift)strip.scrollBy({left:shift,behavior:'instant'});
}
for(const tab of tabs) {
 tab.addEventListener('click',()=>select(tab));
 tab.addEventListener('keydown',event=>{
  const i=tabs.indexOf(tab);
  const next={ArrowRight:(i+1)%tabs.length,ArrowLeft:(i-1+tabs.length)%tabs.length,Home:0,End:tabs.length-1}[event.key];
  if(next!==undefined) {event.preventDefault();select(tabs[next],true);}
 });
}


 enhanceScrollers(root,cleanups);
// A visual header mirrors each table while it crosses the viewport.
// The original semantic header remains in the table for assistive technology.
const stickyTables=[...root.querySelectorAll('.experience-table')].map(wrapper=>{
 const table=wrapper.querySelector('table');
 const overlay=document.createElement('div');overlay.className='table-pinned-header';overlay.setAttribute('aria-hidden','true');overlay.inert=true;overlay.hidden=true;
 const copy=document.createElement('table');copy.className=table.className;copy.append(table.tHead.cloneNode(true));overlay.append(copy);document.body.append(overlay);cleanups.push(()=>overlay.remove());
 const state={wrapper,table,overlay,copy};
 wrapper.addEventListener('scroll',scheduleTables,{passive:true});
 return state;
});
let tableFrame;
function scheduleTables(){if(!tableFrame)tableFrame=requestAnimationFrame(updateTables);}
function updateTables(){
 tableFrame=null;
 for(const {wrapper,table,overlay,copy} of stickyTables){
  const box=table.getBoundingClientRect(),clip=wrapper.getBoundingClientRect(),height=table.tHead.getBoundingClientRect().height;
  const toolbar=wrapper.parentElement.querySelector('.horizontal-toolbar');
  const mastheadBottom=Math.max(0,document.querySelector('.site-header')?.getBoundingClientRect().bottom||0);
  const offset=mastheadBottom+(toolbar&&!toolbar.hidden?toolbar.getBoundingClientRect().height:0);
  const shown=box.top<offset&&box.bottom>offset;
  overlay.hidden=!shown;
  if(!shown)continue;
  overlay.style.cssText=`left:${clip.left}px;width:${wrapper.clientWidth}px;top:${Math.min(offset,box.bottom-height)}px`;
  copy.style.width=`${box.width}px`;copy.style.transform=`translateX(${-wrapper.scrollLeft}px)`;
  [...table.tHead.rows[0].cells].forEach((cell,i)=>{const width=cell.getBoundingClientRect().width;copy.tHead.rows[0].cells[i].style.cssText=`width:${width}px;min-width:${width}px;max-width:${width}px`;});
 }
}
if(stickyTables.length){window.addEventListener('scroll',scheduleTables,{passive:true,signal});window.addEventListener('resize',scheduleTables,{signal});const observer=new ResizeObserver(scheduleTables);observer.observe(root);cleanups.push(()=>{observer.disconnect();cancelAnimationFrame(tableFrame);});document.fonts.ready.then(()=>{if(!signal.aborted)scheduleTables();});}

// Balanced masonry: all columns have the same outer height, while each image
// keeps a varied share of that height. Reflows with the available gallery width.
for(const gallery of root.querySelectorAll('.photo-grid')) {
 const cards=[...gallery.querySelectorAll('.photo-card')];
 if(!cards.length)continue;
 let lastWidth=0;
 const layout=()=>{
  const width=gallery.clientWidth;if(!width||Math.abs(width-lastWidth)<1)return;lastWidth=width;
  const count=Math.min(cards.length,width<520?2:3);
  const gap=parseFloat(getComputedStyle(gallery).columnGap)||0,colWidth=(width-gap*(count-1))/count;
  const columns=Array.from({length:count},()=>[]);
  // Contiguous groups preserve the top-to-bottom reading order of a photo column.
  let offset=0;for(let i=0;i<count;i++){const size=Math.ceil((cards.length-offset)/(count-i));columns[i]=cards.slice(offset,offset+size);offset+=size;}
  const ratios=cards.map(card=>Math.max(.5,Math.min(3,Number(card.dataset.ratio)||1)));
  const height=colWidth*ratios.reduce((a,b)=>a+b,0)/count+gap*(Math.ceil(cards.length/count)-1);
  gallery.style.setProperty('--gallery-height',`${Math.round(height)}px`);gallery.dataset.balanced='true';
  gallery.replaceChildren(...columns.map(items=>{const column=document.createElement('div');column.className='photo-column';for(const card of items){card.style.setProperty('--photo-flex',ratios[cards.indexOf(card)]);column.append(card);}return column;}));
 };
 const observer=new ResizeObserver(layout);observer.observe(gallery);cleanups.push(()=>observer.disconnect());layout();
}

// Follow the chapter without moving focus. The mobile rail scrolls only horizontally.
const caseChapters=[...root.querySelectorAll('.case-chapter')];
if(caseChapters.length) {
 const nav=root.querySelector('.case-contents');
 const scroller=nav.querySelector('.case-chapter-links');
 const study=root.querySelector('.case-study');
 const links=[...nav.querySelectorAll('a')];
 const narrow=matchMedia('(max-width: 950px)');
 let scheduled=false,currentId='';
 function revealLink(link){
  if(!narrow.matches)return;
  const item=link.getBoundingClientRect(),view=scroller.getBoundingClientRect();
  const shift=item.left<view.left?item.left-view.left:item.right>view.right?item.right-view.right:0;
  if(shift)scroller.scrollBy({left:shift,behavior:'instant'});
 }
 function updateChapter(){
  scheduled=false;
  const offset=narrow.matches?nav.getBoundingClientRect().height:0;
  const threshold=Math.max(offset+24,window.innerHeight*.25);
  const current=caseChapters.filter(chapter=>chapter.getBoundingClientRect().top<=threshold).at(-1)||caseChapters[0];
  for(const link of links){
   if(link.hash==='#'+current.id){
    link.setAttribute('aria-current','location');
    if(currentId!==current.id)revealLink(link);
   }else link.removeAttribute('aria-current');
  }
  currentId=current.id;
 }
 function scheduleChapter(){if(!scheduled){scheduled=true;requestAnimationFrame(updateChapter);}}
 function resizeNav(){
  study.style.setProperty('--case-nav-height',`${nav.getBoundingClientRect().height}px`);
  const active=nav.querySelector('[aria-current="location"]');
  if(active)revealLink(active);
  scheduleChapter();
 }
 addEventListener('scroll',scheduleChapter,{passive:true,signal});
 addEventListener('resize',resizeNav,{signal});
 const observer=new ResizeObserver(resizeNav);observer.observe(nav);cleanups.push(()=>observer.disconnect());
 updateChapter();
}

 return ()=>{controller.abort();for(const cleanup of cleanups)cleanup();};
};
const aboutContent=document.querySelector('.about-content');
if(aboutContent)enhanceScrollers({querySelectorAll:()=>[document.querySelector('.about-nav')]},[]);
window.disposePortfolioContent=window.mountPortfolioContent(aboutContent||document.querySelector('main'));
