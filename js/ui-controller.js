// Export UI Elements for easy access
export const DOM = {
    viewAuth: document.getElementById('view-auth'),
    viewDashboard: document.getElementById('view-dashboard'),
    viewActiveRoom: document.getElementById('view-active-room'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authBtn: document.getElementById('auth-btn'),
    toggleAuthText: document.getElementById('toggle-auth'),
    logoutBtn: document.getElementById('logout-btn'),
    micBtn: document.getElementById('mic-btn'),
    leaveRoomBtn: document.getElementById('leave-room-btn'),
    giftBtn: document.getElementById('gift-btn'),
    tabRooms: document.getElementById('tab-rooms'),
    voiceSeats: document.getElementById('voice-seats')
};

export function switchView(isLoggedIn) {
    if (isLoggedIn) {
        DOM.viewAuth.classList.add('hidden');
        DOM.viewDashboard.classList.remove('hidden');
        DOM.viewDashboard.classList.add('flex');
    } else {
        DOM.viewAuth.classList.remove('hidden');
        DOM.viewDashboard.classList.add('hidden');
        DOM.viewDashboard.classList.remove('flex');
    }
}

export function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            
            // Hide Tabs
            ['tab-rooms', 'tab-profile'].forEach(id => {
                document.getElementById(id).classList.add('hidden');
                document.getElementById(id).classList.remove('flex');
            });
            
            // Reset Nav styling
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('active', 'text-gold-400', 'scale-110');
                b.classList.add('text-gray-600');
                b.querySelector('i').classList.remove('drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]');
            });
            
            // Activate Selection
            document.getElementById(target).classList.remove('hidden');
            document.getElementById(target).classList.add('flex');
            e.currentTarget.classList.add('active', 'text-gold-400', 'scale-110');
            e.currentTarget.classList.remove('text-gray-600');
            e.currentTarget.querySelector('i').classList.add('drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]');

            // Header Update
            document.getElementById('header-title').textContent = target === 'tab-rooms' ? 'Discover' : 'VIP Profile';
        });
    });
}

export function renderRoomsList(onRoomClick) {
    const mockRooms = [
        { id: "room_1", name: "💎 Billionaire Boys Club", tags: ["Crypto", "Alpha"], users: 124 },
        { id: "room_2", name: "🍷 Late Night Ventures", tags: ["Startups", "Networking"], users: 89 },
        { id: "room_3", name: "🏎️ Supercar Syndicate", tags: ["Lifestyle", "Wealth"], users: 312 }
    ];

    DOM.tabRooms.innerHTML = mockRooms.map(room => `
        <div class="bg-dark-800 p-5 rounded-3xl border border-white/5 shadow-lg hover:border-gold-500/50 transition-all cursor-pointer group flex justify-between items-center" data-id="${room.id}" data-name="${room.name}">
            <div>
                <h3 class="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">${room.name}</h3>
                <div class="flex gap-2">
                    ${room.tags.map(t => `<span class="bg-dark-900 px-3 py-1 rounded-full text-[10px] text-gray-400 border border-white/5 font-bold uppercase tracking-wide">${t}</span>`).join('')}
                </div>
            </div>
            <div class="flex flex-col items-center">
                <div class="flex -space-x-3 shadow-lg">
                    <img class="w-10 h-10 rounded-full border-2 border-dark-800 object-cover" src="https://i.pravatar.cc/100?img=${Math.floor(Math.random()*70)}" alt="">
                    <img class="w-10 h-10 rounded-full border-2 border-dark-800 object-cover" src="https://i.pravatar.cc/100?img=${Math.floor(Math.random()*70)+1}" alt="">
                </div>
                <span class="text-[10px] text-gray-400 mt-2 font-bold"><i class="fa-solid fa-users text-gold-500 mr-1"></i>${room.users}</span>
            </div>
        </div>
    `).join('');

    // Attach Listeners to injected HTML
    DOM.tabRooms.querySelectorAll('div[data-id]').forEach(el => {
        el.addEventListener('click', () => onRoomClick(el.dataset.id, el.dataset.name));
    });
}

export function renderEmptySeats() {
    DOM.voiceSeats.innerHTML = '';
    for(let i=0; i<8; i++) {
        DOM.voiceSeats.innerHTML += `
            <div class="flex flex-col items-center gap-2 w-16" id="seat-${i}">
                <div class="w-16 h-16 rounded-full bg-dark-700/50 border border-dashed border-white/20 flex items-center justify-center transition-all duration-300">
                    <i class="fa-solid fa-plus text-gray-600 text-sm"></i>
                </div>
                <span class="text-[9px] font-bold tracking-widest uppercase text-gray-600 truncate w-full text-center">Empty</span>
            </div>
        `;
    }
}

export function updateMicUI(isMuted) {
    if (isMuted) {
        DOM.micBtn.innerHTML = '<i class="fa-solid fa-microphone-slash text-gray-400 text-xl"></i>';
        DOM.micBtn.classList.replace('bg-gold-500', 'bg-dark-800');
        DOM.micBtn.classList.replace('text-black', 'text-white');
    } else {
        DOM.micBtn.innerHTML = '<i class="fa-solid fa-microphone text-black text-xl"></i>';
        DOM.micBtn.classList.replace('bg-dark-800', 'bg-gold-500');
    }
}

export function triggerGiftAnimation() {
    const giftIcon = document.createElement('div');
    giftIcon.className = 'gift-animation';
    giftIcon.innerHTML = '💎';
    giftIcon.style.left = '45%';
    giftIcon.style.top = '60%';
    DOM.viewActiveRoom.appendChild(giftIcon);
    setTimeout(() => giftIcon.remove(), 2000);
}
