export function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = (e) => {
            ['tab-rooms', 'tab-dms', 'tab-profile'].forEach(id => document.getElementById(id).classList.add('hidden', 'flex'));
            ['tab-rooms', 'tab-dms', 'tab-profile'].forEach(id => document.getElementById(id).classList.remove('flex'));
            document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('active', 'text-gold-400'); b.classList.add('text-gray-600'); });
            
            const target = e.currentTarget.getAttribute('data-target');
            document.getElementById(target).classList.remove('hidden');
            document.getElementById(target).classList.add('flex');
            e.currentTarget.classList.add('active', 'text-gold-400');
        };
    });
}

export function renderRooms(rooms, onJoin) {
    const list = document.getElementById('live-rooms-list');
    list.innerHTML = rooms.map(r => `
        <div class="bg-dark-800 p-4 rounded-2xl border border-white/5 shadow-lg flex justify-between items-center cursor-pointer hover:border-gold-500/30" data-id="${r.id}" data-name="${r.name}">
            <div><h3 class="font-bold text-white">${r.name}</h3></div>
            <div class="bg-dark-900 px-3 py-1 rounded-full"><span class="text-xs text-gold-400 font-bold">JOIN</span></div>
        </div>
    `).join('') || `<p class="text-gray-500 text-sm mt-4 text-center">No rooms live.</p>`;
    list.querySelectorAll('div[data-id]').forEach(el => el.onclick = () => onJoin(el.dataset.id, el.dataset.name));
}

export function drawSeats() {
    const c = document.getElementById('voice-seats'); c.innerHTML = '';
    for(let i=0; i<8; i++) c.innerHTML += `<div class="flex flex-col items-center gap-1 w-14" id="seat-${i}"><div class="w-14 h-14 rounded-full bg-dark-800 border border-dashed border-white/10 flex items-center justify-center"><i class="fa-solid fa-plus text-gray-700 text-xs"></i></div><span class="text-[8px] font-bold text-gray-600">Empty</span></div>`;
}

export function addChatMsg(msg) {
    const box = document.getElementById('room-text-chat');
    box.innerHTML += `<div class="mb-2"><span class="text-[9px] text-gray-500 font-bold ml-1">${msg.senderName}</span><div class="px-3 py-2 rounded-xl text-sm ${msg.isSystem ? 'bg-pink-500/10 text-pink-300 border border-pink-500/30' : 'bg-dark-800 text-white border border-white/5'} inline-block">${msg.text}</div></div>`;
    box.scrollTop = box.scrollHeight;
}
