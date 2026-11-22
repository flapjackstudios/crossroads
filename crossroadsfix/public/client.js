const socket = io();
const $ = id => document.getElementById(id);
let myId = null, roomCode = null, viewer = null, token = "", currentStart = null, lastSent = 0;

fetch("/config").then(r=>r.json()).then(c=>{token=c.mapillaryToken||"";});
function show(id){$(id).classList.remove("hidden")}
function hide(id){$(id).classList.add("hidden")}
function name(){return $("playerName").value.trim()||"Player"}
function showError(msg){$("lobbyError").textContent=msg||""}

function enterRoom(data){
  if(data.error){showError(data.error);return}
  roomCode=data.code;myId=data.playerId;showError("");
  $("roomCode").textContent=roomCode;show("roomInfo");
  $("playerStatus").textContent="Room created. Share this code with one friend.";
}
$("createBtn").onclick=()=>socket.emit("create-room",{name:name()},enterRoom);
$("joinBtn").onclick=()=>socket.emit("join-room",{code:$("roomInput").value.trim(),name:name()},enterRoom);
$("startBtn").onclick=()=>socket.emit("start-round",res=>{if(res?.error)showError(res.error)});

socket.on("room-update",room=>{
  $("playerStatus").textContent=room.players.length===1?"Waiting for another player…":room.players.map(p=>p.name).join("  VS  ");
  if(room.players.length===2 && room.status==="lobby" && room.players[0].id===myId)show("startBtn");
  else hide("startBtn");
});
socket.on("round-start",async data=>{
  currentStart=data.start;
  hide("lobby");show("game");$("cityName").textContent=data.city.toUpperCase();$("gameCode").textContent=roomCode;
  $("gameStatus").textContent="FIND YOUR OPPONENT";
  if(!token){$("gameStatus").textContent="ADD MAPILLARY TOKEN TO SERVER";return}
  await loadPanorama(currentStart);
});
socket.on("game-over",data=>{
  hide("game");show("finished");$("winMessage").textContent=data.message;
});
socket.on("opponent-left",()=>{if(!$("game").classList.contains("hidden"))$("gameStatus").textContent="OPPONENT DISCONNECTED";});

async function loadPanorama(start){
  try{
    // Search a small area around the assigned spawn for the closest available street image.
    const delta=.006;
    const bbox=[start.lng-delta,start.lat-delta,start.lng+delta,start.lat+delta].join(",");
    const url=`https://graph.mapillary.com/images?access_token=${encodeURIComponent(token)}&fields=id,geometry,captured_at&bbox=${bbox}&limit=100`;
    const response=await fetch(url);const body=await response.json();
    if(!response.ok||!body.data?.length)throw new Error("No street imagery found near this spawn. Try another round.");
    const target=body.data.sort((a,b)=>distance(start,a.geometry.coordinates)-distance(start,b.geometry.coordinates))[0];
    viewer=new mapillary.Viewer({accessToken:token,container:"viewer",imageId:target.id});
    viewer.on("image",()=>sendPosition());
    viewer.on("position",()=>sendPosition());
    viewer.on("pov",()=>sendPosition());
    viewer.on("load",()=>sendPosition());
    $("gameStatus").textContent="EXPLORE — FIND THE OTHER PLAYER";
  }catch(err){$("gameStatus").textContent=err.message.toUpperCase().slice(0,55);console.error(err)}
}
function distance(p,coords){const dx=(coords[0]-p.lng)*Math.cos(p.lat*Math.PI/180),dy=coords[1]-p.lat;return dx*dx+dy*dy}
async function sendPosition(){
  if(!viewer)return;
  const now=Date.now();if(now-lastSent<900)return;lastSent=now;
  try{
    const p = await viewer.getPosition();
    const coords = p?.lngLat || p;
    if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
      socket.emit("position", { lat: coords.lat, lng: coords.lng });
    }
  }catch(e){console.debug("Waiting for panorama position",e)}
}
