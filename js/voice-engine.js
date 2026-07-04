import { AGORA_APP_ID } from "./config.js";

let agoraClient = null;
let localAudioTrack = null;
let isMuted = true;
let currentRoom = null;
let seatUpdateCallback = null;

export async function joinVoiceRoom(roomId, onSeatUpdate) {
    if (agoraClient) return; // Already in a room
    
    currentRoom = roomId;
    seatUpdateCallback = onSeatUpdate;
    isMuted = true;

    // Initialize Agora Web SDK
    agoraClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    // Handle remote users speaking
    agoraClient.on("user-published", async (user, mediaType) => {
        await agoraClient.subscribe(user, mediaType);
        if (mediaType === "audio") {
            user.audioTrack.play();
            seatUpdateCallback(user.uid, true, false); // true=speaking, false=isLocal
        }
    });

    // Handle remote users leaving
    agoraClient.on("user-unpublished", (user) => {
        seatUpdateCallback(user.uid, false, false, true); // true=left
    });

    try {
        // Join channel (using null token for testing/github pages simplicity)
        const uid = await agoraClient.join(AGORA_APP_ID, roomId, null, null);
        
        // Create Mic Track
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        
        // Push local user to UI seat
        seatUpdateCallback(uid, false, true); // false=not speaking yet, true=isLocal

    } catch (error) {
        console.error("Voice Engine Failed:", error);
        leaveVoiceRoom();
    }
}

export async function toggleMic() {
    if (!localAudioTrack || !agoraClient) return null;
    
    if (isMuted) {
        await agoraClient.publish([localAudioTrack]);
        isMuted = false;
    } else {
        await agoraClient.unpublish([localAudioTrack]);
        isMuted = true;
    }
    
    // Update local UI
    seatUpdateCallback(agoraClient.uid, !isMuted, true);
    return isMuted;
}

export async function leaveVoiceRoom() {
    if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
        localAudioTrack = null;
    }
    if (agoraClient) {
        await agoraClient.leave();
        agoraClient = null;
    }
    currentRoom = null;
}
