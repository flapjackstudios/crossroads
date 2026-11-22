const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const rooms = new Map();

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));
app.get("/", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
app.get("/config", (_req, res) => res.json({
  mapillaryToken: process.env.MAPILLARY_TOKEN || ""
}));

function code() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}
function publicPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.id, name: p.name, ready: p.ready, connected: true
  }));
}
function emitRoom(room) {
  io.to(room.code).emit("room-update", {
    code: room.code, players: publicPlayers(room),
    status: room.status, winner: room.winner || null
  });
}
function distanceMeters(a, b) {
  const R = 6371000, rad = x => x * Math.PI / 180;
  const dLat = rad(b.lat-a.lat), dLon = rad(b.lng-a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

io.on("connection", socket => {
  socket.on("create-room", ({name}, cb) => {
    let roomCode;
    do { roomCode = code(); } while (rooms.has(roomCode));
    const room = {code: roomCode, players: new Map(), status: "lobby", winner: null};
    rooms.set(roomCode, room);
    join(socket, room, name, cb);
  });

  socket.on("join-room", ({code: raw, name}, cb) => {
    const room = rooms.get(String(raw || "").toUpperCase());
    if (!room) return cb?.({error: "Room not found."});
    if (room.players.size >= 2) return cb?.({error: "That room is full."});
    if (room.status !== "lobby") return cb?.({error: "That round has already started."});
    join(socket, room, name, cb);
  });

  function join(sock, room, name, cb) {
    const player = {id: sock.id, name: String(name || "Player").slice(0, 18), ready: false, position: null};
    room.players.set(sock.id, player);
    sock.join(room.code);
    sock.data.roomCode = room.code;
    cb?.({ok: true, code: room.code, playerId: sock.id});
    emitRoom(room);
  }

  socket.on("start-round", async cb => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.players.size !== 2 || [...room.players.values()][0].id !== socket.id)
      return cb?.({error: "The room host can start once both players have joined."});
    // Two players receive opposite ends of the same city search area.
    // The browser asks the Mapillary API for nearby panoramas around these points.
    room.status = "playing";
    room.winner = null;
    room.players.forEach(p => { p.position = null; });
    const seed = Math.floor(Math.random() * 4);
    const cities = [
      {name:"Lisbon", bounds:[-9.17,38.70,-9.12,38.74]},
      {name:"Prague", bounds:[14.39,50.07,14.45,50.10]},
      {name:"Amsterdam", bounds:[4.87,52.36,4.91,52.39]},
      {name:"Copenhagen", bounds:[12.54,55.66,12.59,55.69]}
    ];
    const city = cities[seed];
    const [west,south,east,north] = city.bounds;
    const midLng = (west+east)/2, midLat=(south+north)/2;
    const starts = [
      {lat:south+(north-south)*0.22, lng:west+(east-west)*0.18},
      {lat:south+(north-south)*0.78, lng:west+(east-west)*0.82}
    ];
    const ids = [...room.players.keys()];
    room.players.get(ids[0]).start = starts[0];
    room.players.get(ids[1]).start = starts[1];
    [...room.players.values()].forEach((player, index) => {
      io.to(player.id).emit("round-start", {city:city.name, start:starts[index]});
    });
    emitRoom(room);
    cb?.({ok:true});
  });

  socket.on("position", ({lat,lng}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing" || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.position = {lat,lng};
    const others = [...room.players.values()].filter(p => p.id !== socket.id && p.position);
    for (const other of others) {
      if (distanceMeters(player.position, other.position) <= 18) {
        room.status = "finished";
        room.winner = "Both players found each other!";
        io.to(room.code).emit("game-over", {message: room.winner});
        emitRoom(room);
      }
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players.delete(socket.id);
    if (!room.players.size) rooms.delete(roomCode);
    else {
      room.status = "lobby";
      room.players.forEach(p => {p.position=null; p.ready=false;});
      io.to(roomCode).emit("opponent-left");
      emitRoom(room);
    }
  });
});

server.listen(PORT, "0.0.0.0", () => console.log(`CROSSROADS running on port ${PORT}`));
