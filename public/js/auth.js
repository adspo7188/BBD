// auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Login Form
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            const username = usernameInput.value;
            const password = passwordInput.value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    window.location.href = 'index.html'; // Redirect to home or dashboard
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Registration Form
    const registerForm = document.querySelector('form[action="/register"]');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const password2Input = document.getElementById('password2');
            const phoneInput = document.getElementById('phoneNumber');
            const emailInput = document.getElementById('epost');
            const passwordError = document.getElementById('password-error');

            const username = usernameInput.value;
            const password = passwordInput.value;
            const passwordConfirm = password2Input.value;
            const phone = phoneInput.value;
            const email = emailInput.value;

            // Basic client-side validation
            if (password !== passwordConfirm) {
                 if (passwordError) passwordError.classList.remove('d-none');
                 return;
            } else {
                 if (passwordError) passwordError.classList.add('d-none');
            }

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password, email, phone })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registrering vellykket! Du kan nå logge inn.');
                    window.location.href = 'logginn.html';
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Check login status and update UI (e.g. show Logout button)
    checkLoginStatus();
});

async function checkLoginStatus() {
    try {
        const response = await fetch('/api/user');
        const data = await response.json();

        const navList = document.querySelector('.navbar-nav');

        if (data.loggedIn) {
            // Remove Login/Register links
            const loginLink = document.querySelector('a[href="logginn.html"]');
            const registerLink = document.querySelector('a[href="registrering.html"]');

            if (loginLink && loginLink.parentElement) loginLink.parentElement.remove();
            if (registerLink && registerLink.parentElement) registerLink.parentElement.remove();

            // Add Matches link
            const matchesItem = document.createElement('li');
            matchesItem.className = 'nav-item';
            matchesItem.innerHTML = '<a class="nav-link" href="matches.html">Matcher</a>';

            // Insert before search or at end
            const searchItem = document.querySelector('.navbar-search-item');

            // We need to be careful with insertion to keep layout
            if (navList) {
                if (searchItem) {
                    // searchItem is inside an li with class 'nav-item navbar-search-item'
                    // actually the searchItem in querySelector is li.nav-item.navbar-search-item
                    navList.insertBefore(matchesItem, searchItem);
                } else {
                    navList.appendChild(matchesItem);
                }

                // Add Logout link
                const logoutItem = document.createElement('li');
                logoutItem.className = 'nav-item';
                logoutItem.innerHTML = '<a class="nav-link" href="#" id="logoutBtn">Logg ut</a>';
                navList.appendChild(logoutItem);

                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await fetch('/logout');
                        window.location.reload();
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}
