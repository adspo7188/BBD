document.addEventListener('DOMContentLoaded', async () => {
    // Get current user ID
    let myId = null;
    try {
        const userRes = await fetch('/api/user');
        const userData = await userRes.json();
        if (userData.loggedIn) {
            myId = userData.user.id;
        } else {
            window.location.href = 'logginn.html';
            return;
        }
    } catch (e) {
        console.error(e);
        return;
    }

    loadPotentialMatches();
    loadMyMatches();

    // Initialize Socket.IO
    const socket = io();
    let currentMatchUserId = null;
    let currentMatchUsername = null;

    // Load Potential Matches
    async function loadPotentialMatches() {
        const list = document.getElementById('potential-matches-list');
        try {
            const res = await fetch('/api/users');
            if (res.status === 401) return;
            const users = await res.json();

            list.innerHTML = '';
            if (users.length === 0) {
                list.innerHTML = '<li class="list-group-item text-muted">Ingen nye brukere funnet</li>';
                return;
            }

            users.forEach(user => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';

                const span = document.createElement('span');
                span.textContent = user.username;
                li.appendChild(span);

                const btn = document.createElement('button');
                btn.className = 'btn btn-sm btn-outline-danger match-btn';
                btn.setAttribute('data-id', user.id);
                btn.textContent = 'Match';
                li.appendChild(btn);

                list.appendChild(li);
            });

            // Add event listeners to buttons
            document.querySelectorAll('.match-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const userId = e.target.getAttribute('data-id');
                    await createMatch(userId);
                });
            });

        } catch (err) {
            console.error(err);
            list.innerHTML = '<li class="list-group-item text-danger">Feil ved lasting</li>';
        }
    }

    // Load My Matches
    async function loadMyMatches() {
        const list = document.getElementById('my-matches-list');
        try {
            const res = await fetch('/api/matches');
            if (res.status === 401) return;
            const matches = await res.json();

            list.innerHTML = '';
            if (matches.length === 0) {
                list.innerHTML = '<li class="list-group-item text-muted">Du har ingen matcher ennå</li>';
                return;
            }

            matches.forEach(match => {
                const li = document.createElement('li');
                li.className = 'list-group-item match-list-item';
                li.textContent = match.username;
                li.dataset.userId = match.user_id;
                li.dataset.username = match.username;

                li.addEventListener('click', () => {
                    selectMatch(match.user_id, match.username);

                    // Highlight active
                    document.querySelectorAll('.match-list-item').forEach(item => item.classList.remove('active'));
                    li.classList.add('active');
                });

                list.appendChild(li);
            });

        } catch (err) {
            console.error(err);
            list.innerHTML = '<li class="list-group-item text-danger">Feil ved lasting</li>';
        }
    }

    // Create Match
    async function createMatch(targetUserId) {
        try {
            const res = await fetch('/api/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });

            if (res.ok) {
                loadPotentialMatches();
                loadMyMatches();
            } else {
                const data = await res.json();
                alert(data.error || 'Kunne ikke matche');
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Select Match & Open Chat
    async function selectMatch(userId, username) {
        currentMatchUserId = userId;
        currentMatchUsername = username;

        document.getElementById('chat-header-name').textContent = `Chat med ${username}`;
        document.getElementById('chat-form').classList.remove('d-none');
        const chatBox = document.getElementById('chat-box');
        chatBox.innerHTML = '<div class="text-center text-muted">Laster meldinger...</div>';

        // Join socket room
        socket.emit('join_chat', { otherUserId: userId });

        // Load messages
        await loadMessages(userId);
    }

    // Load Messages
    async function loadMessages(otherUserId) {
        const chatBox = document.getElementById('chat-box');
        try {
            const res = await fetch(`/api/messages/${otherUserId}`);
            const messages = await res.json();

            chatBox.innerHTML = '';
            if (messages.length === 0) {
                chatBox.innerHTML = '<div class="text-center text-muted mt-5">Ingen meldinger ennå. Si hei!</div>';
            } else {
                messages.forEach(msg => {
                    appendMessage(msg);
                });
                scrollToBottom();
            }

        } catch (err) {
            console.error(err);
            chatBox.innerHTML = '<div class="text-danger text-center">Feil ved lasting av meldinger</div>';
        }
    }

    function appendMessage(msg) {
        const chatBox = document.getElementById('chat-box');

        // Remove "no messages" or "loading" placeholder if exists
        const placeholder = chatBox.querySelector('.text-muted.mt-5, .text-center.text-muted');
        if (placeholder) {
             chatBox.removeChild(placeholder);
        }

        const div = document.createElement('div');
        const isSent = msg.sender_id == myId;
        div.className = `message ${isSent ? 'sent' : 'received'}`;
        div.textContent = msg.content;
        chatBox.appendChild(div);
        scrollToBottom();
    }

    function scrollToBottom() {
        const chatBox = document.getElementById('chat-box');
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Send Message
    const chatForm = document.getElementById('chat-form');
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('message-input');
        const message = input.value.trim();

        if (message && currentMatchUserId) {
            socket.emit('send_message', {
                receiverId: currentMatchUserId,
                content: message
            });
            input.value = '';
        }
    });

    // Receive Message
    socket.on('receive_message', (data) => {
        // data has sender_id, receiver_id, content

        // Check if message belongs to current chat
        if ((data.sender_id == myId && data.receiver_id == currentMatchUserId) ||
            (data.sender_id == currentMatchUserId && data.receiver_id == myId)) {
            appendMessage(data);
        }
    });
});
