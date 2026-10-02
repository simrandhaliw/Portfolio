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
 demo.querySelector('[data-demo-reset]').addEventListener('click',()=>{
  selected=null;manuallyOpen=new Set(cards.filter(c=>c.hasAttribute('data-initial-open')));
  for(const more of demo.querySelectorAll('[data-demo-more]')){more.setAttribute('aria-expanded','false');more.textContent=`${more.closest('[data-demo-card]').querySelectorAll('[data-extra-group]').length} more`;}
  setRow(true);render();
 });
 render();
}

// Native dialog keeps focus inside the image viewer and supports Escape.
const dialog=document.querySelector('.case-image-dialog');
if(dialog){
 const image=document.createElement('img'),title=dialog.querySelector('#case-image-title');
 const viewport=dialog.querySelector('.case-image-viewport');
 const legend=dialog.querySelector('.case-image-legend');
 let opener=null,previousOverflow='';
 for(const link of document.querySelectorAll('[data-case-image]'))link.addEventListener('click',event=>{
  if(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();opener=link;
  const source=link.querySelector('img');viewport.replaceChildren(image);image.src=source.src;image.alt=source.alt;title.textContent=link.closest('.case-evidence-item').querySelector('.case-evidence-label')?.textContent||'Image detail';
  const notes=link.closest('.case-evidence-item').querySelector('.case-evidence-notes');
  legend.replaceChildren();legend.hidden=!notes;
  if(notes)for(const child of notes.children)legend.append(child.cloneNode(true));
  previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
 });
 dialog.querySelector('[data-image-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;opener?.focus({preventScroll:true});});
}
