import { auth, database, ref, onValue, push, serverTimestamp, set } from "./firebase-config.js";
import { initAuth } from "./auth.js";

const APP_ID = "333a41e97d1945cebb99479b6da8dc61";
let myProfile = { name: "Loading...", coins: 0 };
let activeRoomId = null, agoraClient = null, localMic = null, isMuted = true;

initAuth((user) => initDashboard(user.uid), () => { leaveRoom(); });

function initDashboard(uid) {
    // 1. Load User Economy
    onValue(ref(database, `/olaparty/users/${uid}`), (snap) => {
        if(snap.exists()) {
            myProfile = snap.val();
            document.getElementById('wallet-balance').textContent = myProfile.coins + " Coins";
        }
    });

    // 2. Load Rooms
    onValue(ref(database, `/olaparty/rooms`), (snap) => {
        const list = document.getElementById('live-rooms-list');
        list.innerHTML = '';
        snap.forEach(c => {
            const r = c.val();
            list.innerHTML += `<div class="bg-[#1a1a24] p-4 rounded-xl flex justify-between items-center cursor-pointer mb-2 border border-white/5" onclick="window.joinRoom('${r.id}', '${r.name}')"><span class="font-bold text-white">${r.name}</span><span class="bg-black text-[#ffd700] px-3 py-1 rounded-full text-xs">JOIN</span></div>`;
        });
    });
}

// Create Room
document.getElementById('btn-create-room').onclick = async () => {
    const name = prompt("Enter Room Name:");
    if(!name) return;
    const rRef = push(ref(database, `/olaparty/rooms`));
    await set(rRef, { id: rRef.key, name: name, timestamp: serverTimestamp() });
    window.joinRoom(rRef.key, name);
};

// Open & Join Room
window.joinRoom = async (roomId, roomName) => {
    activeRoomId = roomId;
    document.getElementById('active-room-title').textContent = roomName;
    document.getElementById('view-active-room').classList.add('slide-up');
    
    // Draw empty seats
    const seats = document.getElementById('voice-seats');
    seats.innerHTML = '';
    for(let i=0; i<8; i++) seats.innerHTML += `<div class="w-14 h-14 bg-[#1a1a24] rounded-full border border-dashed border-white/20 flex items-center justify-center text-gray-500" id="seat-${i}">+</div>`;

    // Agora Voice Logic
    if(!agoraClient) agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "audio") user.audioTrack.play();
        document.getElementById(`seat-${(parseInt(user.uid.toString().slice(-1)) % 7) + 1}`).innerHTML = `<div class="w-full h-full rounded-full bg-blue-500 speaking text-xs flex items-center justify-center text-white">VIP</div>`;
    });
    
    agoraClient.on("user-unpublished", (user) => {
         document.getElementById(`seat-${(parseInt(user.uid.toString().slice(-1)) % 7) + 1}`).innerHTML = `+`;
    });

    try {
        const uid = await agoraClient.join(APP_ID, roomId, null, null);
        localMic = await AgoraRTC.createMicrophoneAudioTrack();
        document.getElementById('seat-0').innerHTML = `<div class="w-full h-full rounded-full bg-green-500 text-xs flex items-center justify-center text-white">YOU</div>`;
    } catch(e) { alert("Agora Error: " + e.message); }

    // Load Chat
    onValue(ref(database, `/olaparty/room_chats/${roomId}`), (snap) => {
        const box = document.getElementById('room-text-chat');
        box.innerHTML = '';
        snap.forEach(c => {
            const m = c.val();
            box.innerHTML += `<div class="bg-[#1a1a24] p-2 rounded-xl text-sm border border-white/5 w-fit"><span class="text-gray-400 font-bold text-xs block">${m.senderName}</span>${m.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// Mic Toggle
document.getElementById('mic-btn').onclick = async () => {
    if(!localMic || !agoraClient) return;
    if(isMuted) { await agoraClient.publish([localMic]); isMuted = false; }
    else { await agoraClient.unpublish([localMic]); isMuted = true; }
    
    const b = document.getElementById('mic-btn');
    if(isMuted) { b.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>'; b.classList.replace('bg-[#ffd700]', 'bg-[#1a1a24]'); b.classList.replace('text-black', 'text-white'); document.getElementById('seat-0').firstChild.classList.remove('speaking'); }
    else { b.innerHTML = '<i class="fa-solid fa-microphone"></i>'; b.classList.replace('bg-[#1a1a24]', 'bg-[#ffd700]'); b.classList.replace('text-white', 'text-black'); document.getElementById('seat-0').firstChild.classList.add('speaking'); }
};

// Send Text Chat
document.getElementById('room-send-btn').onclick = () => {
    const input = document.getElementById('room-msg-input');
    if(input.value.trim() && activeRoomId) {
        push(ref(database, `/olaparty/room_chats/${activeRoomId}`), { senderName: myProfile.name, text: input.value, timestamp: serverTimestamp() });
        input.value = '';
    }
};

// Leave Room
document.getElementById('leave-room-btn').onclick = leaveRoom;
async function leaveRoom() {
    document.getElementById('view-active-room').classList.remove('slide-up');
    if(localMic) { localMic.stop(); localMic.close(); localMic = null; }
    if(agoraClient) { await agoraClient.leave(); }
    isMuted = true; activeRoomId = null;
}
