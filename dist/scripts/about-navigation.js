// Real URLs and complete HTML remain the fallback. Only About's content changes
// in place; its masthead, navigation, focus and scroll position stay stable.
(() => {
 const content=document.querySelector('.about-content');
 const nav=document.querySelector('.about-nav');
 if(!content||!nav||!window.fetch||!window.AbortController)return;
 const routes=new Set([...nav.querySelectorAll('a')].map(link=>new URL(link.href).pathname));
 const cache=new Map();
 let latestRequest=0,currentURL=location.href;
 const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');nav.after(status);
 const warmVisibleImages=async(page,url)=>{
  const gallery=[...page.querySelectorAll('.photo-grid img')];
  let images;
  if(gallery.length){
   // The balanced gallery groups items into columns; warm the first two in each.
   const columns=Math.min(gallery.length,innerWidth<520?2:3);
   images=[];let offset=0;
   for(let i=0;i<columns;i++){
    const size=Math.ceil((gallery.length-offset)/(columns-i));
    images.push(...gallery.slice(offset,offset+Math.min(2,size)));offset+=size;
   }
  }else images=[...page.querySelectorAll('.about-content img')].slice(0,3);
  await Promise.allSettled(images.map(node=>{
   const image=new Image();image.src=new URL(node.getAttribute('src'),url).href;
   return typeof image.decode==='function'?image.decode():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;});
  }));
 };
 const readPage=url=>{
  if(!cache.has(url))cache.set(url,fetch(url,{credentials:'same-origin'}).then(async response=>{
   if(!response.ok)throw new Error('Page unavailable');
   const page=new DOMParser().parseFromString(await response.text(),'text/html');
   if(!page.querySelector('.about-content'))throw new Error('Missing section');
   await warmVisibleImages(page,url);
   return page;
  }).catch(error=>{cache.delete(url);throw error;}));
  return cache.get(url);
 };
 // Keep scroll state on each history entry without changing normal page history.
 history.scrollRestoration='manual';
 const saveScroll=()=>history.replaceState({...history.state,aboutScroll:[scrollX,scrollY]},'',location.href);
 saveScroll();
 async function navigate(url,{pop=false,restore=null}={}) {
  const request=++latestRequest;
  content.setAttribute('aria-busy','true');
  try {
   const page=await readPage(url);
   if(request!==latestRequest)return;
   const previousHeight=content.offsetHeight;
   const previousScroll=[scrollX,scrollY];
   const hadContentFocus=content.contains(document.activeElement);
   // Keep the navigation stable while swapping sections of different lengths.
   content.style.minHeight=`${previousHeight}px`;
   window.disposePortfolioContent?.();
   // Cache pristine page content; moving its nodes would empty a repeat visit.
   content.replaceChildren(...[...page.querySelector('.about-content').childNodes].map(node=>node.cloneNode(true)));
   document.title=page.title;
   document.querySelector('meta[name="description"]').content=page.querySelector('meta[name="description"]').content;
   content.closest('.page-content').className=page.querySelector('.page-content').className;
   for(const link of nav.querySelectorAll('a')){
    const active=new URL(link.href).pathname===new URL(url).pathname;
    if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
   }
   if(!pop){saveScroll();history.pushState({aboutScroll:previousScroll},'',url);}
   currentURL=url;
   window.disposePortfolioContent=window.mountPortfolioContent(content);
   if(hadContentFocus||pop)nav.querySelector('[aria-current="page"]')?.focus({preventScroll:true});
   if(restore)window.scrollTo({left:restore[0],top:restore[1],behavior:'instant'});
   content.style.minHeight='';content.removeAttribute('aria-busy');
   status.textContent=`${nav.querySelector('[aria-current="page"]').textContent} section loaded`;
  } catch {
   if(request===latestRequest)location.assign(url);
  }
 }
 nav.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');
  if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
  event.preventDefault();
  if(link.href===currentURL){++latestRequest;content.style.minHeight='';content.removeAttribute('aria-busy');return;}
  navigate(link.href);
 });
 // Warm only the intended destination, not every page or gallery asset.
 for(const eventName of ['pointerover','focusin'])nav.addEventListener(eventName,event=>{
  const link=event.target.closest('a[href]');if(link&&link.href!==currentURL)readPage(link.href).catch(()=>{});
 });
 window.addEventListener('popstate',event=>{
  if(!routes.has(location.pathname)){location.reload();return;}
  if(location.href!==currentURL)navigate(location.href,{pop:true,restore:event.state?.aboutScroll});
 });
})();
