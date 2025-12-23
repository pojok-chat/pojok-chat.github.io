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

// --- GANTI DENGAN URL BACKEND HEROKU ANDA NANTI! ---
const BACKEND_URL = 'https://nama-aplikasi-heroku-anda.herokuapp.com';
let activeUsername = '';
let activeRoomcode = '';

// Fungsi: Tampilkan pesan di layar
function showMessage(user, text, isMine = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMine ? 'my-message' : 'other-message');
    messageDiv.innerHTML = `<div class="user">${user}</div><div class="text">${text}</div>`;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi: Muat pesan lama dari database
function loadOldMessages() {
    fetch(`${BACKEND_URL}/get-messages?roomcode=${activeRoomcode}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                chatMessages.innerHTML = '';
                data.messages.forEach(msg => {
                    const isMine = msg.username === activeUsername;
                    showMessage(msg.username, msg.message, isMine);
                });
            }
        })
        .catch(err => console.error('Error muat pesan:', err));
}

// Fungsi: Refresh pesan setiap 2 detik
function startRefreshing() {
    setInterval(loadOldMessages, 2000);
}

// Event: Masuk Room
joinButton.addEventListener('click', () => {
    activeUsername = usernameInput.value.trim();
    activeRoomcode = roomcodeInput.value.trim();

    if (!activeUsername || !activeRoomcode) {
        alert('Isi nama dan kode room!');
        return;
    }

    // Kirim permintaan ke backend
    fetch(`${BACKEND_URL}/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: activeUsername, roomcode: activeRoomcode })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            loginSection.style.display = 'none';
            chatSection.style.display = 'block';
            currentRoom.textContent = activeRoomcode;
            currentUser.textContent = activeUsername;
            loadOldMessages();
            startRefreshing();
        } else {
            alert(data.message);
        }
    })
    .catch(err => console.error('Error masuk room:', err));
});

// Event: Kirim Pesan
sendButton.addEventListener('click', () => {
    const text = messageInput.value.trim();
    if (!text) return;

    fetch(`${BACKEND_URL}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: activeUsername,
            roomcode: activeRoomcode,
            message: text
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) messageInput.value = '';
        else alert('Gagal kirim pesan!');
    })
    .catch(err => console.error('Error kirim pesan:', err));
});

// Event: Tekan Enter untuk masuk/kirim
roomcodeInput.addEventListener('keypress', e => e.key === 'Enter' && joinButton.click());
messageInput.addEventListener('keypress', e => e.key === 'Enter' && sendButton.click());
