import { auth, database, ref, onValue, runTransaction, push, serverTimestamp } from "./firebase-config.js";

export function listenToEconomy(uid, updateUI) {
    onValue(ref(database, `/olaparty/users/${uid}`), (snap) => {
        if (snap.exists()) updateUI(snap.val());
    });
}

export async function sendVirtualGift(cost, roomId, senderName) {
    if (!auth.currentUser) return false;
    const uid = auth.currentUser.uid;
    const userRef = ref(database, `/olaparty/users/${uid}/coins`);

    try {
        const res = await runTransaction(userRef, (coins) => {
            if (coins === null) return coins;
            if (coins >= cost) return coins - cost;
            return; 
        });

        if (res.committed) {
            push(ref(database, `/olaparty/room_chats/${roomId}`), {
                senderId: uid,
                senderName: senderName,
                text: `🎁 Sent a Virtual Gift (${cost} Coins)!`,
                isSystem: true,
                timestamp: serverTimestamp()
            });
            return true;
        } else {
            alert("Insufficient Coins. You need coins to send gifts.");
            return false;
        }
    } catch (e) { return false; }
}
