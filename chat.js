// Elemen HTML
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const usernameInput = document.getElementById('username');
const roomcodeInput = document.getElementById('roomcode');
const joinButton = document.getElementById('join-button');
const currentRoom = document.getElementById('current-room');
const currentUser = document.getElementById('current-user');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// GANTI DENGAN URL BACKEND HEROKU ANDA!
const BACKEND_URL = 'https://nama-aplikasi-anda.herokuapp.com'; 
let activeUsername = '';
let activeRoomcode = '';

// Fungsi: Tampilkan pesan di layar
function showMessage(user, text, isMine = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMine ? 'my-message' : 'other-message');
    
    messageDiv.innerHTML = `
        <div class="user">${user}</div>
        <div class="text">${text}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Gulir ke pesan terbaru
}

// Fungsi: Muat pesan lama dari backend
function loadOldMessages() {
    fetch(`${BACKEND_URL}/get-messages?roomcode=${activeRoomcode}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                chatMessages.innerHTML = ''; // Kosongkan pesan lama
                data.messages.forEach(msg => {
                    const isMine = msg.username === activeUsername;
                    showMessage(msg.username, msg.message, isMine);
                });
            } else {
                alert('Gagal memuat pesan lama: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Fungsi: Perbarui pesan setiap 2 detik
function startRefreshingMessages() {
    setInterval(loadOldMessages, 2000);
}

// Event: Tombol "Masuk Room" diklik
joinButton.addEventListener('click', () => {
    activeUsername = usernameInput.value.trim();
    activeRoomcode = roomcodeInput.value.trim();

    if (!activeUsername || !activeRoomcode) {
        alert('Isi nama dan kode room terlebih dahulu!');
        return;
    }

    // Kirim permintaan ke backend untuk masuk room
    fetch(`${BACKEND_URL}/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: activeUsername, roomcode: activeRoomcode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Tampilkan bagian chat, sembunyikan login
            loginSection.style.display = 'none';
            chatSection.style.display = 'block';
            currentRoom.textContent = activeRoomcode;
            currentUser.textContent = activeUsername;
            
            // Muat pesan lama dan mulai refresh
            loadOldMessages();
            startRefreshingMessages();
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});

// Event: Tombol "Kirim" diklik
sendButton.addEventListener('click', () => {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // Kirim pesan ke backend
    fetch(`${BACKEND_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: activeUsername,
            roomcode: activeRoomcode,
            message: messageText
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageInput.value = ''; // Kosongkan input
        } else {
            alert('Gagal mengirim pesan: ' + data.message);
        }
    })
    .catch(error => console.error('Error:', error));
});

// Event: Tekan "Enter" untuk mengirim pesan
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendButton.click();
});

// Event: Tekan "Enter" untuk masuk room
roomcodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinButton.click();
});
