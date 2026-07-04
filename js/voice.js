import { auth, database, ref, push, set, onValue, serverTimestamp } from "./firebase-config.js";

const AGORA_APP_ID = "333a41e97d1945cebb99479b6da8dc61"; // Test ID
let agoraClient = null, localMic = null, isMuted = true;

export async function createLiveRoom(roomName) {
    const uid = auth.currentUser.uid;
    const roomRef = push(ref(database, `/olaparty/rooms`));
    await set(roomRef, {
        id: roomRef.key,
        name: roomName,
        creator: uid,
        usersCount: 1,
        timestamp: serverTimestamp()
    });
    return roomRef.key;
}

export function listenToActiveRooms(callback) {
    onValue(ref(database, `/olaparty/rooms`), (snap) => {
        const rooms = [];
        snap.forEach(child => { rooms.push(child.val()); });
        callback(rooms);
    });
}

export async function joinAudioRoom(roomId, onSeatUpdate) {
    if (agoraClient) return;
    agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    isMuted = true;

    agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "audio") {
            user.audioTrack.play();
            onSeatUpdate(user.uid, true, false);
        }
    });

    agoraClient.on("user-unpublished", (user) => {
        onSeatUpdate(user.uid, false, false, true);
    });

    try {
        const uid = await agoraClient.join(AGORA_APP_ID, roomId, null, null);
        localMic = await AgoraRTC.createMicrophoneAudioTrack();
        onSeatUpdate(uid, false, true);
    } catch (error) { console.error("VC Error", error); }
}

export async function toggleMicrophone(onSeatUpdate) {
    if (!localMic || !agoraClient) return null;
    if (isMuted) { await agoraClient.publish([localMic]); isMuted = false; } 
    else { await agoraClient.unpublish([localMic]); isMuted = true; }
    onSeatUpdate(agoraClient.uid, !isMuted, true);
    return isMuted;
}

export async function leaveAudioRoom() {
    if (localMic) { localMic.stop(); localMic.close(); localMic = null; }
    if (agoraClient) { await agoraClient.leave(); agoraClient = null; }
}
