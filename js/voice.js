import { auth, database, ref, push, set, onValue, serverTimestamp } from "./firebase-config.js";

const APP_ID = "333a41e97d1945cebb99479b6da8dc61";
let client = null, localMic = null, isMuted = true;

export async function createRoom(name) {
    const rRef = push(ref(database, `/olaparty/rooms`));
    await set(rRef, { id: rRef.key, name: name || "Live Room", creator: auth.currentUser.uid, timestamp: serverTimestamp() });
    return rRef.key;
}

export function listenRooms(onRoomsLoad) {
    onValue(ref(database, `/olaparty/rooms`), (snap) => {
        const rooms = []; snap.forEach(c => rooms.push(c.val())); onRoomsLoad(rooms);
    });
}

export async function joinVoice(roomId, onSeat) {
    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    client.on("user-published", async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        if (mediaType === "audio") { user.audioTrack.play(); onSeat(user.uid, true, false); }
    });
    client.on("user-unpublished", (user) => onSeat(user.uid, false, false, true));

    const uid = await client.join(APP_ID, roomId, null, null);
    localMic = await AgoraRTC.createMicrophoneAudioTrack();
    onSeat(uid, false, true);
}

export async function toggleMic(onSeat) {
    if(!localMic) return true;
    if(isMuted) { await client.publish([localMic]); isMuted = false; }
    else { await client.unpublish([localMic]); isMuted = true; }
    onSeat(client.uid, !isMuted, true);
    return isMuted;
}

export async function leaveVoice() {
    if(localMic) { localMic.stop(); localMic.close(); localMic = null; }
    if(client) { await client.leave(); client = null; }
    isMuted = true;
}
