document.addEventListener("DOMContentLoaded", () => {
  let produtos = JSON.parse(localStorage.getItem("produtos")) || [];
  let historico = JSON.parse(localStorage.getItem("historicoEstoque")) || [];

  let graficoQuantidade = null;
  let graficoValor = null;
  let acaoConfirmada = null;

  const formProduto = document.getElementById("formProduto");
  const nomeInput = document.getElementById("nome");
  const quantidadeInput = document.getElementById("quantidade");
  const valorInput = document.getElementById("valor");
  const movimentacaoInput = document.getElementById("movimentacao");
  const buscaInput = document.getElementById("busca");
  const ordenacaoSelect = document.getElementById("ordenacao");

  const totalProdutosEl = document.getElementById("totalProdutos");
  const totalItensEl = document.getElementById("totalItens");
  const valorTotalEl = document.getElementById("valorTotal");
  const listaProdutosEl = document.getElementById("listaProdutos");
  const listaHistoricoEl = document.getElementById("listaHistorico");

  const btnLimparEstoque = document.getElementById("btnLimparEstoque");
  const btnExportarCSV = document.getElementById("btnExportarCSV");
  const btnApagarHistorico = document.getElementById("btnApagarHistorico");

  const modalEditar = document.getElementById("modalEditar");
  const editIndex = document.getElementById("editIndex");
  const editNome = document.getElementById("editNome");
  const editQuantidade = document.getElementById("editQuantidade");
  const editValor = document.getElementById("editValor");
  const editMovimentacao = document.getElementById("editMovimentacao");
  const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");
  const btnSalvarEdicao = document.getElementById("btnSalvarEdicao");

  const modalConfirmacao = document.getElementById("modalConfirmacao");
  const modalTitulo = document.getElementById("modalTitulo");
  const modalMensagem = document.getElementById("modalMensagem");
  const btnCancelarAcao = document.getElementById("btnCancelarAcao");
  const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");

  const toast = document.getElementById("toast");

  const canvasQuantidade = document.getElementById("graficoQuantidade");
  const canvasValor = document.getElementById("graficoValor");

  const btnTema = document.getElementById("btnTema");

  // ================== TEMA ==================
  const temaSalvo = localStorage.getItem("tema");

  if (temaSalvo === "light") {
    document.body.classList.add("light");
  }

  function atualizarTextoTema() {
    if (!btnTema) return;

    if (document.body.classList.contains("light")) {
      btnTema.textContent = "☀️ Tema claro";
    } else {
      btnTema.textContent = "🌙 Tema escuro";
    }
  }

  if (btnTema) {
    atualizarTextoTema();

    btnTema.addEventListener("click", () => {
      document.body.classList.toggle("light");

      const temaAtual = document.body.classList.contains("light") ? "light" : "dark";
      localStorage.setItem("tema", temaAtual);

      atualizarTextoTema();
      atualizarGraficos();
    });
  }

  // ================== FUNÇÕES ==================
  function salvarProdutos() {
    localStorage.setItem("produtos", JSON.stringify(produtos));
  }

  function salvarHistorico() {
    localStorage.setItem("historicoEstoque", JSON.stringify(historico));
  }

  function formatarMoeda(valor) {
    return Number(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function obterStatus(qtd) {
    if (qtd === 0) return '<span class="status zerado">Sem estoque</span>';
    if (qtd <= 5) return '<span class="status baixo">Baixo</span>';
    return '<span class="status ok">OK</span>';
  }

  function mostrarToast(msg, tipo = "success") {
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast show ${tipo}`;
    setTimeout(() => (toast.className = "toast"), 2500);
  }

  function abrirConfirmacao(titulo, mensagem, callback) {
    modalTitulo.textContent = titulo;
    modalMensagem.textContent = mensagem;
    modalConfirmacao.style.display = "flex";
    acaoConfirmada = callback;
  }

  function fecharConfirmacao() {
    modalConfirmacao.style.display = "none";
    acaoConfirmada = null;
  }

  function abrirModalEdicao(index) {
    const p = produtos[index];
    editIndex.value = index;
    editNome.value = p.nome;
    editQuantidade.value = p.quantidade;
    editValor.value = p.valor;
    editMovimentacao.value = p.movimentacao;
    modalEditar.style.display = "flex";
  }

  function fecharModalEdicao() {
    modalEditar.style.display = "none";
  }

  function atualizarResumo() {
    totalProdutosEl.textContent = produtos.length;
    totalItensEl.textContent = produtos.reduce((a, p) => a + p.quantidade, 0);
    valorTotalEl.textContent = formatarMoeda(
      produtos.reduce((a, p) => a + p.quantidade * p.valor, 0)
    );
  }

  function renderizarProdutos() {
    if (!listaProdutosEl) return;

    listaProdutosEl.innerHTML = produtos.map((p, i) => {
      return `
        <tr>
          <td>${p.nome}</td>
          <td>${p.quantidade}</td>
          <td>${formatarMoeda(p.valor)}</td>
          <td>${formatarMoeda(p.quantidade * p.valor)}</td>
          <td>${obterStatus(p.quantidade)}</td>
          <td>${p.movimentacao}</td>
          <td class="acoes">
            <button class="btn-warning" onclick="abrirModalEdicao(${i})">Editar</button>
            <button class="btn-danger" onclick="excluirProduto(${i})">Excluir</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderizarHistorico() {
    if (!listaHistoricoEl) return;

    if (!historico.length) {
      listaHistoricoEl.innerHTML = `<li class="vazio">Sem histórico</li>`;
      return;
    }

    listaHistoricoEl.innerHTML = historico.map(h => `
      <li><strong>${h.data}</strong> - ${h.tipo}: ${h.produto}</li>
    `).join("");
  }

  function atualizarGraficos() {
    if (!canvasQuantidade || !canvasValor) return;

    const cor = document.body.classList.contains("light") ? "#334155" : "#cbd5e1";

    if (graficoQuantidade) graficoQuantidade.destroy();
    if (graficoValor) graficoValor.destroy();

    graficoQuantidade = new Chart(canvasQuantidade, {
      type: "bar",
      data: {
        labels: produtos.map(p => p.nome),
        datasets: [{
          label: "Qtd",
          data: produtos.map(p => p.quantidade)
        }]
      },
      options: {
        plugins: { legend: { labels: { color: cor } } }
      }
    });

    graficoValor = new Chart(canvasValor, {
      type: "doughnut",
      data: {
        labels: produtos.map(p => p.nome),
        datasets: [{
          data: produtos.map(p => p.quantidade * p.valor)
        }]
      },
      options: {
        plugins: { legend: { labels: { color: cor } } }
      }
    });
  }

  function adicionarHistorico(tipo, p) {
    historico.unshift({
      data: new Date().toLocaleString("pt-BR"),
      tipo,
      produto: p.nome
    });
    salvarHistorico();
    renderizarHistorico();
  }

  // ================== EVENTOS ==================
  formProduto.addEventListener("submit", e => {
    e.preventDefault();

    const novo = {
      nome: nomeInput.value,
      quantidade: Number(quantidadeInput.value),
      valor: Number(valorInput.value),
      movimentacao: movimentacaoInput.value
    };

    produtos.push(novo);
    salvarProdutos();
    adicionarHistorico("Adicionado", novo);

    formProduto.reset();
    renderizarProdutos();
    atualizarResumo();
    atualizarGraficos();

    mostrarToast("Produto adicionado!");
  });

  btnSalvarEdicao.addEventListener("click", () => {
    const i = Number(editIndex.value);

    produtos[i] = {
      nome: editNome.value,
      quantidade: Number(editQuantidade.value),
      valor: Number(editValor.value),
      movimentacao: editMovimentacao.value
    };

    salvarProdutos();
    fecharModalEdicao();
    renderizarProdutos();
    atualizarResumo();
    atualizarGraficos();

    mostrarToast("Produto atualizado!");
  });

  window.excluirProduto = function (i) {
    abrirConfirmacao("Excluir", "Tem certeza?", () => {
      produtos.splice(i, 1);
      salvarProdutos();
      renderizarProdutos();
      atualizarResumo();
      atualizarGraficos();
      mostrarToast("Removido!");
    });
  };

  btnLimparEstoque.addEventListener("click", () => {
    abrirConfirmacao("Limpar", "Apagar tudo?", () => {
      produtos = [];
      salvarProdutos();
      renderizarProdutos();
      atualizarResumo();
      atualizarGraficos();
    });
  });

  btnCancelarEdicao.addEventListener("click", fecharModalEdicao);
  btnCancelarAcao.addEventListener("click", fecharConfirmacao);

  btnConfirmarAcao.addEventListener("click", () => {
    if (acaoConfirmada) acaoConfirmada();
    fecharConfirmacao();
  });

  // INIT
  renderizarProdutos();
  renderizarHistorico();
  atualizarResumo();
  atualizarGraficos();
});
