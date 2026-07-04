import { doc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";
import { setupAuth } from "./auth.js";
import { joinVoiceRoom, toggleMic, leaveVoiceRoom } from "./voice-engine.js";
import { DOM, switchView, setupNavigation, renderRoomsList, renderEmptySeats, updateMicUI, triggerGiftAnimation } from "./ui-controller.js";

let currentUserData = null;

// ==========================================
// 1. INITIALIZE APP
// ==========================================
setupNavigation();

setupAuth(DOM, {
    onLogin: (user) => {
        switchView(true);
        initUserData(user);
        renderRoomsList(handleJoinRoom);
    },
    onLogout: () => {
        switchView(false);
        handleLeaveRoom(); // Cleanup if they logout mid-session
    }
});

// ==========================================
// 2. REALTIME PROFILE & WALLET LOGIC
// ==========================================
function initUserData(user) {
    onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
            currentUserData = docSnap.data();
            
            // Format number to currency style (e.g., 100,000)
            const formattedCoins = parseInt(currentUserData.coins).toLocaleString();
            
            // Update Dashboard UI
            document.getElementById('wallet-balance').textContent = formattedCoins;
            document.getElementById('profile-email').textContent = currentUserData.email.split('@')[0];
            document.getElementById('profile-uid').textContent = user.uid.substring(0, 10).toUpperCase();
            document.getElementById('vip-level').textContent = currentUserData.level;
            document.getElementById('profile-followers').textContent = currentUserData.followers;
            document.getElementById('profile-following').textContent = currentUserData.following;
        }
    });
}

// ==========================================
// 3. ROOM INTERACTIONS & VOICE SEATS
// ==========================================
function handleJoinRoom(roomId, roomName) {
    document.getElementById('active-room-title').textContent = roomName;
    DOM.viewActiveRoom.classList.add('slide-up-active');
    
    renderEmptySeats();
    
    joinVoiceRoom(roomId, (uid, isSpeaking, isLocal, hasLeft = false) => {
        // Simple seat allocation (0 is local, 1-7 random for remote)
        const seatId = isLocal ? 'seat-0' : `seat-${Math.floor(Math.random() * 7) + 1}`;
        const seatEl = document.getElementById(seatId);
        if(!seatEl) return;

        if (hasLeft) {
            // Reset Seat
            seatEl.innerHTML = `
                <div class="w-16 h-16 rounded-full bg-dark-700/50 border border-dashed border-white/20 flex items-center justify-center transition-all duration-300">
                    <i class="fa-solid fa-plus text-gray-600 text-sm"></i>
                </div>
                <span class="text-[9px] font-bold tracking-widest uppercase text-gray-600 truncate w-full text-center">Empty</span>
            `;
            return;
        }

        // Occupy Seat
        seatEl.innerHTML = `
            <div class="w-16 h-16 rounded-full border-[3px] border-dark-900 ring-2 ring-gold-500 relative transition-all duration-300 ${isSpeaking ? 'speaking' : ''}">
                <img src="https://i.pravatar.cc/150?u=${uid}" class="w-full h-full rounded-full object-cover">
            </div>
            <span class="text-[10px] font-bold text-gray-300 truncate w-full text-center mt-1">${isLocal ? 'YOU' : 'VIP '+uid.toString().slice(-3)}</span>
        `;
    });
}

// Mic Button Click
DOM.micBtn.addEventListener('click', async () => {
    const isNowMuted = await toggleMic();
    if(isNowMuted !== null) updateMicUI(isNowMuted);
});

// Leave Button Click
DOM.leaveRoomBtn.addEventListener('click', handleLeaveRoom);

function handleLeaveRoom() {
    DOM.viewActiveRoom.classList.remove('slide-up-active');
    leaveVoiceRoom();
    updateMicUI(true); // reset mic UI
}

// ==========================================
// 4. ECONOMY (GIFTING) LOGIC
// ==========================================
DOM.giftBtn.addEventListener('click', async () => {
    if (!auth.currentUser) return;
    
    const giftCost = 100;
    const userRef = doc(db, "users", auth.currentUser.uid);
    
    try {
        // Firestore Transaction ensures perfect sync without race conditions
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User profile missing!";
            
            const newBalance = userDoc.data().coins - giftCost;
            if (newBalance < 0) throw "Insufficient Gem Balance!";
            
            transaction.update(userRef, { coins: newBalance });
        });
        
        // Success: Trigger Billionaire UI Animation
        triggerGiftAnimation();
    } catch (e) {
        alert("Transaction Failed: " + e);
    }
});
