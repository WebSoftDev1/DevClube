import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getDatabase, ref, get, set } from "firebase/database";

// Configuração do seu Firebase
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

// Elementos da Interface (DOM)
const signupStep = document.getElementById('signup-step');
const usernameStep = document.getElementById('username-step');
const usernameInput = document.getElementById('username');
const usernameMsg = document.getElementById('username-msg');

// ========================================================
// VERIFICAÇÃO AUTOMÁTICA DE LOGIN (O QUE ESTAVA FALTANDO)
// ========================================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUid = user.uid;
        
        // Verifica se esse UID já possui um username definido no banco
        const userRef = ref(db, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            // Usuário já está totalmente cadastrado -> Manda direto para a home
            window.location.href = "home.html";
        } else {
            // Logado, mas falta definir o username -> Mostra a segunda etapa
            signupStep.classList.add('hidden');
            usernameStep.classList.remove('hidden');
        }
    }
});

// ========================================================
// PASSO 1: CRIAR CONTA COM E-MAIL E SENHA
// ========================================================
document.getElementById('btn-next').addEventListener('click', async () => {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert("Por favor, preencha todos os campos!");
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        currentUserUid = userCredential.user.uid;
        
        // Esconde o form de e-mail e mostra o de username
        signupStep.classList.add('hidden');
        usernameStep.classList.remove('hidden');
    } catch (error) {
        alert("Erro ao criar conta: " + error.message);
    }
});

// ========================================================
// PASSO 2: VALIDAR USERNAME, SALVAR NO BANCO E REDIRECIONAR
// ========================================================
document.getElementById('btn-finish').addEventListener('click', async () => {
    const username = usernameInput.value.trim().toLowerCase();
    
    if (username.length < 3) {
        usernameMsg.innerHTML = "<span class='error'>O username deve ter pelo menos 3 caracteres!</span>";
        return;
    }

    // Referência para checar se o username exato já foi pego por outra pessoa
    const usernameRef = ref(db, 'usernames/' + username);
    const snapshot = await get(usernameRef);

    if (snapshot.exists()) {
        // Se o nó já existir, bloqueia e gera as opções alternativas
        usernameMsg.innerHTML = `<span class='error'>Este nome já está sendo usado.</span><br>Sugestões: `;
        renderSuggestions(username);
    } else {
        try {
            // 1. Cria a chave com o username para travar o nome no banco
            await set(usernameRef, { uid: currentUserUid });
            
            // 2. Salva a relação no perfil do usuário
            await set(ref(db, 'users/' + currentUserUid), {
                username: username,
                createdAt: new Date().toISOString()
            });
            
            // 3. Redireciona o usuário para a tela principal do DevClube
            window.location.href = "home.html";
            
        } catch (error) {
            alert("Erro ao salvar os dados do perfil: " + error.message);
        }
    }
});

// ========================================================
// SISTEMA DE SUGESTÕES DE USERNAME
// ========================================================
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
