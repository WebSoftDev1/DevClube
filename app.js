import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAc5DjCnX69_qiZ8zAXFbBx9omv2-yj56s",
  authDomain: "nexuspublic-54c08.firebaseapp.com",
  databaseURL: "https://nexuspublic-54c08-default-rtdb.firebaseio.com",
  projectId: "nexuspublic-54c08",
  storageBucket: "nexuspublic-54c08.firebasestorage.app",
  messagingSenderId: "507605411673",
  appId: "1:507605411673:web:d23accd9dcf8214253ce48"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUserUid = null;

// Elementos da UI
const signupStep = document.getElementById('signup-step');
const usernameStep = document.getElementById('username-step');
const usernameInput = document.getElementById('username');
const usernameMsg = document.getElementById('username-msg');

// 1. Criar conta básica
document.getElementById('btn-next').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUserUid = userCredential.user.uid;
        
        // Troca de tela
        signupStep.classList.add('hidden');
        usernameStep.classList.remove('hidden');
    } catch (error) {
        alert("Erro ao criar conta: " + error.message);
    }
});

// 2. Verificar Username e Finalizar
document.getElementById('btn-finish').addEventListener('click', async () => {
    const username = usernameInput.value.trim().toLowerCase();
    
    if (username.length < 3) {
        usernameMsg.innerHTML = "<span class='error'>Username muito curto!</span>";
        return;
    }

    // Referência no banco: /usernames/nomeescolhido
    const usernameRef = ref(db, 'usernames/' + username);
    const snapshot = await get(usernameRef);

    if (snapshot.exists()) {
        usernameMsg.innerHTML = `<span class='error'>Este nome já está sendo usado.</span><br>Sugestões: `;
        renderSuggestions(username);
    } else {
        // Salva o username e vincula ao UID do usuário
        await set(usernameRef, { uid: currentUserUid });
        await set(ref(db, 'users/' + currentUserUid), {
            username: username,
            createdAt: new Date().toISOString()
        });
        
        alert("Bem-vindo ao DevClube, " + username + "!");
        // Redirecionar para o Feed...
    }
});

// Função para sugerir nomes
function renderSuggestions(baseName) {
    const suggestions = [
        baseName + Math.floor(Math.random() * 100),
        baseName + "_dev",
        "real_" + baseName
    ];

    suggestions.forEach(sug => {
        const span = document.createElement('span');
        span.className = 'suggestion';
        span.innerText = sug;
        span.onclick = () => {
            usernameInput.value = sug;
            usernameMsg.innerHTML = "";
        };
        usernameMsg.appendChild(span);
    });
}
