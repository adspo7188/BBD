document.addEventListener('DOMContentLoaded', () => {
    // Registration Logic
    const registerForm = document.getElementById('registration-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password2').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const email = document.getElementById('epost').value;
            const errorDiv = document.getElementById('password-error');

            if (password !== passwordConfirm) {
                if(errorDiv) {
                    errorDiv.classList.remove('d-none');
                    errorDiv.textContent = "Passordene må være identiske.";
                } else {
                    alert("Passordene må være identiske.");
                }
                return;
            } else {
                 if(errorDiv) errorDiv.classList.add('d-none');
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, email, phoneNumber })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Registrering vellykket! Du kan nå logge inn.');
                    window.location.href = 'logginn.html';
                } else {
                    alert('Feil: ' + (data.error || 'Kunne ikke registrere bruker.'));
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Noe gikk galt. Prøv igjen senere.');
            }
        });
    }

    // Login Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('Logg inn vellykket! Velkommen, ' + data.user.username);
                    window.location.href = 'index.html';
                } else {
                    alert('Feil: ' + (data.error || 'Kunne ikke logge inn.'));
                }
            } catch (err) {
                console.error('Error:', err);
                alert('Noe gikk galt under innlogging.');
            }
        });
    }
});
