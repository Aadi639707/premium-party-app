import { auth, database, ref, onValue, push, serverTimestamp } from "./firebase-config.js";
import { initAuth } from "./auth.js";
import { listenToEconomy, sendGift } from "./economy.js";
import { createRoom, listenRooms, joinVoice, toggleMic, leaveVoice } from "./voice.js";
import { setupTabs, renderRooms, drawSeats, addChatMsg } from "./ui.js";

let myProfile = null, activeRoom = null;

setupTabs();
initAuth((user) => initApp(user.uid), () => { activeRoom = null; leaveVoice(); });

function initApp(uid) {
    listenToEconomy(uid, (data) => {
        myProfile = data;
        document.getElementById('wallet-balance').textContent = data.coins;
        document.getElementById('profile-name').textContent = data.name;
        document.getElementById('profile-avatar').src = data.dp;
    });

    listenRooms((r) => renderRooms(r, openRoom));
}

document.getElementById('btn-create-room').onclick = async () => {
    const name = prompt("Enter Room Name:"); if(!name) return;
    const id = await createRoom(name); openRoom(id, name);
};

function openRoom(id, name) {
    activeRoom = id;
    document.getElementById('active-room-title').textContent = name;
    document.getElementById('view-active-room').classList.add('slide-up-active');
    document.getElementById('room-text-chat').innerHTML = ''; drawSeats();

    onValue(ref(database, `/olaparty/room_chats/${id}`), (snap) => {
        document.getElementById('room-text-chat').innerHTML = '';
        snap.forEach(c => addChatMsg(c.val()));
    });

    joinVoice(id, (uid, isSpeaking, isLocal, hasLeft) => {
        const seat = document.getElementById(`seat-${isLocal ? 0 : (parseInt(uid.toString().slice(-1)) % 7) + 1}`);
        if(!seat) return;
        if(hasLeft) seat.innerHTML = `<div class="w-14 h-14 rounded-full bg-dark-800 border border-dashed border-white/10 flex items-center justify-center"><i class="fa-solid fa-plus text-gray-700 text-xs"></i></div>`;
        else seat.innerHTML = `<div class="w-14 h-14 rounded-full border-2 border-dark-900 ring-2 ring-gold-500 relative transition-all duration-300 ${isSpeaking?'speaking':''}"><img src="https://ui-avatars.com/api/?name=${uid}" class="w-full h-full rounded-full"></div>`;
    });
}

document.getElementById('leave-room-btn').onclick = () => {
    document.getElementById('view-active-room').classList.remove('slide-up-active');
    leaveVoice(); activeRoom = null;
};

document.getElementById('mic-btn').onclick = async () => {
    const muted = await toggleMic((uid, spk) => {
        const d = document.getElementById('seat-0').querySelector('div');
        spk ? d.classList.add('speaking') : d.classList.remove('speaking');
    });
    const b = document.getElementById('mic-btn');
    if(muted) { b.innerHTML='<i class="fa-solid fa-microphone-slash"></i>'; b.classList.replace('bg-gold-500','bg-dark-800'); b.classList.remove('text-black'); }
    else { b.innerHTML='<i class="fa-solid fa-microphone"></i>'; b.classList.replace('bg-dark-800','bg-gold-500'); b.classList.add('text-black'); }
};

document.getElementById('room-send-btn').onclick = () => {
    const i = document.getElementById('room-msg-input');
    if(i.value.trim() && activeRoom) {
        push(ref(database, `/olaparty/room_chats/${activeRoom}`), { senderId: auth.currentUser.uid, senderName: myProfile.name, text: i.value, timestamp: serverTimestamp() });
        i.value = '';
    }
};

document.getElementById('gift-btn').onclick = () => { if(activeRoom) sendGift(activeRoom, myProfile.name); };
