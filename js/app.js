// ============================================================================
// 1. FIREBASE & AGORA CONFIGURATION
// ============================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, runTransaction, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// WARNING: Replace with your actual Firebase Project config. 
// Firestore rules MUST allow read/write for authenticated users.
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// WARNING: Replace with your Agora App ID. (Using temp token 'null' for testing)
const AGORA_APP_ID = "YOUR_AGORA_APP_ID"; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ============================================================================
// 2. STATE & DOM ELEMENTS
// ============================================================================
let isLoginMode = true;
let currentUserDoc = null;
let agoraClient = null;
let localAudioTrack = null;
let isMuted = true;
let currentRoomId = null;

// Views
const viewAuth = document.getElementById('view-auth');
const viewDashboard = document.getElementById('view-dashboard');
const viewActiveRoom = document.getElementById('view-active-room');

// Auth DOM
const authForm = document.getElementById('auth-form');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authBtn = document.getElementById('auth-btn');
const toggleAuthMode = document.getElementById('toggle-auth-mode');

// ============================================================================
// 3. AUTHENTICATION LOGIC
// ============================================================================
toggleAuthMode.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    authBtn.textContent = isLoginMode ? 'Enter the Club' : 'Create VIP Account';
    toggleAuthMode.innerHTML = isLoginMode 
        ? 'New here? <span class="text-gold-500 font-bold">Apply for Access (Sign Up)</span>'
        : 'Already VIP? <span class="text-gold-500 font-bold">Login</span>';
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    authBtn.textContent = 'Processing...';

    try {
        if (isLoginMode) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            // Initialize Economy/Profile in Firestore
            await setDoc(doc(db, "users", userCred.user.uid), {
                email: email,
                coins: 5000, // Premium starting balance
                level: 1,
                followers: 0,
                following: 0
            });
        }
    } catch (error) {
        alert("Authentication Error: " + error.message);
        authBtn.textContent = isLoginMode ? 'Enter the Club' : 'Create VIP Account';
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        viewAuth.classList.add('hidden');
        viewDashboard.classList.remove('hidden');
        viewDashboard.classList.add('flex');
        initDashboard(user);
    } else {
        viewAuth.classList.remove('hidden');
        viewDashboard.classList.add('hidden');
        viewDashboard.classList.remove('flex');
        if(agoraClient) leaveRoom(); // Clean up if logged out while in room
    }
});

// ============================================================================
// 4. DASHBOARD & ECONOMY LOGIC
// ============================================================================
function initDashboard(user) {
    // Real-time Economy & Profile Listener
    onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
            currentUserDoc = docSnap.data();
            document.getElementById('wallet-balance-top').textContent = currentUserDoc.coins.toLocaleString();
            document.getElementById('profile-email').textContent = currentUserDoc.email.split('@')[0];
            document.getElementById('profile-uid').textContent = user.uid.substring(0, 8).toUpperCase();
            document.getElementById('vip-level').textContent = currentUserDoc.level;
            document.getElementById('profile-followers').textContent = currentUserDoc.followers;
            document.getElementById('profile-following').textContent = currentUserDoc.following;
        }
    });
    
    renderRooms();
}

// Bottom Navigation Routing
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        
        // Reset Tabs
        ['tab-rooms', 'tab-dms', 'tab-profile'].forEach(id => {
            document.getElementById(id).classList.add('hidden');
            document.getElementById(id).classList.remove('flex');
        });
        
        // Reset Nav Buttons
        document.querySelectorAll('.nav-btn').forEach(b => {
            b.classList.remove('active', 'text-gold-500');
            b.classList.add('text-gray-500');
        });
        
        // Activate Tab
        const activeTab = document.getElementById(target);
        activeTab.classList.remove('hidden');
        activeTab.classList.add('flex');
        e.currentTarget.classList.add('active', 'text-gold-500');
        e.currentTarget.classList.remove('text-gray-500');

        // Update Header Title
        const titles = { 'tab-rooms': 'Discover', 'tab-dms': 'Messages', 'tab-profile': 'VIP Profile' };
        document.getElementById('header-title').textContent = titles[target];
    });
});

// ============================================================================
// 5. AGORA VOICE ROOMS LOGIC
// ============================================================================
function renderRooms() {
    const roomsContainer = document.getElementById('tab-rooms');
    const mockRooms = [
        { id: "global_lounge", name: "🌍 Global Investors Lounge", tags: ["Crypto", "Networking"], users: 24 },
        { id: "tech_talks", name: "💻 Tech & Startups", tags: ["Development", "Pitching"], users: 12 },
        { id: "chill_zone", name: "🎵 Lo-Fi Chill Zone", tags: ["Music", "Vibes"], users: 56 }
    ];

    roomsContainer.innerHTML = mockRooms.map(room => `
        <div class="bg-dark-700/50 p-5 rounded-2xl border border-white/5 shadow-lg hover:border-gold-500/30 transition-colors cursor-pointer flex justify-between items-center" onclick="joinRoom('${room.id}', '${room.name}')">
            <div>
                <h3 class="text-lg font-bold text-white mb-2">${room.name}</h3>
                <div class="flex gap-2">
                    ${room.tags.map(t => `<span class="bg-dark-900 px-3 py-1 rounded-full text-xs text-gray-400 border border-white/5">${t}</span>`).join('')}
                </div>
            </div>
            <div class="flex flex-col items-center">
                <div class="flex -space-x-2">
                    <img class="w-8 h-8 rounded-full border border-dark-700" src="https://i.pravatar.cc/100?img=${Math.floor(Math.random()*70)}" alt="">
                    <img class="w-8 h-8 rounded-full border border-dark-700" src="https://i.pravatar.cc/100?img=${Math.floor(Math.random()*70)+1}" alt="">
                </div>
                <span class="text-xs text-gray-500 mt-1"><i class="fa-solid fa-fire text-gold-500 mr-1"></i>${room.users}</span>
            </div>
        </div>
    `).join('');
}

