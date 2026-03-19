const STORAGE_PRODUCTS = "estoque_produtos";
const STORAGE_LOGIN = "estoque_logado";

const loadingScreen = document.getElementById("loadingScreen");
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutBtn = document.getElementById("logoutBtn");

const productForm = document.getElementById("productForm");
const appMessage = document.getElementById("appMessage");

const nomeInput = document.getElementById("nome");
const quantidadeInput = document.getElementById("quantidade");
const valorInput = document.getElementById("valor");

const productTableBody = document.getElementById("productTableBody");
const searchInput = document.getElementById("searchInput");

const totalProdutosEl = document.getElementById("totalProdutos");
const totalQuantidadeEl = document.getElementById("totalQuantidade");
const valorTotalEl = document.getElementById("valorTotal");

const btnExportCsv = document.getElementById("btnExportCsv");
const csvFile = document.getElementById("csvFile");
const btnLimparTudo = document.getElementById("btnLimparTudo");

let produtos = [];

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function salvarProdutos() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(produtos));
}

function carregarProdutos() {
  const dados = localStorage.getItem(STORAGE_PRODUCTS);
  produtos = dados ? JSON.parse(dados) : [];
}

function mostrarMensagem(elemento, texto, cor = "#f59e0b") {
  elemento.textContent = texto;
  elemento.style.color = cor;

  setTimeout(() => {
    if (elemento.textContent === texto) {
      elemento.textContent = "";
    }
  }, 2500);
}

function atualizarResumo() {
  const totalProdutos = produtos.length;
  const totalQuantidade = produtos.reduce((acc, p) => acc + Number(p.quantidade), 0);
  const valorTotal = produtos.reduce(
    (acc, p) => acc + Number(p.quantidade) * Number(p.valor),
    0
  );

  totalProdutosEl.textContent = totalProdutos;
  totalQuantidadeEl.textContent = totalQuantidade;
  valorTotalEl.textContent = formatarMoeda(valorTotal);
}

function criarLinhaProduto(produto, index) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td>${produto.nome}</td>
    <td>${produto.quantidade}</td>
    <td>${formatarMoeda(produto.valor)}</td>
    <td>${formatarMoeda(produto.quantidade * produto.valor)}</td>
    <td>
      <div class="actions">
        <button class="btn btn-secondary" onclick="editarProduto(${index})">Editar</button>
        <button class="btn btn-danger" onclick="excluirProduto(${index})">Excluir</button>
      </div>
    </td>
  `;

  return tr;
}

function renderizarTabela() {
  const termo = searchInput.value.trim().toLowerCase();
  productTableBody.innerHTML = "";

  const filtrados = produtos
    .map((produto, index) => ({ produto, index }))
    .filter(item => item.produto.nome.toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    productTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Nenhum produto encontrado.</td>
      </tr>
    `;
    atualizarResumo();
    return;
  }

  filtrados.forEach(item => {
    const linha = criarLinhaProduto(item.produto, item.index);
    productTableBody.appendChild(linha);
  });

  atualizarResumo();
}

function adicionarProduto(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const quantidade = Number(quantidadeInput.value);
  const valor = Number(valorInput.value);

  if (!nome || quantidade < 0 || valor < 0 || Number.isNaN(quantidade) || Number.isNaN(valor)) {
    mostrarMensagem(appMessage, "Preencha os campos corretamente.");
    return;
  }

  produtos.push({
    nome,
    quantidade,
    valor
  });

  salvarProdutos();
  renderizarTabela();
  productForm.reset();
  nomeInput.focus();
  mostrarMensagem(appMessage, "Produto adicionado com sucesso.", "#22c55e");
}

function editarProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  const novoNome = prompt("Editar nome do produto:", produto.nome);
  if (novoNome === null) return;

  const novaQuantidade = prompt("Editar quantidade:", produto.quantidade);
  if (novaQuantidade === null) return;

  const novoValor = prompt("Editar valor unitário:", produto.valor);
  if (novoValor === null) return;

  const quantidadeNumero = Number(String(novaQuantidade).replace(",", "."));
  const valorNumero = Number(String(novoValor).replace(",", "."));

  if (!novoNome.trim() || Number.isNaN(quantidadeNumero) || Number.isNaN(valorNumero) || quantidadeNumero < 0 || valorNumero < 0) {
    mostrarMensagem(appMessage, "Dados inválidos. Edição cancelada.");
    return;
  }

  produtos[index] = {
    nome: novoNome.trim(),
    quantidade: quantidadeNumero,
    valor: valorNumero
  };

  salvarProdutos();
  renderizarTabela();
  mostrarMensagem(appMessage, "Produto editado com sucesso.", "#22c55e");
}

function excluirProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  const confirmar = confirm(`Deseja excluir o produto "${produto.nome}"?`);
  if (!confirmar) return;

  produtos.splice(index, 1);
  salvarProdutos();
  renderizarTabela();
  mostrarMensagem(appMessage, "Produto excluído com sucesso.", "#22c55e");
}

function exportarCSV() {
  if (produtos.length === 0) {
    mostrarMensagem(appMessage, "Não há produtos para exportar.");
    return;
  }

  const linhas = [
    ["nome", "quantidade", "valor"]
  ];

  produtos.forEach(produto => {
    linhas.push([produto.nome, produto.quantidade, produto.valor]);
  });

  const csvConteudo = linhas
    .map(linha =>
      linha
        .map(valor => `"${String(valor).replace(/"/g, '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "estoque.csv";
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
    try {
      const texto = e.target.result;
      const linhas = texto.split(/\r?\n/).filter(linha => linha.trim() !== "");

      if (linhas.length < 2) {
        mostrarMensagem(appMessage, "CSV vazio ou inválido.");
        csvFile.value = "";
        return;
      }

      const novosProdutos = [];

      for (let i = 1; i < linhas.length; i++) {
        const linha = linhas[i];
        const colunas = linha
          .split(";")
          .map(col => col.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

        if (colunas.length < 3) continue;

        const nome = colunas[0]?.trim();
        const quantidade = Number(String(colunas[1]).replace(",", "."));
        const valor = Number(String(colunas[2]).replace(",", "."));

        if (!nome || Number.isNaN(quantidade) || Number.isNaN(valor)) continue;

        novosProdutos.push({
          nome,
          quantidade,
          valor
        });
      }

      if (novosProdutos.length === 0) {
        mostrarMensagem(appMessage, "Nenhum dado válido encontrado no CSV.");
        csvFile.value = "";
        return;
      }

      produtos = novosProdutos;
      salvarProdutos();
      renderizarTabela();
      mostrarMensagem(appMessage, "CSV importado com sucesso.", "#22c55e");
    } catch (erro) {
      mostrarMensagem(appMessage, "Erro ao importar CSV.");
    }

    csvFile.value = "";
  };

  leitor.readAsText(arquivo, "UTF-8");
}

function limparTudo() {
  if (produtos.length === 0) {
    mostrarMensagem(appMessage, "A lista já está vazia.");
    return;
  }

  const confirmar = confirm("Tem certeza que deseja apagar todos os produtos?");
  if (!confirmar) return;

  produtos = [];
  salvarProdutos();
  renderizarTabela();
  mostrarMensagem(appMessage, "Todos os produtos foram removidos.", "#22c55e");
}

function fazerLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (username === "admin" && password === "1234") {
    localStorage.setItem(STORAGE_LOGIN, "true");
    abrirSistema();
  } else {
    mostrarMensagem(loginMessage, "Usuário ou senha inválidos.", "#ef4444");
  }
}

function abrirSistema() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  carregarProdutos();
  renderizarTabela();
}

function sairSistema() {
  localStorage.removeItem(STORAGE_LOGIN);
  appScreen.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  loginForm.reset();
}

function iniciarApp() {
  setTimeout(() => {
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
searchInput.addEventListener("input", renderizarTabela);
btnExportCsv.addEventListener("click", exportarCSV);
csvFile.addEventListener("change", importarCSV);
btnLimparTudo.addEventListener("click", limparTudo);

window.editarProduto = editarProduto;
window.excluirProduto = excluirProduto;

iniciarApp();
