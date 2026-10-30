// Servidor online do TerraZ (APK / navegador fora do Claude).
// Só repassa a "presença" de cada jogador pros outros, igual a sala do Claude. Não guarda nada.
// Rodar: npm install && npm start   (porta: variável PORT ou 8080)
const http=require('http'), {WebSocketServer}=require('ws');
const srv=http.createServer((q,r)=>{ r.writeHead(200,{'content-type':'text/plain'}); r.end('TerraZ online: '+jog.size+' jogando'); });
const wss=new WebSocketServer({server:srv, maxPayload:16*1024});
const jog=new Map(); let n=0, sujo=false;
wss.on('connection',ws=>{
  const id='p'+(++n)+Math.random().toString(36).slice(2,6); jog.set(id,{ws,presence:null,t:Date.now()});
  ws.send(JSON.stringify({tipo:'oi',id})); sujo=true;
  ws.on('message',m=>{ let d; try{ d=JSON.parse(m); }catch(_){ return; } const J=jog.get(id); if(!J) return;
    if(d.tipo==='presenca'&&d.p&&typeof d.p==='object'){ J.presence=d.p; J.t=Date.now(); sujo=true; } });
  ws.on('close',()=>{ jog.delete(id); sujo=true; });
});
// 15 vezes por segundo manda a lista de todo mundo (só quando mudou)
setInterval(()=>{ if(!sujo) return; sujo=false;
  const peers=[...jog.entries()].filter(([,J])=>J.presence).map(([peer,J])=>({peer,presence:J.presence}));
  const msg=JSON.stringify({tipo:'peers',peers});
  for(const J of jog.values()) if(J.ws.readyState===1) J.ws.send(msg); },66);
// derruba quem sumiu sem fechar
setInterval(()=>{ const ag=Date.now(); for(const [id,J] of jog) if(ag-J.t>60000){ try{ J.ws.terminate(); }catch(_){ } jog.delete(id); sujo=true; } },10000);
srv.listen(process.env.PORT||8080,()=>console.log('TerraZ online na porta',process.env.PORT||8080));
