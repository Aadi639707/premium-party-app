import { auth, googleProvider, RecaptchaVerifier, signInWithPopup, signInWithPhoneNumber, onAuthStateChanged, signOut, database, ref, set, get } from "./firebase-config.js";

export function initAuth(onLoginSuccess, onLogout) {
    let confirmationResult = null;
    
    const ui = {
        authView: document.getElementById('view-auth'),
        dashView: document.getElementById('view-dashboard'),
        googleBtn: document.getElementById('google-login-btn'),
        phoneInput: document.getElementById('phone-number'),
        sendOtpBtn: document.getElementById('send-otp-btn'),
        otpInput: document.getElementById('otp-code'),
        verifyOtpBtn: document.getElementById('verify-otp-btn'),
        logoutBtn: document.getElementById('logout-btn')
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            ui.authView.classList.add('hidden');
            ui.dashView.classList.remove('hidden');
            ui.dashView.classList.add('flex');
            
            // Auto create profile in DB
            const userRef = ref(database, `/olaparty/users/${user.uid}`);
            const snap = await get(userRef);
            if (!snap.exists()) {
                await set(userRef, { name: user.displayName || "VIP User", coins: 500 });
            }
            onLoginSuccess(user);
        } else {
            ui.authView.classList.remove('hidden');
            ui.dashView.classList.add('hidden');
            ui.dashView.classList.remove('flex');
            onLogout();
        }
    });

    ui.googleBtn.onclick = async () => {
        try { await signInWithPopup(auth, googleProvider); } 
        catch (e) { alert("Google Login Failed: " + e.message); }
    };

    ui.sendOtpBtn.onclick = async () => {
        let phone = ui.phoneInput.value.trim();
        if(!phone) return alert("Phone number dalen!");
        if(phone.length === 10 && !phone.startsWith("+")) phone = "+91" + phone;

        ui.sendOtpBtn.textContent = "Please Wait...";
        
        try {
            if(!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
            }
            confirmationResult = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
            
            document.getElementById('phone-ui').classList.add('hidden');
            document.getElementById('otp-ui').classList.remove('hidden');
            document.getElementById('otp-ui').classList.add('flex');
        } catch(e) {
            alert("OTP Error: " + e.message);
            ui.sendOtpBtn.textContent = "Send OTP";
        }
    };

    ui.verifyOtpBtn.onclick = async () => {
        const code = ui.otpInput.value.trim();
        if(!code) return alert("OTP dalen!");
        try { await confirmationResult.confirm(code); } 
        catch (e) { alert("Galat OTP!"); }
    };

    ui.logoutBtn.onclick = () => signOut(auth);
}
