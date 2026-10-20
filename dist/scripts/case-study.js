// A focused adaptation of the supplied MaaS prototype's expanded-row interaction.
for(const demo of document.querySelectorAll('[data-governance-demo]')){
 const cards=[...demo.querySelectorAll('[data-demo-card]')];
 const groups=[...demo.querySelectorAll('[data-demo-group]')];
 const status=demo.querySelector('[data-demo-status]');
 const rowToggle=demo.querySelector('[data-demo-row-toggle]');
 const rowContent=demo.querySelector('#demo-model-details');
 let selected=null;
 let manuallyOpen=new Set(cards.filter(c=>c.hasAttribute('data-initial-open')));
 const connected=card=>selected!==null&&card.dataset.groups.split(' ').includes(selected);
 const isOpen=card=>manuallyOpen.has(card)||connected(card);
 const render=()=>{
  for(const card of cards){
   const match=connected(card),open=isOpen(card);
   card.dataset.connected=String(match);
   card.querySelector('[data-demo-card-toggle]').setAttribute('aria-expanded',String(open));
   card.querySelector('.demo-resource-body').hidden=!open;
   card.querySelector('.demo-match').hidden=!match;
   const showAll=card.querySelector('[data-demo-more]')?.getAttribute('aria-expanded')==='true';
   for(const group of card.querySelectorAll('[data-extra-group]'))group.hidden=!showAll&&group.dataset.demoGroup!==selected;
  }
  for(const group of groups)group.setAttribute('aria-pressed',String(group.dataset.demoGroup===selected));
  for(const lane of demo.querySelectorAll('[data-demo-lane]')){
   const allOpen=[...lane.querySelectorAll('[data-demo-card]')].every(isOpen);
   const label=lane.querySelector('h3').textContent.toLowerCase();
   const button=lane.querySelector('[data-demo-lane-toggle]');
   button.textContent=allOpen?'Collapse all':'Expand all';
   button.setAttribute('aria-label',`${button.textContent} ${label}`);
  }
  if(!selected){status.textContent='Select any group label to find it across both columns.';return;}
  const subscriptions=cards.filter(c=>connected(c)&&c.dataset.kind==='subscription').length;
  const policies=cards.filter(c=>connected(c)&&c.dataset.kind==='policy').length;
  const resources=`${subscriptions} subscription${subscriptions===1?'':'s'} and ${policies} authorization ${policies===1?'policy':'policies'}`;
  status.textContent=`${selected} appears in ${resources} for this model. ${!subscriptions?'No matching subscription is shown; investigate the usage allowance.':!policies?'No matching policy is shown; investigate access permission.':'The matching cards are expanded and highlighted.'}`;
 };
 for(const group of groups)group.addEventListener('click',()=>{selected=selected===group.dataset.demoGroup?null:group.dataset.demoGroup;render();});
 for(const card of cards){
  card.querySelector('[data-demo-card-toggle]').addEventListener('click',()=>{
   if(isOpen(card)){manuallyOpen.delete(card);if(connected(card))selected=null;}else manuallyOpen.add(card);
   render();
  });
  const more=card.querySelector('[data-demo-more]');
  more?.addEventListener('click',()=>{
   const expand=more.getAttribute('aria-expanded')!=='true';
   more.setAttribute('aria-expanded',String(expand));
   more.textContent=expand?'Show less':`${card.querySelectorAll('[data-extra-group]').length} more`;
   render();
  });
 }
 for(const lane of demo.querySelectorAll('[data-demo-lane]'))lane.querySelector('[data-demo-lane-toggle]').addEventListener('click',()=>{
  const laneCards=[...lane.querySelectorAll('[data-demo-card]')];
  if(laneCards.every(isOpen)){selected=null;laneCards.forEach(c=>manuallyOpen.delete(c));}
  else laneCards.forEach(c=>manuallyOpen.add(c));
  render();
 });
 const setRow=open=>{rowContent.hidden=!open;rowToggle.setAttribute('aria-expanded',String(open));rowToggle.setAttribute('aria-label',`${open?'Collapse':'Expand'} model details`);};
 rowToggle.addEventListener('click',()=>setRow(rowContent.hidden));
 const reset=demo.querySelector('[data-demo-reset]');
 if(reset&&!reset.querySelector('.demo-reset-glyph')){const glyph=document.createElement('span');glyph.className='demo-reset-glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent='↻';reset.append(' ',glyph);}
 reset.addEventListener('click',()=>{
  selected=null;manuallyOpen=new Set(cards.filter(c=>c.hasAttribute('data-initial-open')));
  for(const more of demo.querySelectorAll('[data-demo-more]')){more.setAttribute('aria-expanded','false');more.textContent=`${more.closest('[data-demo-card]').querySelectorAll('[data-extra-group]').length} more`;}
  setRow(true);render();
 });
 render();
}

const decorateImageControls=()=>{
 for(const link of document.querySelectorAll('[data-case-image]')){
  link.setAttribute('aria-haspopup','dialog');
  const control=link.querySelector(':scope > span');
  if(control)control.classList.add('case-image-expand');
 }
};

const stackEvidencePair=firstLabel=>{
 const figure=[...document.querySelectorAll('.case-figure--evidence')].find(candidate=>candidate.querySelector('.case-evidence-label')?.textContent.trim()===firstLabel);
 if(!figure||figure.dataset.stacked==='true')return;
 const grid=figure.querySelector('.case-evidence-grid');
 if(!grid)return;
 grid.classList.remove('case-evidence-grid--paired');grid.classList.add('case-evidence-grid--problem');
 grid.querySelectorAll(':scope > .case-evidence-item').forEach(item=>item.classList.add('case-evidence-item--problem'));
 figure.dataset.stacked='true';
};

// Give every annotated image the same image-and-notes layout, including standalone examples.
for(const figure of document.querySelectorAll('.case-figure--evidence')){
 if(figure.querySelector('.case-image-notes'))stackEvidencePair(figure.querySelector('.case-evidence-label')?.textContent.trim());
}
decorateImageControls();

const imageDialog=document.querySelector('.case-image-dialog');
if(imageDialog){
 let opener;
 document.addEventListener('click',event=>{
  const link=event.target.closest('[data-case-image]');
  if(!link||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();opener=link;
  const item=link.closest('.case-evidence-item');
  const image=link.querySelector('img');
  const title=item.querySelector('.case-evidence-label,.sr-only')||link.closest('.case-figure')?.querySelector('.case-evidence-label');imageDialog.querySelector('#case-image-title').textContent=title?.textContent.trim()||image.alt;
  const full=imageDialog.querySelector('.case-image-viewport img');full.src=link.href;full.alt=image.alt;
  const legend=imageDialog.querySelector('.case-image-legend');legend.replaceChildren();
  const notes=item.querySelector('.case-image-notes,.case-evidence-description');
  if(notes)legend.append(notes.cloneNode(true));
  legend.hidden=!notes;
  imageDialog.classList.toggle('case-image-dialog--tall',Number(image.height)/Number(image.width)>1.35);
  imageDialog.showModal();
  imageDialog.querySelector('.case-close-button').focus({preventScroll:true});
  imageDialog.querySelector('.case-image-viewport').scrollTop=0;
  document.documentElement.classList.add('case-image-open');
 });
 imageDialog.querySelector('.case-close-button').addEventListener('click',()=>imageDialog.close());
 imageDialog.addEventListener('click',event=>{if(event.target===imageDialog)imageDialog.close();});
 imageDialog.addEventListener('close',()=>{document.documentElement.classList.remove('case-image-open');opener?.focus({preventScroll:true});});
}

const callability=document.querySelector('.concept-callability');
if(callability){
 const checks=[...callability.querySelectorAll('.concept-map-card')];
 const map=callability.closest('.case-concept').querySelector('.concept-map');map.id='model-access-relationships';
 const sections=[...callability.closest('.case-concept').querySelectorAll('.concept-map > .concept-map-section')];
 const scenarios=[
  {model:'Granite-3B',group:'data-science',policy:'Policy A',subscription:'Subscription 1',available:true},
  {model:'Granite-3B',group:'analytics',policy:'Policy A',subscription:null,available:true},
  {model:'Phi-3',group:'data-science',policy:'Policy A',subscription:'Subscription 1',available:false}
 ];
 const highlight=(root,needle,kind)=>{
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];
  while(walker.nextNode())if(walker.currentNode.nodeValue.includes(needle))nodes.push(walker.currentNode);
  for(const node of nodes){
   const parts=node.nodeValue.split(needle),frag=document.createDocumentFragment();
   parts.forEach((part,i)=>{if(part)frag.append(document.createTextNode(part));if(i<parts.length-1){const mark=document.createElement('mark');mark.className=`concept-highlight concept-highlight--${kind}`;mark.textContent=needle;frag.append(mark);}});
   node.replaceWith(frag);
  }
 };
 callability.querySelectorAll('li span').forEach(span=>{
  const isNo=/^(No|No matching)/.test(span.textContent.trim());
  if(isNo)span.classList.add('concept-missing');
  if(isNo){const icon=document.createElement('span');icon.className='concept-status-icon concept-status-icon--fail';icon.setAttribute('aria-hidden','true');icon.textContent='✕';span.prepend(icon);}
 });
 const clearMarks=()=>callability.closest('.case-concept').querySelectorAll('mark.concept-highlight').forEach(mark=>mark.replaceWith(document.createTextNode(mark.textContent)));
 const render=(index,active)=>{
  clearMarks();checks.forEach(c=>c.dataset.callability='');
  sections.forEach(section=>section.querySelectorAll('.concept-no-match').forEach(message=>message.remove()));
  if(!active)return;
  const s=scenarios[index],card=checks[index];card.dataset.callability='active';
  highlight(card.querySelector('h4'),s.group,'group');
  highlight(card.querySelector('h4'),s.model,'model');
  const matchingCard=(section,heading)=>[...section.querySelectorAll('.concept-map-card')].find(c=>c.querySelector('h4')?.textContent===heading);
  highlight(matchingCard(sections[0],s.available?'Available models':'Unavailable models'),s.model,'model');
  highlight(matchingCard(sections[1],s.group)?.querySelector('h4'),s.group,'group');
  const markResource=(section,heading)=>{
   if(!heading)return;
   const resource=matchingCard(section,heading);
   if(!resource)return;
   for(const p of resource.querySelectorAll('p')){
    highlight(p,s.group,'group');highlight(p,s.model,'model');
   }
  };
  markResource(sections[2],s.policy);
  markResource(sections[3],s.subscription);
 };
 checks.forEach((card,index)=>{const result=card.querySelector('.concept-result');result.classList.toggle('concept-result--fail',result.textContent.trim().startsWith('Not'));const link=document.createElement('button');link.type='button';link.className='concept-link';link.setAttribute('aria-controls','model-access-relationships');link.textContent='Click to see relations';link.setAttribute('aria-expanded',index===0?'true':'false');result.after(link);link.addEventListener('click',()=>{const active=link.getAttribute('aria-expanded')!=='true';checks.forEach(c=>c.querySelector('.concept-link').textContent='Click to see relations');checks.forEach(c=>c.querySelector('.concept-link').setAttribute('aria-expanded','false'));link.textContent=active?'Hide highlights':'Click to see relations';link.setAttribute('aria-expanded',String(active));render(index,active);});});
 render(0,true);checks[0].querySelector('.concept-link').textContent='Hide highlights';
}

// Selecting a thumbnail switches the single viewing area and starts that demo.
const shippedDemos=document.querySelector('.case-shipped-demos');
if(shippedDemos){
 const thumbnails=[...shippedDemos.querySelectorAll('[data-shipped-demo]')];
 const panels=[...shippedDemos.querySelectorAll('.case-demo-panel')];
 const status=shippedDemos.querySelector('[data-shipped-status]');
 const strip=shippedDemos.querySelector('.case-demo-thumbnails');
 for(const button of thumbnails){
  button.addEventListener('click',()=>{
   const target=document.getElementById(button.getAttribute('aria-controls'));
   for(const panel of panels){
    const active=panel===target;
    if(!active)panel.querySelector('video').pause();
    panel.hidden=!active;
   }
   for(const thumbnail of thumbnails){
    const active=thumbnail===button;
    thumbnail.setAttribute('aria-pressed',String(active));
    thumbnail.querySelector('.case-demo-selection').textContent=active?'Selected':'Play video';
   }
   status.textContent=`Selected: ${target.querySelector('h4').textContent}.`;
   // Keep the selected card visible without moving the reader down the page.
   const card=button.getBoundingClientRect(),view=strip.getBoundingClientRect();
   const shift=card.left<view.left?card.left-view.left-8:card.right>view.right?card.right-view.right+8:0;
   if(shift)strip.scrollBy({left:shift,behavior:'instant'});
   target.querySelector('video').play().catch(()=>{status.textContent+=' Use the video play control to start the walkthrough.';});
  });
 }
 const controls=shippedDemos.querySelector('.case-demo-scroll-controls');
 const arrows=[...controls.querySelectorAll('[data-demo-scroll]')];
 const updateArrows=()=>{
  controls.hidden=strip.scrollWidth<=strip.clientWidth+1;
  arrows[0].setAttribute('aria-disabled',String(strip.scrollLeft<=1));
  arrows[1].setAttribute('aria-disabled',String(strip.scrollLeft>=strip.scrollWidth-strip.clientWidth-1));
 };
 for(const arrow of arrows)arrow.addEventListener('click',()=>{
  if(arrow.getAttribute('aria-disabled')==='true')return;
  strip.scrollBy({left:(arrow.dataset.demoScroll==='left'?-1:1)*strip.clientWidth*.8,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
 strip.addEventListener('scroll',updateArrows,{passive:true});
 const resize=new ResizeObserver(updateArrows);resize.observe(strip);
 updateArrows();
}
