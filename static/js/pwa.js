// Check for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Offline/Online Status Detection
window.addEventListener('online', function() {
    showConnectivityStatus('You are now online! 🌐');
});

window.addEventListener('offline', function() {
    showConnectivityStatus('You are offline. The app will continue to work with cached data! 📴');
});

// Show connectivity status
function showConnectivityStatus(message) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'connectivity-status';
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    setTimeout(() => {
        statusDiv.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(statusDiv);
        }, 1000);
    }, 3000);
}

// Show update notification
function showUpdateNotification() {
    const updateDiv = document.createElement('div');
    updateDiv.className = 'update-notification';
    updateDiv.innerHTML = `
        <p>New version available! 🆕</p>
        <button onclick="window.location.reload()">Update Now</button>
    `;
    document.body.appendChild(updateDiv);
} 