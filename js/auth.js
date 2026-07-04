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

    // Google Login (With Error Alert)
    UI.googleLoginBtn.addEventListener('click', async () => {
        try {
            UI.googleLoginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
            await signInWithPopup(auth, googleProvider);
        } catch (error) { 
            alert("Google Login Failed: " + error.message + "\n\n(Firebase Authorized Domains check karein)"); 
            UI.googleLoginBtn.innerHTML = '<i class="fa-brands fa-google text-xl"></i> Continue with Google';
        }
    });

    // Safely load Recaptcha ONLY when button is clicked (Fixes the crash)
    function getRecaptcha() {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        return window.recaptchaVerifier;
    }

    // Phone Login (Auto +91 Added)
    UI.sendOtpBtn.addEventListener('click', async () => {
        let phone = UI.phoneInput.value.trim();
        
        if (!phone) return alert("Please enter your phone number.");

        // Automatically add +91 if user forgets
        if (phone.length === 10 && !phone.startsWith("+")) {
            phone = "+91" + phone;
        }

        UI.sendOtpBtn.textContent = "Sending OTP...";
        try {
            const recaptcha = getRecaptcha();
            confirmationResult = await signInWithPhoneNumber(auth, phone, recaptcha);
            
            UI.phoneUI.classList.add('hidden');
            UI.otpUI.classList.remove('hidden');
            UI.otpUI.classList.add('flex');
        } catch (error) { 
            alert("Failed to send OTP: " + error.message); 
            UI.sendOtpBtn.textContent = "Send OTP";
        }
    });

    // Verify OTP
    UI.verifyOtpBtn.addEventListener('click', async () => {
        const code = UI.otpInput.value.trim();
        if(!code) return;
        
        UI.verifyOtpBtn.textContent = "Verifying...";
        try {
            await confirmationResult.confirm(code);
        } catch (error) { 
            alert("Invalid OTP! Try again."); 
            UI.verifyOtpBtn.textContent = "Verify & Enter";
        }
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
