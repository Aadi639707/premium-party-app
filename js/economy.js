import { auth, database, ref, onValue, runTransaction, push, serverTimestamp } from "./firebase-config.js";

export function listenToEconomy(uid, onUpdate) {
    onValue(ref(database, `/olaparty/users/${uid}`), (snap) => {
        if (snap.exists()) onUpdate(snap.val());
    });
}

export async function sendGift(roomId, senderName) {
    const uid = auth.currentUser.uid;
    const cost = 100; // Gift price
    try {
        const res = await runTransaction(ref(database, `/olaparty/users/${uid}/coins`), (coins) => {
            if (coins === null) return coins;
            if (coins >= cost) return coins - cost;
            return; 
        });

        if (res.committed) {
            push(ref(database, `/olaparty/room_chats/${roomId}`), {
                senderId: uid, senderName: senderName, text: `🎁 Sent a Virtual Gift!`, isSystem: true, timestamp: serverTimestamp()
            });
            alert("Gift Sent!");
        } else { alert("Not enough coins!"); }
    } catch (e) { console.log(e); }
}
