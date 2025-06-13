// Display watch history
async function displayWatchHistory() {
    const historyGrid = document.getElementById('historyGrid');
    if (!historyGrid) return;

    const history = await getWatchHistory();
    
    if (history.length === 0) {
        historyGrid.innerHTML = '<p class="no-history">No watch history found</p>';
        return;
    }

    historyGrid.innerHTML = history.map(item => `
        <div class="history-item" onclick="window.location.href='/watch.html?id=${item.id}&ep=${item.lastEpisode}'">
            <img src="${item.animeImage}" alt="${item.animeTitle}">
            <div class="history-info">
                <h3>${item.animeTitle}</h3>
                <div class="history-meta">
                    <span>Episode ${item.lastEpisode}</span>
                    <span>${formatDate(item.lastWatched)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Format timestamp to readable date
function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

// Clear watch history
async function clearWatchHistory() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await firebase.database().ref(`users/${user.uid}/watchHistory`).remove();
        displayWatchHistory();
    } catch (error) {
        console.error('Error clearing watch history:', error);
        alert('Failed to clear watch history');
    }
}

// Initialize history page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname === '/history.html') {
        displayWatchHistory();
        
        // Clear history button
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear your watch history?')) {
                    await clearWatchHistory();
                }
            });
        }
    }
});
