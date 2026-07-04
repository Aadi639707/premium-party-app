alert("Bhai, naya JavaScript link ho gaya hai!");
import { auth, database, ref, set, onValue, push, serverTimestamp } from "./firebase-config.js";
import { initAuth } from "./auth.js";
import { listenToEconomy, sendVirtualGift } from "./economy.js";
import { createLiveRoom, listenToActiveRooms, joinAudioRoom, toggleMicrophone, leaveAudioRoom } from "./voice.js";
import { UI, switchView, setupTabs, renderLiveRooms, renderEmptySeats, appendRoomChatMessage, attachImageUploader } from "./ui.js";

let currentUserProfile = null;
let activeRoomId = null;
let currentDMPartnerId = null;

setupTabs();

initAuth(UI, 
    (user) => { switchView(true); initDashboard(user.uid); },
    () => { switchView(false); closeRoom(); }
);

function initDashboard(uid) {
    // Sync Profile Data
    listenToEconomy(uid, (data) => {
        currentUserProfile = data;
        document.getElementById('wallet-balance').textContent = parseInt(data.coins).toLocaleString();
        document.getElementById('profile-name').textContent = data.name;
        document.getElementById('profile-bio').textContent = data.bio;
        document.getElementById('vip-level').textContent = data.vip;
        if (data.dp) document.getElementById('profile-avatar').src = data.dp;
    });

    // Load Live Rooms
    listenToActiveRooms((rooms) => { renderLiveRooms(rooms, openRoom); });

    // Load DMs User List
    onValue(ref(database, `/olaparty/users`), (snap) => {
        const list = document.getElementById('dm-users-list');
        list.innerHTML = '';
        snap.forEach(child => {
            if(child.key !== uid) {
                const u = child.val();
                list.innerHTML += `
                    <div class="flex items-center gap-3 p-3 bg-dark-800 rounded-xl cursor-pointer border border-transparent hover:border-white/10" onclick="window.openDM('${child.key}', '${u.name}', '${u.dp}')">
                        <img src="${u.dp}" class="w-10 h-10 rounded-full object-cover">
                        <div class="flex-1"><h4 class="font-bold text-sm text-white">${u.name}</h4></div>
                    </div>`;
            }
        });
    });
}

// ================== PROFILE SYSTEM ==================
document.getElementById('btn-edit-profile').onclick = () => {
    document.getElementById('edit-name-input').value = currentUserProfile.name;
    document.getElementById('edit-bio-input').value = currentUserProfile.bio;
    document.getElementById('modal-edit-profile').classList.remove('hidden');
};

document.getElementById('cancel-edit-btn').onclick = () => document.getElementById('modal-edit-profile').classList.add('hidden');

document.getElementById('save-profile-btn').onclick = async () => {
    const n = document.getElementById('edit-name-input').value.trim();
    const b = document.getElementById('edit-bio-input').value.trim();
    if(n) {
        await set(ref(database, `/olaparty/users/${auth.currentUser.uid}/name`), n);
        await set(ref(database, `/olaparty/users/${auth.currentUser.uid}/bio`), b);
        document.getElementById('modal-edit-profile').classList.add('hidden');
    }
};

document.getElementById('btn-edit-dp').onclick = () => document.getElementById('dp-upload').click();
attachImageUploader(document.getElementById('dp-upload'), async (base64) => {
    await set(ref(database, `/olaparty/users/${auth.currentUser.uid}/dp`), base64);
});

// ================== ROOMS & VOICE ==================
document.getElementById('btn-create-room-modal').onclick = () => document.getElementById('modal-create-room').classList.remove('hidden');
document.getElementById('cancel-room-btn').onclick = () => document.getElementById('modal-create-room').classList.add('hidden');

document.getElementById('confirm-create-room-btn').onclick = async () => {
    const rName = document.getElementById('new-room-name').value.trim() || `${currentUserProfile.name}'s Room`;
    document.getElementById('modal-create-room').classList.add('hidden');
    const roomId = await createLiveRoom(rName);
    openRoom(roomId, rName);
};

