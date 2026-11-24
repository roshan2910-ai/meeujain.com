
(function(){
 const cfg=window.MEETU_SITE_CONFIG||{ownerEmail:"",socials:{}};
 const email=(cfg.ownerEmail||"").trim();
 document.querySelectorAll(".mj-email-link").forEach(a=>{
   if(email && !email.includes("REPLACE_WITH")) a.href="mailto:"+email;
   else a.href="mailto:?subject="+encodeURIComponent("Message for Meetu Jain");
 });
 document.querySelectorAll("[data-social]").forEach(a=>{
   const url=(cfg.socials||{})[a.dataset.social]||"";
   if(url){a.href=url;a.classList.add("is-configured");}
   else {a.addEventListener("click",e=>{e.preventDefault();alert("Add the official profile URL for this platform in site-config.js.");});}
 });
 const launch=document.getElementById("mj-chat-launch"), panel=document.getElementById("mj-chat-panel"), close=document.getElementById("mj-chat-close");
 if(launch&&panel){
  launch.addEventListener("click",()=>{const open=panel.hidden;panel.hidden=!open;launch.setAttribute("aria-expanded",String(open));});
  close&&close.addEventListener("click",()=>{panel.hidden=true;launch.setAttribute("aria-expanded","false");});
 }
 const form=document.getElementById("mj-story-form");
 if(form) form.addEventListener("submit",e=>{
  e.preventDefault();
  const d=new FormData(form);
  const name=String(d.get("name")||"").trim(), from=String(d.get("email")||"").trim(), story=String(d.get("story")||"").trim(), contact=String(d.get("contact")||"").trim();
  if(!name||!from||!story){alert("Please complete your name, email and story.");return;}
  if(!email||email.includes("REPLACE_WITH")){
    alert("The owner's email address has not been configured yet. Please add it to site-config.js before accepting story submissions.");
    return;
  }
  const subject="Story submission for Meetu Jain — "+name;
  const body="Name: "+name+"\\nEmail: "+from+"\\nFollow-up: "+contact+"\\n\\nStory / Lead:\\n"+story+"\\n\\nPlease note: sent through the Meetu Jain website story form.";
  window.location.href="mailto:"+email+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(body);
 });
 const year=document.getElementById("mj-current-year");if(year)year.textContent=new Date().getFullYear();
})();

/* 10-story modal reading room */
(function(){
 const overlay=document.getElementById('mj-stories-overlay');
 if(!overlay) return;
 const list=document.getElementById('mj-stories-list');
 const reader=document.getElementById('mj-story-reader');
 const close=document.getElementById('mj-stories-close');
 const stories=Array.isArray(window.MEETU_FEATURED_STORIES)?window.MEETU_FEATURED_STORIES:[];
 let lastFocus=null;
 function renderStory(story){
   reader.replaceChildren();
   const meta=document.createElement('div'); meta.className='mj-reader-meta';
   meta.textContent=[story.number,story.category,story.date].filter(Boolean).join('  •  ');
   const title=document.createElement('h3'); title.className='mj-reader-title'; title.textContent=story.title;
   const summary=document.createElement('p'); summary.className='mj-reader-summary'; summary.textContent=story.summary||'';
   const body=document.createElement('div'); body.className='mj-reader-body';
   String(story.article||'').split(/\n\s*\n/).forEach(paragraph=>{
     if(!paragraph.trim()) return;
     const p=document.createElement('p');p.textContent=paragraph.trim();body.appendChild(p);
   });
   reader.append(meta,title,summary,body);
   if(story.sourceUrl){
     const source=document.createElement('a');
     source.className='mj-media-action mj-story-source';
     source.href=story.sourceUrl;
     source.target='_blank';
     source.rel='noopener noreferrer';
     source.textContent='Read original report';
     reader.appendChild(source);
   }
   list.querySelectorAll('button').forEach(btn=>btn.classList.toggle('active',btn.dataset.story===story.number));
   reader.scrollTop=0;
 }
 stories.forEach((story,index)=>{
   const btn=document.createElement('button');btn.type='button';btn.className='mj-story-choice';btn.dataset.story=story.number;
   const num=document.createElement('span');num.className='mj-story-choice-number';num.textContent=story.number||String(index+1).padStart(2,'0');
   const text=document.createElement('span');text.className='mj-story-choice-text';
   const strong=document.createElement('strong');strong.textContent=story.title;
   const small=document.createElement('small');small.textContent=story.category||'Featured story';
   text.append(strong,small);btn.append(num,text);
   btn.addEventListener('click',()=>renderStory(story));list.appendChild(btn);
 });
 function open(storyNumber){
   lastFocus=document.activeElement;overlay.classList.add('is-open');overlay.setAttribute('aria-hidden','false');
   document.body.classList.add('mj-modal-open');
   const selected=stories.find(story=>String(story.number)===String(storyNumber));
   if(stories.length) renderStory(selected||stories[0]);
   close.focus();
 }
 function shut(){
   overlay.classList.remove('is-open');overlay.setAttribute('aria-hidden','true');
   document.body.classList.remove('mj-modal-open');
   if(lastFocus&&typeof lastFocus.focus==='function')lastFocus.focus();
 }
 document.querySelectorAll('.mj-featured-link').forEach(link=>{
   link.addEventListener('click',e=>{
     const url=new URL(link.href,location.href);
     if(url.pathname===location.pathname || url.pathname.endsWith('/index.html')){
       e.preventDefault();open();
     }
   });
 });
 close.addEventListener('click',shut);
 overlay.addEventListener('click',e=>{if(e.target===overlay)shut();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&overlay.classList.contains('is-open'))shut();});
 const storyParams=new URLSearchParams(location.search);
 if(storyParams.get('openStories')==='1'){
   open(storyParams.get('story'));
   const url=new URL(location.href);url.searchParams.delete('openStories');url.searchParams.delete('story');
   history.replaceState({},'',url.pathname+url.hash);
 }
})();


