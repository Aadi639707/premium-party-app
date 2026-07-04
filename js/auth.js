import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";

export function setupAuth(uiElements, callbacks) {
    let isLoginMode = true;

    // Toggle Form UI
    uiElements.toggleAuthText.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        uiElements.authBtn.textContent = isLoginMode ? 'Enter Club' : 'Create VIP Identity';
        uiElements.toggleAuthText.innerHTML = isLoginMode 
            ? 'Apply for access? <span class="text-gold-400 font-bold hover:text-gold-300">Sign Up</span>'
            : 'Already a member? <span class="text-gold-400 font-bold hover:text-gold-300">Login</span>';
    });

    // Handle Submit
    uiElements.authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = uiElements.authEmail.value.trim();
        const password = uiElements.authPassword.value.trim();
        const originalText = uiElements.authBtn.textContent;
        uiElements.authBtn.textContent = 'Verifying...';

        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                // Initialize Billionaire Wallet Profile
                await setDoc(doc(db, "users", cred.user.uid), {
                    email: email,
                    coins: 100000, // Premium startup balance
                    level: 1,
                    followers: 0,
                    following: 0
                });
            }
        } catch (error) {
            alert("Auth Error: " + error.message);
            uiElements.authBtn.textContent = originalText;
        }
    });

    // Handle Logout
    uiElements.logoutBtn.addEventListener('click', () => signOut(auth));

    // Listen for Auth State Changes
    onAuthStateChanged(auth, (user) => {
        if (user) {
            callbacks.onLogin(user);
        } else {
            callbacks.onLogout();
        }
    });
}
