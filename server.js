
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static('public'));
app.get('/', (req, res) => res.redirect('/overlay.html'));

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const state = {
  upcoming: [],      // [{id, title, requester}]
  current: null,     // {id, title, requester}
  sung: [],          // last sung on top
  liveCap: 10,       // how many to show in "Live Now"
  counter: 3000      // e.g., 신청곡 : 3000 (can be edited in control UI)
};

function broadcast() {
  io.emit('state', state);
}

io.on('connection', (socket) => {
  socket.emit('state', state);

  socket.on('add-song', (payload) => {
    const { title, requester } = payload || {};
    if (!title) return;
    state.upcoming.push({ id: uid(), title: title.trim(), requester: (requester||'').trim() });
    broadcast();
  });

  socket.on('start-next', () => {
    if (state.current) state.sung.unshift(state.current);
    state.current = state.upcoming.shift() || null;
    broadcast();
  });

  socket.on('complete-current', () => {
    if (state.current) state.sung.unshift(state.current);
    state.current = null;
    broadcast();
  });

  socket.on('skip-current', () => {
    if (state.current) state.upcoming.push(state.current);
    state.current = null;
    broadcast();
  });

  socket.on('remove-upcoming', (id) => {
    state.upcoming = state.upcoming.filter(x => x.id !== id);
    broadcast();
  });

  socket.on('clear-all', () => {
    state.upcoming = [];
    state.current = null;
    state.sung = [];
    broadcast();
  });

  socket.on('undo-last', () => {
    const last = state.sung.shift();
    if (last) state.upcoming.unshift(last);
    broadcast();
  });

  socket.on('set-live-cap', (n) => {
    const num = Number(n);
    if (!Number.isNaN(num) && num > 0) state.liveCap = Math.min(num, 50);
    broadcast();
  });

  socket.on('set-counter', (n) => {
    const num = Number(n);
    if (!Number.isNaN(num)) state.counter = num;
    broadcast();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[song-request-overlay] running on http://localhost:${PORT}`);
});
