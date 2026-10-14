import {loadJSON, tripStatus, statusLabels, element, publicLink} from './travel.js';
const labels={planned:'已規劃',tentative:'待確認',confirmed:'已確認',cancelled:'已取消'};
const root=document.querySelector('#days');
const mapLinkTypes=[
  {key:'naver',label:'NAVER Map',short:'N',base:'https://map.naver.com/p/search/'},
  {key:'google',label:'Google Maps',short:'G',base:'https://www.google.com/maps/search/?api=1&query='}
];
function mapButtons(query,links=[]){
  const maps=element('div',undefined,'map-shortcuts');
  const nativeLink=links.find(link=>new URL(link.url).hostname==='map.naver.com');
  const googleLink=links.find(link=>new URL(link.url).hostname==='www.google.com'&&new URL(link.url).pathname.startsWith('/maps/'));
  for(const map of mapLinkTypes){
    const url=map.key==='naver'?nativeLink?.url||map.base+encodeURIComponent(query):googleLink?.url||map.base+encodeURIComponent(query);
    const anchor=publicLink(map.label,url);
    anchor.className='map-shortcut map-shortcut-'+map.key;
    anchor.textContent=map.short;
    anchor.title=map.label+'｜開啟地圖';
    anchor.setAttribute('aria-label',map.label+'｜開啟地圖');
    maps.append(anchor);
  }
  return maps;
}
function otherLinks(links=[]){
  return links.filter(link=>{
    const u=new URL(link.url);
    return u.hostname!=='map.naver.com'&&!(u.hostname==='www.google.com'&&u.pathname.startsWith('/maps/'));
  });
}

loadJSON(`trip.json?v=${Date.now()}`).then(trip=>{
  document.title=`${trip.title}｜travel`;
  document.querySelector('#title').textContent=trip.title;
  document.querySelector('#summary').textContent=trip.summary;
  document.querySelector('#dates').textContent=`${trip.start} — ${trip.end}`;
  function update(){
    document.querySelector('#status').textContent=statusLabels[tripStatus(trip)];
    document.querySelector('#clock').textContent=`台灣 ${new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())} · ${trip.timezoneLabel} ${new Intl.DateTimeFormat('zh-TW',{timeZone:trip.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())}`;
  }
  update();setInterval(update,30000);
  const tabs=document.querySelector('#tabs');
  function select(date, fromUser=false){
    for(const card of root.children)card.hidden=date!=='all'&&card.dataset.date!==date;
    for(const button of tabs.children){button.setAttribute('aria-pressed',String(button.dataset.date===date));if(button.dataset.date===date&&fromUser)button.scrollIntoView({block:'nearest',inline:'nearest'});}
    if(fromUser){const top=tabs.getBoundingClientRect().top+window.scrollY-parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height'));window.scrollTo({top:Math.max(0,top),behavior:'instant'});}
  }
  for(const [date,label] of [['all','總覽'],...trip.days.map(day=>[day.date,day.date.slice(5).replace('-','/')])]){
    const button=element('button',label,'tab');button.type='button';button.dataset.date=date;button.addEventListener('click',()=>select(date,true));tabs.append(button);
  }
  for(const [dayIndex,day] of trip.days.entries()){
    const card=element('section',undefined,'day-card');card.dataset.date=day.date;
    const dayHeading=element('h2',undefined,'day-heading');
    dayHeading.append(element('span',`DAY ${String(dayIndex+1).padStart(2,'0')}`,'day-number'),element('span',day.title),element('span',day.date.slice(5).replace('-','/'),'day-date'));
    card.append(dayHeading);
    for(const [eventIndex,event] of day.events.entries()){
      const item=element('article',undefined,'event-card');item.id=event.id;
      item.dataset.status=event.status;
      const heading=element('div',undefined,'event-heading');
      heading.append(element('span',labels[event.status],'event-status'));
      const order=element('span',String(eventIndex+1).padStart(2,'0'),'event-number');
      order.setAttribute('aria-hidden','true');
      item.append(order,heading,element('h3',event.title));
      if(event.start){const time=element('time',new Intl.DateTimeFormat('zh-TW',{timeZone:event.timezone||trip.timezone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(event.start)));time.dateTime=event.start;heading.prepend(time)}else{heading.prepend(element('span','彈性安排','event-time-flexible'))}
      if(event.notes)item.append(element('p',event.notes));
      if(event.location)item.append(element('p',`地點：${event.location}`));
      if(event.mapQuery||event.location||event.links?.length){const actions=element('div',undefined,'links');const query=event.mapQuery||event.location;if(query)actions.append(mapButtons(query,event.links));for(const link of otherLinks(event.links))actions.append(publicLink(link.label,link.url));if(actions.childElementCount)item.append(actions);}
      card.append(item);
    }
    root.append(card);
  }
  const notes=document.querySelector('#notes');for(const note of trip.notes||[])notes.append(element('li',note));
  select('all');
}).catch(()=>{root.replaceChildren(element('p','行程資料暫時無法載入，請重新整理後再試。','empty'))});
