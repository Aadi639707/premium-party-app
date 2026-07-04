import { auth, googleProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut, database, ref, set, get } from "./firebase-config.js";

export function initAuth(UI, onLoginSuccess, onLogout) {
    let confirmationResult = null;

    // Persist Auth State
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await ensureUserExistsInDB(user);
            onLoginSuccess(user);
        } else {
            onLogout();
        }
    });

    // Google Login
    UI.googleLoginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) { alert("Google Login Failed: " + error.message); }
    });

    // Phone Login - Setup Recaptcha
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });

    UI.sendOtpBtn.addEventListener('click', async () => {
        const phone = UI.phoneInput.value.trim();
        if (!phone) return alert("Enter a valid phone number with country code.");
        try {
            confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
            UI.phoneUI.classList.add('hidden');
            UI.otpUI.classList.remove('hidden');
            UI.otpUI.classList.add('flex');
        } catch (error) { alert("Failed to send OTP: " + error.message); }
    });

    UI.verifyOtpBtn.addEventListener('click', async () => {
        const code = UI.otpInput.value.trim();
        if(!code) return;
        try {
            await confirmationResult.confirm(code);
        } catch (error) { alert("Invalid OTP."); }
    });

    UI.logoutBtn.addEventListener('click', () => signOut(auth));
}

// Guarantee User Node Exists
async function ensureUserExistsInDB(user) {
    const userRef = ref(database, `/olaparty/users/${user.uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
        await set(userRef, {
            name: user.displayName || "New VIP User",
            dp: user.photoURL || `https://ui-avatars.com/api/?name=VIP&background=ffd700&color=000`,
            bio: "I'm new to Aura!",
            coins: 0,
            vip: 0
        });
    }
}
