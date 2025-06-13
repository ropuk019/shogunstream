// Initialize profile page
document.addEventListener('DOMContentLoaded', async () => {
    const user = firebase.auth().currentUser;
    if (!user) {
        window.location.href = '/login.html';
        return;
    }

    // Load profile data
    await loadProfileData(user);
    
    // Setup tab switching
    setupProfileTabs();
    
    // Setup form submission
    setupProfileForm();
    
    // Load watch history
    await loadWatchHistory();
    
    // Load watchlist
    await loadWatchlist();
});

// Load profile data from Firebase
async function loadProfileData(user) {
    try {
        // Get user data from Firebase
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        const userData = snapshot.val();
        
        // Update profile UI
        document.getElementById('profileUsername').textContent = userData.username || user.email.split('@')[0];
        document.getElementById('profileEmail').textContent = user.email;
        
        if (userData.avatar) {
            document.getElementById('profileAvatar').src = userData.avatar;
        }
        
        // Update stats
        if (userData.stats) {
            document.getElementById('totalWatched').textContent = userData.stats.totalWatched || 0;
            document.getElementById('totalWatchTime').textContent = formatWatchTime(userData.stats.totalWatchTime || 0);
            document.getElementById('avgRating').textContent = userData.stats.avgRating?.toFixed(1) || '0.0';
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
    }
}

// Format watch time (minutes to hours)
function formatWatchTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}

// Setup profile tabs
function setupProfileTabs() {
    const tabs = document.querySelectorAll('.profile-menu a');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            const tabId = `${tab.dataset.tab}Tab`;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Setup profile form submission
function setupProfileForm() {
    const form = document.getElementById('profileForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const displayName = document.getElementById('displayName').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        try {
            // Update display name in database
            await firebase.database().ref(`users/${user.uid}`).update({
                username: displayName
            });
            
            // Update password if provided
            if (newPassword && newPassword === confirmNewPassword) {
                const credential = firebase.auth.EmailAuthProvider.credential(
                    user.email, 
                    currentPassword
                );
                
                // Reauthenticate user
                await user.reauthenticateWithCredential(credential);
                
                // Update password
                await user.updatePassword(newPassword);
            }
            
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(`Error: ${error.message}`);
        }
    });
}

// Load watch history
async function loadWatchHistory() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const snapshot = await firebase.database().ref(`users/${user.uid}/watchHistory`).once('value');
        const history = snapshot.val();
        
        const historyGrid = document.getElementById('historyGrid');
        if (!historyGrid) return;
        
        if (!history) {
            historyGrid.innerHTML = '<p>No watch history found</p>';
            return;
        }
        
        const historyItems = Object.entries(history).map(([animeId, data]) => {
            return `
                <div class="history-item" onclick="window.location.href='/watch.html?id=${animeId}&ep=${data.lastEpisode}'">
                    <img src="${data.animeImage}" alt="${data.animeTitle}">
                    <div class="history-info">
                        <h3>${data.animeTitle}</h3>
                        <div class="history-meta">
                            <span>Episode ${data.lastEpisode}</span>
                            <span>${new Date(data.lastWatched).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        historyGrid.innerHTML = historyItems.join('');
        
        // Setup clear history button
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear your watch history?')) {
                    await firebase.database().ref(`users/${user.uid}/watchHistory`).remove();
                    historyGrid.innerHTML = '<p>No watch history found</p>';
                }
            });
        }
    } catch (error) {
        console.error('Error loading watch history:', error);
    }
}

// Load watchlist
async function loadWatchlist() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        const snapshot = await firebase.database().ref(`users/${user.uid}/watchlist`).once('value');
        const watchlist = snapshot.val();
        
        const watchlistGrid = document.getElementById('watchlistGrid');
        if (!watchlistGrid) return;
        
        if (!watchlist) {
            watchlistGrid.innerHTML = '<p>Your watchlist is empty</p>';
            return;
        }
        
        // Get anime details for each item in watchlist
        const animeIds = Object.keys(watchlist);
        const animePromises = animeIds.map(id => 
            firebase.database().ref(`anime/${id}`).once('value')
        );
        
        const animeSnapshots = await Promise.all(animePromises);
        const animeItems = animeSnapshots.map(snap => snap.val());
        
        watchlistGrid.innerHTML = animeItems.map(anime => `
            <div class="anime-card" onclick="window.location.href='/watch.html?id=${anime.id}'">
                <img src="/assets/video-covers/${anime.id}.jpg" alt="${anime.title}">
                <div class="anime-info">
                    <div class="anime-title">${anime.title}</div>
                    <div class="anime-meta">
                        <span>${anime.type}</span>
                        <span class="anime-rating"><i class="fas fa-star"></i> ${anime.rating}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading watchlist:', error);
    }
}