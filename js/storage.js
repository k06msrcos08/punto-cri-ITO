// Capa de almacenamiento.
// Si FIREBASE_CONFIG está lleno, usa Firestore (compartido y en vivo).
// Si no, usa localStorage (solo este navegador).
const Storage=(()=>{
  const uid=()=>{let u=localStorage.getItem('tecreporta_uid');if(!u){u='u'+Math.random().toString(36).slice(2,10);localStorage.setItem('tecreporta_uid',u)}return u};
  const cloud=typeof firebase!=='undefined'&&typeof FIREBASE_CONFIG!=='undefined'&&FIREBASE_CONFIG.apiKey&&!FIREBASE_CONFIG.apiKey.startsWith('PEGA');

  if(cloud){
    firebase.initializeApp(FIREBASE_CONFIG);
    const col=firebase.firestore().collection('reportes');
    const fail=e=>{console.error(e);const b=document.getElementById('ban');if(b){b.textContent='Error con Firebase: revisa tu configuración y las reglas de Firestore.';b.style.display='block'}};
    return{
      mode:'nube',
      userId:uid,
      subscribe(f){col.onSnapshot(s=>f(s.docs.map(d=>({id:d.id,...d.data()}))),fail)},
      async add(r){try{await col.add(r)}catch(e){fail(e)}},
      async update(id,data){
        try{
          if(data.voters)data={...data,voters:firebase.firestore.FieldValue.arrayUnion(...data.voters)};
          await col.doc(id).update(data);
        }catch(e){fail(e)}
      },
      async remove(id){try{await col.doc(id).delete()}catch(e){fail(e)}}
    };
  }

  const KEY='tecreporta_ito_reportes';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return[]}};
  const write=l=>localStorage.setItem(KEY,JSON.stringify(l));
  const subs=[];
  const notify=()=>subs.forEach(f=>f(read()));
  window.addEventListener('storage',e=>{if(e.key===KEY)notify()});
  return{
    mode:'local',
    userId:uid,
    subscribe(f){subs.push(f);f(read())},
    async add(r){const l=read();r.id='r'+Date.now()+Math.random().toString(36).slice(2,6);l.push(r);write(l);notify()},
    async update(id,data){const l=read();const r=l.find(x=>x.id===id);if(r)Object.assign(r,data);write(l);notify()},
    async remove(id){write(read().filter(r=>r.id!==id));notify()}
  };
})();
