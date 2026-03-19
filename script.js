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

function salvarProdutos() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function salvarHistorico() {
  localStorage.setItem("historicoEstoque", JSON.stringify(historico));
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterStatus(quantidade) {
  if (quantidade === 0) {
    return '<span class="status zerado">Sem estoque</span>';
  }
  if (quantidade <= 5) {
    return '<span class="status baixo">Baixo</span>';
  }
  return '<span class="status ok">OK</span>';
}

function mostrarToast(mensagem, tipo = "success") {
  toast.textContent = mensagem;
  toast.className = `toast show ${tipo}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2500);
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
  const produto = produtos[index];

  editIndex.value = index;
  editNome.value = produto.nome;
  editQuantidade.value = produto.quantidade;
  editValor.value = produto.valor;
  editMovimentacao.value = produto.movimentacao || "Ajuste";

  modalEditar.style.display = "flex";
}

function fecharModalEdicao() {
  modalEditar.style.display = "none";
}

function atualizarResumo() {
  const totalProdutos = produtos.length;
  const totalItens = produtos.reduce((acc, produto) => acc + produto.quantidade, 0);
  const valorTotal = produtos.reduce(
    (acc, produto) => acc + (produto.quantidade * produto.valor),
    0
  );

  totalProdutosEl.textContent = totalProdutos;
  totalItensEl.textContent = totalItens;
  valorTotalEl.textContent = formatarMoeda(valorTotal);
}

function obterProdutosFiltrados() {
  const termo = buscaInput.value.trim().toLowerCase();
  const ordenacao = ordenacaoSelect.value;

  let lista = [...produtos];

  if (termo) {
    lista = lista.filter((produto) =>
      produto.nome.toLowerCase().includes(termo)
    );
  }

  lista.sort((a, b) => {
    switch (ordenacao) {
      case "nome-asc":
        return a.nome.localeCompare(b.nome);
      case "nome-desc":
        return b.nome.localeCompare(a.nome);
      case "quantidade-desc":
        return b.quantidade - a.quantidade;
      case "quantidade-asc":
        return a.quantidade - b.quantidade;
      case "valor-desc":
        return b.valor - a.valor;
      case "valor-asc":
        return a.valor - b.valor;
      default:
        return 0;
    }
  });

  return lista;
}

function renderizarProdutos() {
  const lista = obterProdutosFiltrados();

  if (lista.length === 0) {
    listaProdutosEl.innerHTML = `
      <tr>
        <td colspan="7" class="vazio">Nenhum produto encontrado.</td>
      </tr>
    `;
    return;
  }

  listaProdutosEl.innerHTML = lista
    .map((produto) => {
      const indexOriginal = produtos.findIndex((p) => p.id === produto.id);
      const total = produto.quantidade * produto.valor;

      return `
        <tr>
          <td>${produto.nome}</td>
          <td>${produto.quantidade}</td>
          <td>${formatarMoeda(produto.valor)}</td>
          <td>${formatarMoeda(total)}</td>
          <td>${obterStatus(produto.quantidade)}</td>
          <td>${produto.movimentacao || "Ajuste"}</td>
          <td class="acoes">
            <button class="btn-warning" onclick="abrirModalEdicao(${indexOriginal})">Editar</button>
            <button class="btn-danger" onclick="excluirProduto(${indexOriginal})">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderizarHistorico() {
  if (historico.length === 0) {
    listaHistoricoEl.innerHTML = `<li class="vazio">Nenhuma movimentação registrada.</li>`;
    return;
  }

  listaHistoricoEl.innerHTML = historico
    .map((item) => {
      return `
        <li>
          <strong>${item.data}</strong> — ${item.tipo}: 
          <strong>${item.produto}</strong> | Quantidade: ${item.quantidade}
          ${item.valor !== undefined ? `| Valor: ${formatarMoeda(item.valor)}` : ""}
        </li>
      `;
    })
    .join("");
}

function atualizarGraficos() {
  const labels = produtos.map((produto) => produto.nome);
  const quantidades = produtos.map((produto) => produto.quantidade);
  const valoresTotais = produtos.map((produto) => produto.quantidade * produto.valor);

  const ctxQuantidade = document.getElementById("graficoQuantidade").getContext("2d");
  const ctxValor = document.getElementById("graficoValor").getContext("2d");

  if (graficoQuantidade) graficoQuantidade.destroy();
  if (graficoValor) graficoValor.destroy();

  graficoQuantidade = new Chart(ctxQuantidade, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantidade",
        data: quantidades,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#cbd5e1"
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,0.08)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#cbd5e1" },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });

  graficoValor = new Chart(ctxValor, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Valor",
        data: valoresTotais,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#cbd5e1"
          }
        }
      }
    }
  });
}

function adicionarHistorico(tipo, produto) {
  historico.unshift({
    data: new Date().toLocaleString("pt-BR"),
    tipo,
    produto: produto.nome,
    quantidade: produto.quantidade,
    valor: produto.valor
  });

  salvarHistorico();
  renderizarHistorico();
}

