export const UI = {
    viewAuth: document.getElementById('view-auth'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewActiveRoom: document.getElementById('view-active-room'),
    googleLoginBtn: document.getElementById('google-login-btn'),
    phoneInput: document.getElementById('phone-number'),
    sendOtpBtn: document.getElementById('send-otp-btn'),
    otpInput: document.getElementById('otp-code'),
    verifyOtpBtn: document.getElementById('verify-otp-btn'),
    phoneUI: document.getElementById('phone-ui'),
    otpUI: document.getElementById('otp-ui'),
    logoutBtn: document.getElementById('logout-btn')
};

export function switchView(isLoggedIn) {
    UI.viewAuth.classList.toggle('hidden', isLoggedIn);
    UI.viewDashboard.classList.toggle('hidden', !isLoggedIn);
    UI.viewDashboard.classList.toggle('flex', isLoggedIn);
}

export function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            ['tab-rooms', 'tab-dms', 'tab-profile'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
                document.getElementById(id).classList.remove('flex');
            });
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active', 'text-gold-400');
                b.classList.add('text-gray-600');
            });
            const target = e.currentTarget.getAttribute('data-target');
            document.getElementById(target).classList.remove('hidden');
            document.getElementById(target).classList.add('flex');
            e.currentTarget.classList.add('active', 'text-gold-400');
            e.currentTarget.classList.remove('text-gray-600');
        });
    });
}

export function renderLiveRooms(rooms, onJoin) {
    const list = document.getElementById('live-rooms-list');
    list.innerHTML = rooms.map(r => `
        <div class="bg-dark-800 p-4 rounded-2xl border border-white/5 shadow-lg flex justify-between items-center cursor-pointer hover:border-gold-500/30" data-id="${r.id}" data-name="${r.name}">
            <div>
                <h3 class="font-bold text-white">${r.name}</h3>
                <span class="text-[10px] text-gray-500 font-mono tracking-widest uppercase">ID: ${r.id.substring(1,7)}</span>
            </div>
            <div class="bg-dark-900 px-3 py-1 rounded-full flex items-center gap-1 border border-white/5">
                <i class="fa-solid fa-fire text-red-500 text-[10px]"></i>
                <span class="text-xs font-bold">${r.usersCount || 1}</span>
            </div>
        </div>
    `).join('') || `<p class="text-center text-gray-500 text-sm mt-4">No active rooms. Create one!</p>`;

    list.querySelectorAll('div[data-id]').forEach(el => {
        el.addEventListener('click', () => onJoin(el.dataset.id, el.dataset.name));
    });
}

export function renderEmptySeats() {
    const c = document.getElementById('voice-seats');
    c.innerHTML = '';
    for(let i=0; i<8; i++) {
        c.innerHTML += `
            <div class="flex flex-col items-center gap-1 w-14" id="seat-${i}">
                <div class="w-14 h-14 rounded-full bg-dark-800 border border-dashed border-white/10 flex items-center justify-center transition-all">
                    <i class="fa-solid fa-plus text-gray-700 text-xs"></i>
                </div>
                <span class="text-[8px] font-bold uppercase text-gray-600">Empty</span>
            </div>
        `;
    }
}

export function appendRoomChatMessage(msg, isMe) {
    const chatBox = document.getElementById('room-text-chat');
    const color = msg.isSystem ? 'text-pink-400 font-bold' : (isMe ? 'text-gray-300' : 'text-gray-400');
    chatBox.innerHTML += `
        <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
            <span class="text-[9px] text-gray-500 font-bold mb-0.5 ml-1">${msg.senderName}</span>
            <div class="px-3 py-2 rounded-xl text-sm ${msg.isSystem ? 'bg-pink-500/10 border border-pink-500/30 text-pink-300' : (isMe ? 'chat-bubble-me' : 'chat-bubble-them')} max-w-[85%]">
                ${msg.text}
            </div>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;
}

export function attachImageUploader(fileInput, onBase64Ready) {
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onloadend = () => onBase64Ready(reader.result);
        reader.readAsDataURL(file);
    });
}
