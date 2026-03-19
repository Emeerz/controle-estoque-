const STORAGE_PRODUCTS = "mercado_stock_produtos";
const STORAGE_HISTORY = "mercado_stock_historico";
const STORAGE_LOGIN = "mercado_stock_logado";

let produtos = [];
let historico = [];
let graficoQuantidade = null;
let graficoValor = null;

const loadingScreen = document.getElementById("loadingScreen");
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

const productForm = document.getElementById("productForm");
const appMessage = document.getElementById("appMessage");

const nomeInput = document.getElementById("nome");
const categoriaInput = document.getElementById("categoria");
const quantidadeInput = document.getElementById("quantidade");
const valorInput = document.getElementById("valor");
const codigoInput = document.getElementById("codigo");
const estoqueMinimoInput = document.getElementById("estoqueMinimo");

const productTableBody = document.getElementById("productTableBody");
const historicoLista = document.getElementById("historicoLista");

const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const totalProdutosEl = document.getElementById("totalProdutos");
const totalQuantidadeEl = document.getElementById("totalQuantidade");
const valorTotalEl = document.getElementById("valorTotal");
const baixoEstoqueEl = document.getElementById("baixoEstoque");

const statProdutos = document.getElementById("statProdutos");
const statQuantidade = document.getElementById("statQuantidade");
const statValor = document.getElementById("statValor");
const statBaixoEstoque = document.getElementById("statBaixoEstoque");

const btnExportCsv = document.getElementById("btnExportCsv");
const csvFile = document.getElementById("csvFile");
const btnLimparTudo = document.getElementById("btnLimparTudo");

const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");

const editIndexInput = document.getElementById("editIndex");
const editNomeInput = document.getElementById("editNome");
const editCategoriaInput = document.getElementById("editCategoria");
const editQuantidadeInput = document.getElementById("editQuantidade");
const editValorInput = document.getElementById("editValor");
const editCodigoInput = document.getElementById("editCodigo");
const editEstoqueMinimoInput = document.getElementById("editEstoqueMinimo");

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function mostrarMensagem(elemento, texto, cor = "#64748b") {
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = cor;

  setTimeout(function () {
    if (elemento.textContent === texto) {
      elemento.textContent = "";
    }
  }, 3000);
}

function salvarProdutos() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(produtos));
}

function carregarProdutos() {
  const dados = localStorage.getItem(STORAGE_PRODUCTS);
  produtos = dados ? JSON.parse(dados) : [];
}

function salvarHistorico() {
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(historico));
}

function carregarHistorico() {
  const dados = localStorage.getItem(STORAGE_HISTORY);
  historico = dados ? JSON.parse(dados) : [];
}

function registrarHistorico(acao, produto) {
  const data = new Date();
  const registro = {
    acao: acao,
    produto: produto.nome,
    categoria: produto.categoria,
    quantidade: produto.quantidade,
    valor: produto.valor,
    codigo: produto.codigo,
    data: data.toLocaleString("pt-BR")
  };

  historico.unshift(registro);

  if (historico.length > 30) {
    historico = historico.slice(0, 30);
  }

  salvarHistorico();
  renderizarHistorico();
}

function carregarSistema() {
  carregarProdutos();
  carregarHistorico();
  atualizarTudo();
}

function atualizarTudo() {
  renderizarTabela();
  atualizarResumo();
  renderizarHistorico();
  atualizarGraficos();
}

function contarBaixoEstoque() {
  let total = 0;

  for (let i = 0; i < produtos.length; i++) {
    if (Number(produtos[i].quantidade) <= Number(produtos[i].estoqueMinimo)) {
      total++;
    }
  }

  return total;
}

function atualizarResumo() {
  const totalProdutos = produtos.length;

  let totalQuantidade = 0;
  let valorTotal = 0;

  for (let i = 0; i < produtos.length; i++) {
    totalQuantidade += Number(produtos[i].quantidade);
    valorTotal += Number(produtos[i].quantidade) * Number(produtos[i].valor);
  }

  const baixoEstoque = contarBaixoEstoque();

  totalProdutosEl.textContent = totalProdutos;
  totalQuantidadeEl.textContent = totalQuantidade;
  valorTotalEl.textContent = formatarMoeda(valorTotal);
  baixoEstoqueEl.textContent = baixoEstoque;

  statProdutos.textContent = totalProdutos;
  statQuantidade.textContent = totalQuantidade;
  statValor.textContent = formatarMoeda(valorTotal);
  statBaixoEstoque.textContent = baixoEstoque;
}

