// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCnM6wc_W9yjM-ujbZ6F7MwqV4fPbQpw_c",
  authDomain: "shogunstream-5cd44.firebaseapp.com",
  projectId: "shogunstream-5cd44",
  storageBucket: "shogunstream-5cd44.firebasestorage.app",
  messagingSenderId: "883923412987",
  appId: "1:883923412987:web:1057271f944fa88c148d5e",
  measurementId: "G-MY11TWDW8B"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Auth state listener
auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    
    if (user && window.location.pathname === '/login.html') {
        window.location.href = '/';
    }
});

// Update UI based on auth state
function updateAuthUI(user) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');

    if (user) {
        // User is logged in
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        if (profileBtn) profileBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (userGreeting) {
            userGreeting.style.display = 'inline-block';
            userGreeting.textContent = `Hi, ${user.email.split('@')[0]}`;
        }
    } else {
        // User is logged out
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (registerBtn) registerBtn.style.display = 'inline-block';
        if (profileBtn) profileBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userGreeting) userGreeting.style.display = 'none';
    }
}

// Login function
async function login(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Login error:', error);
        document.getElementById('loginError').textContent = error.message;
        return null;
    }
}

// Register function
async function register(email, password) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Create user profile in database
        await database.ref('users/' + userCredential.user.uid).set({
            email: email,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            watchHistory: {}
        });
        
        return userCredential.user;
    } catch (error) {
        console.error('Registration error:', error);
        document.getElementById('registerError').textContent = error.message;
        return null;
    }
}

// Logout function
async function logout() {
    try {
        await auth.signOut();
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await login(email, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirm').value;
            
            if (password !== confirm) {
                document.getElementById('registerError').textContent = 'Passwords do not match';
                return;
            }
            
            await register(email, password);
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await logout();
        });
    }
});