(function(){
 const grid = document.getElementById('mj-media-grid');
 const videoGrid = document.getElementById('mj-video-report-grid');
 if (!grid && !videoGrid) return;

 let active = 'images';
 let data = { images: [], pdfs: [], videos: [] };
 const mediaSearch=document.getElementById('mj-media-search');
 const mediaSort=document.getElementById('mj-media-sort');
 const videoSearch=document.getElementById('mj-video-search');
 const videoSort=document.getElementById('mj-video-sort');

 function makeMessage(target, text, kind) {
   if (!target) return;
   target.replaceChildren();
   const p = document.createElement('p');
   p.className = 'mj-media-empty';
   p.textContent = text;
   if (kind) p.dataset.state = kind;
   target.appendChild(p);
 }

 function itemUrl(item, type) {
   // All archive media must come from an explicit hosted URL in the media manifest.
   if (item && typeof item.url === 'string' && /^https:\/\//i.test(item.url)) return item.url;
   return '';
 }

 function addCaption(card, item, fallbackTitle, url, type) {
   const caption = document.createElement('div');
   caption.className = 'mj-media-caption';
   const title = document.createElement('strong');
   title.textContent = item.title || fallbackTitle;
   caption.appendChild(title);
   if (item.description) {
     const desc = document.createElement('p');
     desc.textContent = item.description;
     caption.appendChild(desc);
   }
   const actions = document.createElement('div');
   actions.className = 'mj-media-actions';
   const open = document.createElement('a');
   open.href = url; open.target = '_blank'; open.rel = 'noopener noreferrer';
   open.textContent = type === 'pdfs' ? 'Open PDF' : type === 'videos' ? 'Open video' : 'View full image';
   open.className = 'mj-media-action';
   actions.appendChild(open);
   caption.appendChild(actions);
   card.appendChild(caption);
 }

 function renderPhotoOrPdf() {
   if (!grid) return;
   grid.replaceChildren();
   const term=(mediaSearch&&mediaSearch.value||'').trim().toLowerCase();
   const items = (Array.isArray(data[active]) ? data[active] : []).filter(item=>[item.title,item.filename,item.description].join(' ').toLowerCase().includes(term)).sort((a,b)=>{const mode=mediaSort&&mediaSort.value||'newest';return mode==='az'?String(a.title||a.filename).localeCompare(String(b.title||b.filename)):mode==='oldest'?String(a.filename).localeCompare(String(b.filename)):String(b.filename).localeCompare(String(a.filename));});
   if (!items.length) {
     makeMessage(grid, active === 'images' ? 'No photographs are listed in the supplied image index.' : 'No PDFs are listed in the supplied PDF index.', 'empty');
     return;
   }
   let rendered = 0;
   items.forEach(item => {
     const url = itemUrl(item, active);
     if (!url) return;
     const card = document.createElement('article');
     card.className = 'mj-media-card';
     if (active === 'images') {
       const a = document.createElement('a');
       a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'mj-media-preview';
       const img = document.createElement('img');
       img.src = url;
       img.alt = item.title || 'Meetu Jain reporting archive photograph';
       img.loading = 'lazy'; img.decoding = 'async';
       img.onerror = () => {
         card.classList.add('mj-media-file-missing');
         const error = document.createElement('p');
         error.className = 'mj-media-file-error';
         error.textContent = 'This photograph could not be loaded from its source URL.';
         if (!card.querySelector('.mj-media-file-error')) card.appendChild(error);
       };
       a.appendChild(img); card.appendChild(a);
     } else {
       const a = document.createElement('a');
       a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'mj-pdf-link';
       const icon = document.createElement('span'); icon.className = 'mj-pdf-icon'; icon.textContent = 'PDF';
       const name = document.createElement('span'); name.className = 'mj-pdf-name'; name.textContent = item.title || item.filename || 'Archive document';
       const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden','true'); arrow.textContent = '↗';
       a.append(icon,name,arrow); card.appendChild(a);
     }
     addCaption(card,item,item.filename || 'Archive item',url,active);
     grid.appendChild(card);
     rendered++;
   });
   if (!rendered) makeMessage(grid, 'The supplied ' + active + ' index contains no usable URLs.', 'error');
 }

 function renderVideos() {
   if (!videoGrid) return;
   videoGrid.replaceChildren();
   const term=(videoSearch&&videoSearch.value||'').trim().toLowerCase();
   const items = (Array.isArray(data.videos) ? data.videos : []).filter(item=>[item.title,item.filename,item.description].join(' ').toLowerCase().includes(term)).sort((a,b)=>{const mode=videoSort&&videoSort.value||'newest';return mode==='az'?String(a.title||a.filename).localeCompare(String(b.title||b.filename)):mode==='oldest'?String(a.filename).localeCompare(String(b.filename)):String(b.filename).localeCompare(String(a.filename));});
   if (!items.length) {
     makeMessage(videoGrid, 'No video reports are listed in the supplied video index.', 'empty');
     return;
   }
   let rendered = 0;
   items.forEach((item,index) => {
     const url = itemUrl(item,'videos');
     if (!url) return;
     const card = document.createElement('article');
     card.className = 'mj-video-slot';
     const wrap = document.createElement('div');
     wrap.className = 'mj-video-player-wrap';
     const video = document.createElement('video');
     video.controls = true; video.preload = 'metadata'; video.playsInline = true;
     video.setAttribute('aria-label',item.title || ('Video report '+(index+1)));
     const source = document.createElement('source');
     source.src = url;
     source.type = /\.webm(\?|$)/i.test(url) ? 'video/webm' : /\.mov(\?|$)/i.test(url) ? 'video/quicktime' : 'video/mp4';
     video.appendChild(source);
     video.onerror = () => {
       const error = document.createElement('p');
       error.className = 'mj-video-error';
       error.textContent = 'This video could not be played. Use the Open video link below to check the source file.';
       if (!wrap.querySelector('.mj-video-error')) wrap.appendChild(error);
     };
     wrap.appendChild(video);
     card.appendChild(wrap);
     const copy = document.createElement('div');
     copy.className = 'mj-video-slot-copy';
     const tag = document.createElement('span'); tag.textContent = 'VIDEO REPORT ' + String(index+1).padStart(2,'0');
     const title = document.createElement('h3'); title.textContent = item.title || item.filename || ('Video report '+(index+1));
     const desc = document.createElement('p'); desc.textContent = item.description || 'Video report from the Meetu Jain reporting archive.';
     const open = document.createElement('a'); open.href=url; open.target='_blank'; open.rel='noopener noreferrer'; open.className='mj-media-action'; open.textContent='Open original video';
     copy.append(tag,title,desc,open);
     card.appendChild(copy);
     videoGrid.appendChild(card);
     rendered++;
   });
   if (!rendered) makeMessage(videoGrid, 'The supplied video index contains no usable video URLs.', 'error');
 }

 [mediaSearch,mediaSort].filter(Boolean).forEach(el=>el.addEventListener('input',renderPhotoOrPdf));
 [videoSearch,videoSort].filter(Boolean).forEach(el=>el.addEventListener('input',renderVideos));
 document.querySelectorAll('[data-media-tab]').forEach(btn => {
   btn.addEventListener('click', () => {
     const tab = btn.dataset.mediaTab;
     if (!['images','pdfs'].includes(tab)) return;
     active = tab;
     document.querySelectorAll('[data-media-tab]').forEach(b => b.classList.toggle('active',b===btn));
     renderPhotoOrPdf();
   });
 });

 makeMessage(grid,'Loading photographs and PDFs…','loading');
 if (videoGrid) makeMessage(videoGrid,'Loading video reports…','loading');

 const manifest = window.MJ_MEDIA_MANIFEST;
 if (!manifest || typeof manifest !== 'object') {
   makeMessage(grid,'Media index is missing. Please keep media-manifest.js in the website root.','error');
   makeMessage(videoGrid,'Video index is missing. Please keep media-manifest.js in the website root.','error');
 } else {
   data = {
     images: Array.isArray(manifest.images) ? manifest.images : [],
     pdfs: Array.isArray(manifest.pdfs) ? manifest.pdfs : [],
     videos: Array.isArray(manifest.videos) ? manifest.videos : []
   };
   renderPhotoOrPdf();
   renderVideos();
 }

})();
