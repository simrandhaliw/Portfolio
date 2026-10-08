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

const combineEvidencePair=(firstLabel,src,combinedLabel,alt,notes)=>{
 const figure=[...document.querySelectorAll('.case-figure--evidence')].find(candidate=>candidate.querySelector('.case-evidence-label')?.textContent.trim()===firstLabel);
 if(!figure||figure.dataset.combined==='true')return;
 const grid=figure.querySelector('.case-evidence-grid');
 const items=[...grid.querySelectorAll(':scope > .case-evidence-item')];
 if(!grid||items.length<2)return;
 const item=document.createElement('div');item.className='case-evidence-item case-evidence-item--problem';
 const label=document.createElement('p');label.className='case-evidence-label';label.textContent=combinedLabel;
 const link=document.createElement('a');link.className='case-image-link';link.href=src;link.dataset.caseImage='';link.setAttribute('aria-label',`Enlarge: ${combinedLabel}`);
 const image=document.createElement('img');image.src=src;image.alt=alt;image.width=2400;image.height=2670;image.loading='lazy';image.decoding='async';
 const control=document.createElement('span');control.className='case-image-expand';control.append('Enlarge ');const glyph=document.createElement('span');glyph.className='case-expand-glyph';glyph.setAttribute('aria-hidden','true');glyph.textContent='⛶';control.append(glyph);
 link.append(image,control);item.append(label,link);
 const list=document.createElement('ol');list.className='case-image-notes';
 notes.forEach((text,index)=>{const li=document.createElement('li');const number=document.createElement('span');number.className='case-note-number';number.textContent=String(index+1);const copy=document.createElement('span');copy.textContent=text;li.append(number,copy);list.append(li);});
 item.append(list);grid.classList.remove('case-evidence-grid--paired');grid.classList.add('case-evidence-grid--problem');grid.replaceChildren(item);figure.dataset.combined='true';
};

combineEvidencePair('Before · Names hidden in the subscription table','assets/case-study/Image-028.webp','Before and after · Subscription table','Before and after Subscription tables shown vertically.',[
 'The small popover constrained the space available for a group or model list.',
 'Compound expansion gives the list a full-width area while keeping the surrounding rows visible.'
]);
combineEvidencePair('Before · Names hidden in the policy table','assets/case-study/Image-029.webp','Before and after · Authorization Policy table','Before and after Authorization Policy tables shown vertically.',[
 'Policy groups also required a separate popover.',
 'The policy table uses the same expansion pattern, so administrators do not have to learn a second interaction.'
]);

stackEvidencePair('Before · Reconstruct access across pages');
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
  imageDialog.querySelector('#case-image-title').textContent=item.querySelector('.case-evidence-label').textContent;
  const full=imageDialog.querySelector('.case-image-viewport img');full.src=link.href;full.alt=image.alt;
  const legend=imageDialog.querySelector('.case-image-legend');legend.replaceChildren();
  const notes=item.querySelector('.case-image-notes,.case-evidence-description');
  if(notes)legend.append(notes.cloneNode(true));
  legend.hidden=!notes;
  imageDialog.showModal();
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
  const icon=document.createElement('span');icon.className='concept-status-icon';icon.setAttribute('aria-hidden','true');icon.textContent=isNo?'✕':'✓';span.prepend(icon);
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
  if(!s.available){const msg=document.createElement('p');msg.className='concept-no-match';msg.textContent='Model unavailable';sections[0].append(msg);}
  highlight(matchingCard(sections[1],s.group)?.querySelector('h4'),s.group,'group');
  const markResource=(section,heading)=>{
   if(!heading){const msg=document.createElement('p');msg.className='concept-no-match';msg.textContent=section===sections[2]?'No matching policy':'No matching subscription';section.append(msg);return;}
   const resource=matchingCard(section,heading);
   if(!resource)return;
   for(const p of resource.querySelectorAll('p')){
    highlight(p,s.group,'group');highlight(p,s.model,'model');
   }
  };
  markResource(sections[2],s.policy);
  markResource(sections[3],s.subscription);
 };
 checks.forEach((card,index)=>{const result=card.querySelector('.concept-result');result.classList.toggle('concept-result--fail',result.textContent.trim().startsWith('Not'));const link=document.createElement('button');link.type='button';link.className='concept-link';link.textContent='Click to see relations';link.setAttribute('aria-expanded',index===0?'true':'false');result.after(link);link.addEventListener('click',()=>{const active=link.getAttribute('aria-expanded')!=='true';checks.forEach(c=>c.querySelector('.concept-link').textContent='Click to see relations');checks.forEach(c=>c.querySelector('.concept-link').setAttribute('aria-expanded','false'));link.textContent=active?'Hide highlights':'Click to see relations';link.setAttribute('aria-expanded',String(active));render(index,active);});});
 render(0,true);checks[0].querySelector('.concept-link').textContent='Hide highlights';
}
