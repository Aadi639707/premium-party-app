import { auth, googleProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut, database, ref, set, get } from "./firebase-config.js";

export function initAuth(UI, onLoginSuccess, onLogout) {
    let confirmationResult = null;

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
            UI.googleLoginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
            await signInWithPopup(auth, googleProvider);
        } catch (error) { 
            alert("Google Login Error: " + error.message); 
            UI.googleLoginBtn.innerHTML = '<i class="fa-brands fa-google text-xl"></i> Continue with Google';
        }
    });

    function getRecaptcha() {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        return window.recaptchaVerifier;
    }

    // Phone Login
    UI.sendOtpBtn.addEventListener('click', async () => {
        let phone = UI.phoneInput.value.trim();
        if (!phone) return alert("Bhai, Phone number toh daalo!");

        if (phone.length === 10 && !phone.startsWith("+")) {
            phone = "+91" + phone;
        } else if (!phone.startsWith("+")) {
            return alert("Number 10 digit ka hona chahiye.");
        }

        UI.sendOtpBtn.textContent = "Sending OTP...";
        try {
            const recaptcha = getRecaptcha();
            confirmationResult = await signInWithPhoneNumber(auth, phone, recaptcha);
            UI.phoneUI.classList.add('hidden');
            UI.otpUI.classList.remove('hidden');
            UI.otpUI.classList.add('flex');
        } catch (error) { 
            alert("OTP Bhejne me error: " + error.message); 
            UI.sendOtpBtn.textContent = "Send OTP";
        }
    });

    UI.verifyOtpBtn.addEventListener('click', async () => {
        const code = UI.otpInput.value.trim();
        if(!code) return alert("OTP daalo!");
        
        UI.verifyOtpBtn.textContent = "Verifying...";
        try {
            await confirmationResult.confirm(code);
        } catch (error) { 
            alert("Galat OTP! Wapas try karo."); 
            UI.verifyOtpBtn.textContent = "Verify & Enter";
        }
    });

    UI.logoutBtn.addEventListener('click', () => signOut(auth));
}

// Ensure DB Record
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