window.joinRoom = async (roomId, roomName) => {
    currentRoomId = roomId;
    document.getElementById('active-room-title').textContent = roomName;
    viewActiveRoom.classList.add('slide-up-active');
    
    renderSeats(); // Initialize empty UI seats

    // Initialize Agora Client
    agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    
    agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "audio") {
            user.audioTrack.play();
            updateSeat(user.uid, true);
        }
    });

    agoraClient.on("user-unpublished", (user) => {
        updateSeat(user.uid, false);
    });

    try {
        // UID null allows Agora to auto-assign one
        const uid = await agoraClient.join(AGORA_APP_ID, roomId, null, null);
        
        // Create Mic Track but don't publish immediately (Muted by default)
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        isMuted = true;
        updateMicUI();
        
        // Place local user in seat 1
        updateSeat(uid, false, true);

    } catch (error) {
        console.error("Agora Error: ", error);
        alert("Failed to connect to voice engine. Check App ID.");
        leaveRoom();
    }
};

function renderSeats() {
    const seatsContainer = document.getElementById('voice-seats');
    seatsContainer.innerHTML = '';
    for(let i=0; i<8; i++) {
        seatsContainer.innerHTML += `
            <div class="flex flex-col items-center gap-2 w-16" id="seat-${i}">
                <div class="w-14 h-14 rounded-full bg-dark-700 border-2 border-dashed border-white/20 flex items-center justify-center relative transition-all duration-300">
                    <i class="fa-solid fa-plus text-gray-600 text-sm"></i>
                </div>
                <span class="text-[10px] text-gray-500 truncate w-full text-center">Empty</span>
            </div>
        `;
    }
}

function updateSeat(uid, isSpeaking, isLocal = false) {
    // Simplified: Find first empty seat or existing seat to place user. 
    // In a full production app, you map exact UIDs to specific seat indexes.
    const seatId = isLocal ? 'seat-0' : `seat-${Math.floor(Math.random() * 7) + 1}`; 
    const seatEl = document.getElementById(seatId);
    if(!seatEl) return;
    
    seatEl.innerHTML = `
        <div class="w-14 h-14 rounded-full bg-dark-700 border-2 border-gold-500 relative transition-all duration-300 ${isSpeaking ? 'speaking' : ''}">
            <img src="https://i.pravatar.cc/100?u=${uid}" class="w-full h-full rounded-full object-cover">
            ${isMuted && isLocal ? `<div class="absolute -bottom-1 -right-1 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-dark-800"><i class="fa-solid fa-microphone-slash text-[8px] text-white"></i></div>` : ''}
        </div>
        <span class="text-[10px] text-gray-300 truncate w-full text-center">${isLocal ? 'You' : 'User '+uid.toString().slice(-4)}</span>
    `;
}

// Mic Controls
document.getElementById('mic-btn').addEventListener('click', async () => {
    if (!localAudioTrack || !agoraClient) return;
    
    if (isMuted) {
        await agoraClient.publish([localAudioTrack]);
        isMuted = false;
    } else {
        await agoraClient.unpublish([localAudioTrack]);
        isMuted = true;
    }
    updateMicUI();
    // Update local seat UI
    updateSeat(agoraClient.uid, !isMuted, true);
});

function updateMicUI() {
    const btn = document.getElementById('mic-btn');
    if (isMuted) {
        btn.innerHTML = '<i class="fa-solid fa-microphone-slash text-gray-400 text-xl"></i>';
        btn.classList.replace('bg-gold-500', 'bg-dark-700');
    } else {
        btn.innerHTML = '<i class="fa-solid fa-microphone text-dark-900 text-xl"></i>';
        btn.classList.replace('bg-dark-700', 'bg-gold-500');
    }
}

// Leave Room
document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);

async function leaveRoom() {
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
    }
    if (agoraClient) {
        await agoraClient.leave();
    }
    viewActiveRoom.classList.remove('slide-up-active');
    currentRoomId = null;
    agoraClient = null;
    localAudioTrack = null;
}

// ============================================================================
// 6. VIRTUAL ECONOMY (GIFTING)
// ============================================================================
document.getElementById('gift-btn').addEventListener('click', async () => {
    if (!auth.currentUser || !currentRoomId) return;
    
    const giftCost = 100;
    
    // Play optimistic UI animation
    const giftIcon = document.createElement('div');
    giftIcon.className = 'gift-animation';
    giftIcon.innerHTML = '🎁';
    giftIcon.style.left = '50%';
    giftIcon.style.top = '50%';
    viewActiveRoom.appendChild(giftIcon);
    setTimeout(() => giftIcon.remove(), 1500);

    // Process Transaction in Firestore
    const userRef = doc(db, "users", auth.currentUser.uid);
    
    try {
        await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw "User does not exist!";
            
            const newBalance = userDoc.data().coins - giftCost;
            if (newBalance < 0) throw "Insufficient Coins!";
            
            transaction.update(userRef, { coins: newBalance });
            
            // In a real app, you would also transaction.set() a gift record to the room document here.
        });
        console.log("Gift sent successfully! Balance deducted.");
    } catch (e) {
        alert(e);
    }
});
          