function openRoom(roomId, roomName) {
    activeRoomId = roomId;
    document.getElementById('active-room-title').textContent = roomName;
    document.getElementById('view-active-room').classList.add('slide-up-active');
    document.getElementById('room-text-chat').innerHTML = ''; 
    renderEmptySeats();

    // Listen room text chat
    onValue(ref(database, `/olaparty/room_chats/${roomId}`), (snap) => {
        document.getElementById('room-text-chat').innerHTML = '';
        snap.forEach(c => appendRoomChatMessage(c.val(), c.val().senderId === auth.currentUser.uid));
    });

    joinAudioRoom(roomId, (uid, isSpeaking, isLocal, hasLeft = false) => {
        const seatIndex = isLocal ? 0 : (parseInt(uid.toString().slice(-1)) % 7) + 1;
        const seatEl = document.getElementById(`seat-${seatIndex}`);
        if(!seatEl) return;
        if(hasLeft) {
            seatEl.innerHTML = `<div class="w-14 h-14 rounded-full bg-dark-800 border border-dashed border-white/10 flex items-center justify-center"><i class="fa-solid fa-plus text-gray-700 text-xs"></i></div><span class="text-[8px] font-bold uppercase text-gray-600">Empty</span>`;
            return;
        }
        seatEl.innerHTML = `<div class="w-14 h-14 rounded-full border-2 border-dark-900 ring-2 ring-gold-500 relative transition-all duration-300 ${isSpeaking ? 'speaking' : ''}"><img src="https://ui-avatars.com/api/?name=${uid}&background=random" class="w-full h-full rounded-full object-cover"></div><span class="text-[8px] font-bold text-gray-300 truncate w-full text-center mt-1">${isLocal ? 'YOU' : 'VIP'}</span>`;
    });
}

document.getElementById('mic-btn').onclick = async () => {
    const isMuted = await toggleMicrophone((uid, speaking, isLocal) => {
        const div = document.getElementById('seat-0').querySelector('div');
        speaking ? div.classList.add('speaking') : div.classList.remove('speaking');
    });
    const i = document.getElementById('mic-btn');
    if(isMuted) { i.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>'; i.classList.replace('bg-gold-500','bg-dark-800'); i.classList.remove('text-black'); }
    else { i.innerHTML = '<i class="fa-solid fa-microphone"></i>'; i.classList.replace('bg-dark-800','bg-gold-500'); i.classList.add('text-black'); }
};

document.getElementById('leave-room-btn').onclick = closeRoom;
function closeRoom() {
    document.getElementById('view-active-room').classList.remove('slide-up-active');
    leaveAudioRoom(); activeRoomId = null;
}

document.getElementById('room-send-btn').onclick = () => {
    const i = document.getElementById('room-msg-input');
    const text = i.value.trim();
    if(text && activeRoomId) {
        push(ref(database, `/olaparty/room_chats/${activeRoomId}`), {
            senderId: auth.currentUser.uid, senderName: currentUserProfile.name, text: text, timestamp: serverTimestamp()
        });
        i.value = '';
    }
};

document.getElementById('gift-btn').onclick = () => {
    if(activeRoomId) sendVirtualGift(500, activeRoomId, currentUserProfile.name);
};

// ================== DIRECT MESSAGES ==================
window.openDM = (partnerId, partnerName, partnerDp) => {
    currentDMPartnerId = partnerId;
    document.getElementById('dm-partner-name').textContent = partnerName;
    document.getElementById('dm-partner-dp').src = partnerDp;
    document.getElementById('dm-chat-view').classList.remove('hidden');

    const myId = auth.currentUser.uid;
    const chatId = myId < partnerId ? `${myId}_${partnerId}` : `${partnerId}_${myId}`;

    onValue(ref(database, `/olaparty/dm_messages/${chatId}`), (snap) => {
        const box = document.getElementById('dm-messages-list');
        box.innerHTML = '';
        snap.forEach(c => {
            const m = c.val();
            const isMe = m.senderId === myId;
            box.innerHTML += `<div class="flex w-full ${isMe ? 'justify-end' : 'justify-start'}"><div class="px-4 py-3 rounded-2xl text-sm max-w-[75%] ${isMe ? 'bg-gold-500 text-black rounded-br-sm' : 'bg-dark-800 text-white rounded-bl-sm border border-white/5'}">${m.text}</div></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

document.getElementById('close-dm-btn').onclick = () => {
    document.getElementById('dm-chat-view').classList.add('hidden');
    currentDMPartnerId = null;
};

document.getElementById('dm-send-btn').onclick = () => {
    const i = document.getElementById('dm-input');
    const text = i.value.trim();
    if(text && currentDMPartnerId) {
        const myId = auth.currentUser.uid;
        const chatId = myId < currentDMPartnerId ? `${myId}_${currentDMPartnerId}` : `${currentDMPartnerId}_${myId}`;
        push(ref(database, `/olaparty/dm_messages/${chatId}`), {
            senderId: myId, text: text, timestamp: serverTimestamp()
        });
        i.value = '';
    }
};
