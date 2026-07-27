import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const usuario = document.getElementById("usuario");
const creditos = document.getElementById("creditos");
const lista = document.getElementById("listaAgendamentos");
const logout = document.getElementById("logout");

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        location.href = "login.html";
        return;
    }

    usuario.textContent = "Logado como: " + user.email;

    // Busca os créditos
    try {

        const referencia = doc(db, "usuarios", user.uid);
        const dados = await getDoc(referencia);

        if (dados.exists()) {
            creditos.textContent = dados.data().Creditos ?? 0;
        } else {
            creditos.textContent = 0;
        }

    } catch (erro) {

        console.error("Erro ao carregar créditos:", erro);
        creditos.textContent = 0;

    }

    const busca = query(
        collection(db, "agendamentos"),
        where("parceiro", "==", user.email)
    );

    onSnapshot(busca, (resultado) => {

        lista.innerHTML = "";

        if (resultado.empty) {
            lista.innerHTML = "Nenhum agendamento cadastrado.";
            return;
        }

        // Ordena do horário mais cedo para o mais tarde
        const documentos = resultado.docs.sort((a, b) => {
            return new Date(a.data().horario) - new Date(b.data().horario);
        });

        documentos.forEach((documento) => {

            const agendamento = documento.data();

            let emoji = "📋";

            switch (agendamento.status) {

                case "pendente":
                    emoji = "🟡";
                    break;

                case "em andamento":
                    emoji = "🔒";
                    break;

                case "concluido":
                    emoji = "🟢";
                    break;

                case "cancelado":
                    emoji = "❌";
                    break;

            }

            lista.innerHTML += `

<div class="agendamento">

<h3 class="titulo" data-id="${documento.id}">
    <span class="seta">▶</span>
    ${emoji} ${agendamento.empresa} - ${agendamento.horario}
</h3>

<div class="conteudo" id="agendamento-${documento.id}" style="display:none;">

<p>
<strong>Quantidade:</strong>
${agendamento.quantidade}
</p>

<p>
<strong>Horário:</strong>
${agendamento.horario}
</p>

<p>
<strong>Mensagem:</strong>
${agendamento.texto}
</p>

<p>
<strong>Números:</strong><br>
${agendamento.numeros?.join("<br>") || "Nenhum número"}
</p>

<p>
<strong>Status:</strong>
${agendamento.status}
</p>

<p>
<strong>Anexos:</strong><br>

${agendamento.arquivo
? `<a href="${agendamento.arquivo}" target="_blank">📄 Arquivo</a><br>`
: ""}

${agendamento.imagem
? `<a href="${agendamento.imagem}" target="_blank">🖼️ Imagem</a><br>`
: ""}

${agendamento.comprovante
? `<a href="${agendamento.comprovante}" target="_blank">💳 Comprovante</a>`
: ""}

</p>

<button class="excluir" data-id="${documento.id}">
Excluir disparo
</button>

</div>

<hr>

`;

        });

        // Expandir/Recolher
        document.querySelectorAll(".titulo").forEach((titulo) => {

          titulo.onclick = () => {

                const conteudo = document.getElementById(
                    "agendamento-" + titulo.dataset.id
                );

                const seta = titulo.querySelector(".seta");

                if (conteudo.style.display === "none") {

                    conteudo.style.display = "block";
                    seta.textContent = "▼";

                } else {

                    conteudo.style.display = "none";
                    seta.textContent = "▶";

                }

            };

        });

        // Excluir
        document.querySelectorAll(".excluir").forEach((botao) => {

            botao.onclick = async () => {

                if (!confirm("Deseja realmente excluir este disparo?")) return;

                try {

                    await deleteDoc(
                        doc(db, "agendamentos", botao.dataset.id)
                    );

                    alert("Disparo excluído!");

                } catch (erro) {

                    console.error(erro);
                    alert("Erro ao excluir.");

                }

            };

        });

    });

});

logout.addEventListener("click", async () => {

    await signOut(auth);
    location.href = "index.html";

});