function obterProdutosFiltradosOrdenados() {
  const termo = searchInput.value.trim().toLowerCase();
  const tipoOrdenacao = sortSelect.value;

  const lista = produtos.filter(function (produto) {
    return (
      produto.nome.toLowerCase().includes(termo) ||
      produto.categoria.toLowerCase().includes(termo) ||
      produto.codigo.toLowerCase().includes(termo)
    );
  });

  lista.sort(function (a, b) {
    if (tipoOrdenacao === "quantidade") {
      return Number(b.quantidade) - Number(a.quantidade);
    }

    if (tipoOrdenacao === "valor") {
      return Number(b.valor) - Number(a.valor);
    }

    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  return lista;
}

function renderizarTabela() {
  productTableBody.innerHTML = "";

  const lista = obterProdutosFiltradosOrdenados();

  if (lista.length === 0) {
    productTableBody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">Nenhum produto encontrado.</td>
      </tr>
    `;
    return;
  }

  for (let i = 0; i < lista.length; i++) {
    const produto = lista[i];
    const indexReal = produtos.findIndex(function (item) {
      return item.id === produto.id;
    });

    const baixo = Number(produto.quantidade) <= Number(produto.estoqueMinimo);
    const statusClass = baixo ? "low" : "ok";
    const statusText = baixo ? "Baixo estoque" : "OK";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.categoria}</td>
      <td>${produto.codigo}</td>
      <td>${produto.quantidade}</td>
      <td>${formatarMoeda(produto.valor)}</td>
      <td>${formatarMoeda(Number(produto.quantidade) * Number(produto.valor))}</td>
      <td>${produto.estoqueMinimo}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary" onclick="abrirModalEdicao(${indexReal})">Editar</button>
          <button class="btn btn-danger" onclick="excluirProduto(${indexReal})">Excluir</button>
        </div>
      </td>
    `;

    productTableBody.appendChild(tr);
  }
}

function renderizarHistorico() {
  historicoLista.innerHTML = "";

  if (historico.length === 0) {
    historicoLista.innerHTML = `<div class="empty-state">Nenhuma movimentação registrada ainda.</div>`;
    return;
  }

  for (let i = 0; i < historico.length; i++) {
    const item = historico[i];
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <strong>${item.acao}: ${item.produto}</strong>
      <span>Categoria: ${item.categoria} | Quantidade: ${item.quantidade} | Valor: ${formatarMoeda(item.valor)} | Código: ${item.codigo} | Data: ${item.data}</span>
    `;
    historicoLista.appendChild(div);
  }
}

function atualizarGraficos() {
  const labels = produtos.map(function (produto) {
    return produto.nome;
  });

  const dadosQuantidade = produtos.map(function (produto) {
    return Number(produto.quantidade);
  });

  const dadosValor = produtos.map(function (produto) {
    return Number(produto.quantidade) * Number(produto.valor);
  });

  const ctxQuantidade = document.getElementById("graficoQuantidade");
  const ctxValor = document.getElementById("graficoValor");

  if (graficoQuantidade) {
    graficoQuantidade.destroy();
  }

  if (graficoValor) {
    graficoValor.destroy();
  }

  graficoQuantidade = new Chart(ctxQuantidade, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Quantidade em estoque",
          data: dadosQuantidade,
          backgroundColor: "rgba(37, 99, 235, 0.7)",
          borderColor: "rgba(37, 99, 235, 1)",
          borderWidth: 1,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  graficoValor = new Chart(ctxValor, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Valor em estoque",
          data: dadosValor,
          backgroundColor: [
            "#2563eb",
            "#22c55e",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#14b8a6",
            "#f97316",
            "#06b6d4"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function adicionarProduto(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const categoria = categoriaInput.value.trim();
  const quantidade = Number(quantidadeInput.value);
  const valor = Number(valorInput.value);
  const codigo = codigoInput.value.trim();
  const estoqueMinimo = Number(estoqueMinimoInput.value);

  if (
    !nome ||
    !categoria ||
    !codigo ||
    isNaN(quantidade) ||
    isNaN(valor) ||
    isNaN(estoqueMinimo) ||
    quantidade < 0 ||
    valor < 0 ||
    estoqueMinimo < 0
  ) {
    mostrarMensagem(appMessage, "Preencha os campos corretamente.", "#ef4444");
    return;
  }

  const codigoJaExiste = produtos.some(function (produto) {
    return produto.codigo.toLowerCase() === codigo.toLowerCase();
  });

  if (codigoJaExiste) {
    mostrarMensagem(appMessage, "Já existe um produto com esse código/NFC.", "#ef4444");
    return;
  }

  const novoProduto = {
    id: Date.now().toString(),
    nome: nome,
    categoria: categoria,
    quantidade: quantidade,
    valor: valor,
    codigo: codigo,
    estoqueMinimo: estoqueMinimo
  };

  produtos.push(novoProduto);
  salvarProdutos();
  registrarHistorico("Adicionado", novoProduto);
  atualizarTudo();

  productForm.reset();
  nomeInput.focus();

  mostrarMensagem(appMessage, "Produto adicionado com sucesso.", "#22c55e");
}

function abrirModalEdicao(index) {
  const produto = produtos[index];
  if (!produto) return;

  editIndexInput.value = index;
  editNomeInput.value = produto.nome;
  editCategoriaInput.value = produto.categoria;
  editQuantidadeInput.value = produto.quantidade;
  editValorInput.value = produto.valor;
  editCodigoInput.value = produto.codigo;
  editEstoqueMinimoInput.value = produto.estoqueMinimo;

  editModal.classList.remove("hidden");
}

function fecharModalEdicao() {
  editModal.classList.add("hidden");
  editForm.reset();
}

function salvarEdicao(event) {
  event.preventDefault();

  const index = Number(editIndexInput.value);
  const produtoAtual = produtos[index];

  if (!produtoAtual) return;

  const nome = editNomeInput.value.trim();
  const categoria = editCategoriaInput.value.trim();
  const quantidade = Number(editQuantidadeInput.value);
  const valor = Number(editValorInput.value);
  const codigo = editCodigoInput.value.trim();
  const estoqueMinimo = Number(editEstoqueMinimoInput.value);

  if (
    !nome ||
    !categoria ||
    !codigo ||
    isNaN(quantidade) ||
    isNaN(valor) ||
    isNaN(estoqueMinimo) ||
    quantidade < 0 ||
    valor < 0 ||
    estoqueMinimo < 0
  ) {
    mostrarMensagem(appMessage, "Preencha os dados da edição corretamente.", "#ef4444");
    return;
  }

  const codigoJaExiste = produtos.some(function (produto, i) {
    return i !== index && produto.codigo.toLowerCase() === codigo.toLowerCase();
  });

  if (codigoJaExiste) {
    mostrarMensagem(appMessage, "Já existe outro produto com esse código/NFC.", "#ef4444");
    return;
  }

  produtos[index] = {
    ...produtoAtual,
    nome: nome,
    categoria: categoria,
    quantidade: quantidade,
    valor: valor,
    codigo: codigo,
    estoqueMinimo: estoqueMinimo
  };

  salvarProdutos();
  registrarHistorico("Editado", produtos[index]);
  atualizarTudo();
  fecharModalEdicao();

  mostrarMensagem(appMessage, "Produto editado com sucesso.", "#22c55e");
}

function excluirProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  const confirmar = confirm(`Deseja excluir o produto "${produto.nome}"?`);
  if (!confirmar) return;

  produtos.splice(index, 1);
  salvarProdutos();
  registrarHistorico("Excluído", produto);
  atualizarTudo();

  mostrarMensagem(appMessage, "Produto excluído com sucesso.", "#22c55e");
}

function exportarCSV() {
  if (produtos.length === 0) {
    mostrarMensagem(appMessage, "Não há produtos para exportar.", "#ef4444");
    return;
  }

  let csv = "nome;categoria;quantidade;valor;codigo;estoqueMinimo\n";

  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];
    csv += `${produto.nome};${produto.categoria};${produto.quantidade};${produto.valor};${produto.codigo};${produto.estoqueMinimo}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "estoque_mercado.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  mostrarMensagem(appMessage, "CSV exportado com sucesso.", "#22c55e");
}

function importarCSV(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    const texto = e.target.result;
    const linhas = texto.split(/\r?\n/).filter(function (linha) {
      return linha.trim() !== "";
    });

    if (linhas.length < 2) {
      mostrarMensagem(appMessage, "CSV vazio ou inválido.", "#ef4444");
      csvFile.value = "";
      return;
    }

    const novosProdutos = [];

    for (let i = 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(";");

      if (colunas.length < 6) continue;

      const nome = colunas[0].trim();
      const categoria = colunas[1].trim();
      const quantidade = Number(String(colunas[2]).trim().replace(",", "."));
      const valor = Number(String(colunas[3]).trim().replace(",", "."));
      const codigo = colunas[4].trim();
      const estoqueMinimo = Number(String(colunas[5]).trim().replace(",", "."));

      if (
        !nome ||
        !categoria ||
        !codigo ||
        isNaN(quantidade) ||
        isNaN(valor) ||
        isNaN(estoqueMinimo)
      ) {
        continue;
      }

      novosProdutos.push({
        id: `${Date.now()}_${i}`,
        nome: nome,
        categoria: categoria,
        quantidade: quantidade,
        valor: valor,
        codigo: codigo,
        estoqueMinimo: estoqueMinimo
      });
    }

    if (novosProdutos.length === 0) {
      mostrarMensagem(appMessage, "Nenhum dado válido encontrado no CSV.", "#ef4444");
      csvFile.value = "";
      return;
    }

    produtos = novosProdutos;
    salvarProdutos();
    registrarHistorico("Importado CSV", {
      nome: `${novosProdutos.length} produtos`,
      categoria: "Importação",
      quantidade: novosProdutos.length,
      valor: 0,
      codigo: "CSV"
    });
    atualizarTudo();

    mostrarMensagem(appMessage, "CSV importado com sucesso.", "#22c55e");
    csvFile.value = "";
  };

  leitor.readAsText(arquivo, "UTF-8");
}

function limparTudo() {
  if (produtos.length === 0) {
    mostrarMensagem(appMessage, "A lista já está vazia.", "#ef4444");
    return;
  }

  const confirmar = confirm("Tem certeza que deseja apagar todos os produtos?");
  if (!confirmar) return;

  produtos = [];
  salvarProdutos();
  registrarHistorico("Limpeza geral", {
    nome: "Todos os produtos",
    categoria: "Sistema",
    quantidade: 0,
    valor: 0,
    codigo: "-"
  });
  atualizarTudo();

  mostrarMensagem(appMessage, "Todos os produtos foram removidos.", "#22c55e");
}

function fazerLogin(event) {
  event.preventDefault();

  const usuario = document.getElementById("username").value.trim();
  const senha = document.getElementById("password").value.trim();

  if (usuario === "admin" && senha === "1234") {
    localStorage.setItem(STORAGE_LOGIN, "true");
    abrirSistema();
  } else {
    mostrarMensagem(loginMessage, "Usuário ou senha inválidos.", "#ef4444");
  }
}

function abrirSistema() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  carregarSistema();
}

function sairSistema() {
  localStorage.removeItem(STORAGE_LOGIN);
  appScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  loginForm.reset();
}

function iniciarApp() {
  setTimeout(function () {
    loadingScreen.classList.add("hidden");

    const logado = localStorage.getItem(STORAGE_LOGIN) === "true";

    if (logado) {
      abrirSistema();
    } else {
      loginScreen.classList.remove("hidden");
    }
  }, 1200);
}

productForm.addEventListener("submit", adicionarProduto);
loginForm.addEventListener("submit", fazerLogin);
logoutBtn.addEventListener("click", sairSistema);
btnExportCsv.addEventListener("click", exportarCSV);
csvFile.addEventListener("change", importarCSV);
btnLimparTudo.addEventListener("click", limparTudo);

searchInput.addEventListener("input", renderizarTabela);
sortSelect.addEventListener("change", renderizarTabela);

editForm.addEventListener("submit", salvarEdicao);
closeModalBtn.addEventListener("click", fecharModalEdicao);
cancelModalBtn.addEventListener("click", fecharModalEdicao);

editModal.addEventListener("click", function (event) {
  if (event.target === editModal) {
    fecharModalEdicao();
  }
});

window.abrirModalEdicao = abrirModalEdicao;
window.excluirProduto = excluirProduto;

iniciarApp();
