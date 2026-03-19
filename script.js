const STORAGE_PRODUCTS = "estoque_produtos";
const STORAGE_LOGIN = "estoque_logado";

let produtos = [];

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

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function mostrarMensagem(elemento, texto, cor) {
  if (!elemento) return;
  elemento.textContent = texto;
  elemento.style.color = cor || "#f59e0b";

  setTimeout(function () {
    elemento.textContent = "";
  }, 2500);
}

function salvarProdutos() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(produtos));
}

function carregarProdutos() {
  const dados = localStorage.getItem(STORAGE_PRODUCTS);
  produtos = dados ? JSON.parse(dados) : [];
}

function atualizarResumo() {
  const totalProdutos = produtos.length;

  let totalQuantidade = 0;
  let valorTotal = 0;

  for (let i = 0; i < produtos.length; i++) {
    totalQuantidade += Number(produtos[i].quantidade);
    valorTotal += Number(produtos[i].quantidade) * Number(produtos[i].valor);
  }

  totalProdutosEl.textContent = totalProdutos;
  totalQuantidadeEl.textContent = totalQuantidade;
  valorTotalEl.textContent = formatarMoeda(valorTotal);
}

function renderizarTabela() {
  const termo = searchInput.value.toLowerCase().trim();
  productTableBody.innerHTML = "";

  let encontrados = 0;

  for (let i = 0; i < produtos.length; i++) {
    const produto = produtos[i];

    if (!produto.nome.toLowerCase().includes(termo)) {
      continue;
    }

    encontrados++;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${produto.nome}</td>
      <td>${produto.quantidade}</td>
      <td>${formatarMoeda(produto.valor)}</td>
      <td>${formatarMoeda(produto.quantidade * produto.valor)}</td>
      <td>
        <div class="actions">
          <button class="btn btn-secondary" onclick="editarProduto(${i})">Editar</button>
          <button class="btn btn-danger" onclick="excluirProduto(${i})">Excluir</button>
        </div>
      </td>
    `;
    productTableBody.appendChild(tr);
  }

  if (encontrados === 0) {
    productTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="5">Nenhum produto encontrado.</td>
      </tr>
    `;
  }

  atualizarResumo();
}

function adicionarProduto(event) {
  event.preventDefault();

  const nome = nomeInput.value.trim();
  const quantidade = Number(quantidadeInput.value);
  const valor = Number(valorInput.value);

  if (!nome || isNaN(quantidade) || isNaN(valor) || quantidade < 0 || valor < 0) {
    mostrarMensagem(appMessage, "Preencha os campos corretamente.", "#ef4444");
    return;
  }

  produtos.push({
    nome: nome,
    quantidade: quantidade,
    valor: valor
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

  if (!novoNome.trim() || isNaN(quantidadeNumero) || isNaN(valorNumero) || quantidadeNumero < 0 || valorNumero < 0) {
    mostrarMensagem(appMessage, "Dados inválidos.", "#ef4444");
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

  const confirmar = confirm('Deseja excluir o produto "' + produto.nome + '"?');
  if (!confirmar) return;

  produtos.splice(index, 1);
  salvarProdutos();
  renderizarTabela();
  mostrarMensagem(appMessage, "Produto excluído com sucesso.", "#22c55e");
}

function exportarCSV() {
  if (produtos.length === 0) {
    mostrarMensagem(appMessage, "Não há produtos para exportar.", "#ef4444");
    return;
  }

  let csv = "nome;quantidade;valor\n";

  for (let i = 0; i < produtos.length; i++) {
    csv += `${produtos[i].nome};${produtos[i].quantidade};${produtos[i].valor}\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "estoque.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  mostrarMensagem(appMessage, "CSV exportado com sucesso.", "#22c55e");
}

function importarCSV(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function (e) {
    const texto = e.target.result;
    const linhas = texto.split(/\r?\n/);

    const novosProdutos = [];

    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (!linha) continue;

      const colunas = linha.split(";");
      if (colunas.length < 3) continue;

      const nome = colunas[0].trim();
      const quantidade = Number(colunas[1].replace(",", "."));
      const valor = Number(colunas[2].replace(",", "."));

      if (!nome || isNaN(quantidade) || isNaN(valor)) continue;

      novosProdutos.push({
        nome: nome,
        quantidade: quantidade,
        valor: valor
      });
    }

    if (novosProdutos.length === 0) {
      mostrarMensagem(appMessage, "CSV inválido ou vazio.", "#ef4444");
      csvFile.value = "";
      return;
    }

    produtos = novosProdutos;
    salvarProdutos();
    renderizarTabela();
    mostrarMensagem(appMessage, "CSV importado com sucesso.", "#22c55e");
    csvFile.value = "";
  };

  leitor.readAsText(arquivo, "UTF-8");
}

function limparTudo() {
  const confirmar = confirm("Tem certeza que deseja apagar todos os produtos?");
  if (!confirmar) return;

  produtos = [];
  salvarProdutos();
  renderizarTabela();
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
  setTimeout(function () {
    loadingScreen.style.display = "none";

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
