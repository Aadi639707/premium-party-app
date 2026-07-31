import { auth, googleProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut, database, ref, set, get } from "./firebase-config.js";

export function initAuth(onLoginSuccess, onLogout) {
    let confirmationResult = null;
    const UI = {
        viewAuth: document.getElementById('view-auth'),
        viewDashboard: document.getElementById('view-dashboard'),
        googleBtn: document.getElementById('google-login-btn'),
        phoneInput: document.getElementById('phone-number'),
        sendOtpBtn: document.getElementById('send-otp-btn'),
        otpInput: document.getElementById('otp-code'),
        verifyOtpBtn: document.getElementById('verify-otp-btn'),
        phoneUI: document.getElementById('phone-ui'),
        otpUI: document.getElementById('otp-ui'),
        logoutBtn: document.getElementById('logout-btn')
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await ensureUserExists(user);
            UI.viewAuth.classList.add('hidden');
            UI.viewDashboard.classList.remove('hidden');
            UI.viewDashboard.classList.add('flex');
            onLoginSuccess(user);
        } else {
            UI.viewAuth.classList.remove('hidden');
            UI.viewDashboard.classList.add('hidden');
            UI.viewDashboard.classList.remove('flex');
            onLogout();
        }
    });

    UI.googleBtn.onclick = async () => {
        try { await signInWithPopup(auth, googleProvider); } 
        catch (e) { alert("Google Login Failed: " + e.message); }
    };

    function getRecaptcha() {
        if (!window.recaptchaVerifier) window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        return window.recaptchaVerifier;
    }

    UI.sendOtpBtn.onclick = async () => {
        let phone = UI.phoneInput.value.trim();
        if (!phone) return alert("Enter Phone Number");
        if (phone.length === 10 && !phone.startsWith("+")) phone = "+91" + phone;
        
        UI.sendOtpBtn.textContent = "Sending...";
        try {
            confirmationResult = await signInWithPhoneNumber(auth, phone, getRecaptcha());
            UI.phoneUI.classList.add('hidden');
            UI.otpUI.classList.remove('hidden');
            UI.otpUI.classList.add('flex');
        } catch (e) { alert("OTP Error: " + e.message); UI.sendOtpBtn.textContent = "Send OTP"; }
    };

    UI.verifyOtpBtn.onclick = async () => {
        const code = UI.otpInput.value.trim();
        if(!code) return alert("Enter OTP");
        try { await confirmationResult.confirm(code); } 
        catch (e) { alert("Invalid OTP"); }
    };

    UI.logoutBtn.onclick = () => signOut(auth);
}

async function ensureUserExists(user) {
    const userRef = ref(database, `/olaparty/users/${user.uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
        await set(userRef, {
            name: user.displayName || "VIP Member",
            dp: user.photoURL || `https://ui-avatars.com/api/?name=VIP&background=ffd700&color=000`,
            bio: "Ready to party!",
            coins: 500, 
            vip: 0
        });
    }
}