formProduto.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const quantidade = Number(quantidadeInput.value);
  const valor = Number(valorInput.value);
  const movimentacao = movimentacaoInput.value;

  if (!nome || isNaN(quantidade) || isNaN(valor) || quantidade < 0 || valor < 0) {
    mostrarToast("Preencha todos os campos corretamente.", "error");
    return;
  }

  const novoProduto = {
    id: Date.now(),
    nome,
    quantidade,
    valor,
    movimentacao
  };

  produtos.push(novoProduto);
  salvarProdutos();
  adicionarHistorico("Produto adicionado", novoProduto);

  formProduto.reset();
  movimentacaoInput.value = "Entrada";

  renderizarProdutos();
  atualizarResumo();
  atualizarGraficos();
  mostrarToast("Produto adicionado com sucesso!", "success");
});

btnSalvarEdicao.addEventListener("click", () => {
  const index = Number(editIndex.value);
  const nome = editNome.value.trim();
  const quantidade = Number(editQuantidade.value);
  const valor = Number(editValor.value);
  const movimentacao = editMovimentacao.value;

  if (!nome || isNaN(quantidade) || isNaN(valor) || quantidade < 0 || valor < 0) {
    mostrarToast("Preencha os dados corretamente.", "error");
    return;
  }

  produtos[index] = {
    ...produtos[index],
    nome,
    quantidade,
    valor,
    movimentacao
  };

  salvarProdutos();
  adicionarHistorico("Produto editado", produtos[index]);

  fecharModalEdicao();
  renderizarProdutos();
  atualizarResumo();
  atualizarGraficos();
  mostrarToast("Produto atualizado com sucesso!", "success");
});

function excluirProduto(index) {
  abrirConfirmacao(
    "Excluir produto",
    "Tem certeza que deseja remover este produto do estoque?",
    () => {
      const removido = produtos[index];
      produtos.splice(index, 1);
      salvarProdutos();
      adicionarHistorico("Produto removido", removido);
      renderizarProdutos();
      atualizarResumo();
      atualizarGraficos();
      mostrarToast("Produto removido com sucesso!", "warning");
    }
  );
}

btnLimparEstoque.addEventListener("click", () => {
  if (produtos.length === 0) {
    mostrarToast("O estoque já está vazio.", "error");
    return;
  }

  abrirConfirmacao(
    "Limpar estoque",
    "Essa ação vai remover todos os produtos cadastrados. Deseja continuar?",
    () => {
      produtos = [];
      salvarProdutos();
      renderizarProdutos();
      atualizarResumo();
      atualizarGraficos();
      mostrarToast("Estoque limpo com sucesso!", "warning");
    }
  );
});

btnExportarCSV.addEventListener("click", () => {
  if (historico.length === 0) {
    mostrarToast("Não há histórico para exportar.", "error");
    return;
  }

  const cabecalho = "Data,Tipo,Produto,Quantidade,Valor\n";
  const linhas = historico.map((item) => {
    const data = `"${item.data}"`;
    const tipo = `"${item.tipo}"`;
    const produto = `"${item.produto}"`;
    const quantidade = item.quantidade;
    const valor = item.valor ?? 0;
    return `${data},${tipo},${produto},${quantidade},${valor}`;
  });

  const csv = cabecalho + linhas.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "historico_estoque.csv";
  link.click();

  URL.revokeObjectURL(url);
  mostrarToast("Histórico exportado com sucesso!", "success");
});

btnApagarHistorico.addEventListener("click", () => {
  if (historico.length === 0) {
    mostrarToast("O histórico já está vazio.", "error");
    return;
  }

  abrirConfirmacao(
    "Apagar histórico",
    "Deseja apagar todo o histórico de movimentações?",
    () => {
      historico = [];
      salvarHistorico();
      renderizarHistorico();
      mostrarToast("Histórico apagado com sucesso!", "warning");
    }
  );
});

buscaInput.addEventListener("input", renderizarProdutos);
ordenacaoSelect.addEventListener("change", renderizarProdutos);

btnCancelarEdicao.addEventListener("click", fecharModalEdicao);

modalEditar.addEventListener("click", (e) => {
  if (e.target === modalEditar) {
    fecharModalEdicao();
  }
});

btnCancelarAcao.addEventListener("click", fecharConfirmacao);

btnConfirmarAcao.addEventListener("click", () => {
  if (acaoConfirmada) {
    acaoConfirmada();
  }
  fecharConfirmacao();
});

modalConfirmacao.addEventListener("click", (e) => {
  if (e.target === modalConfirmacao) {
    fecharConfirmacao();
  }
});

window.abrirModalEdicao = abrirModalEdicao;
window.excluirProduto = excluirProduto;

renderizarProdutos();
renderizarHistorico();
atualizarResumo();
atualizarGraficos();
