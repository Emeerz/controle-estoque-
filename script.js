let produtos = [];
let historico = [];
let graficoQuantidade = null;
let graficoValor = null;

const CHAVE_PRODUTOS = "produtos";
const CHAVE_HISTORICO = "historicoEstoque";
const CHAVE_LOGIN = "usuarioLogado";

function converterNumero(valor) {
  if (typeof valor === "number") return valor;

  if (typeof valor === "string") {
    const valorTratado = valor.replace(/\s/g, "").replace(",", ".");
    const numero = Number(valorTratado);
    return isNaN(numero) ? 0 : numero;
  }

  return 0;
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function obterDataHoraAtual() {
  return new Date().toLocaleString("pt-BR");
}

function salvarProdutos() {
  localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
}

function carregarProdutos() {
  const dados = localStorage.getItem(CHAVE_PRODUTOS);

  if (dados) {
    produtos = JSON.parse(dados).map((produto) => ({
      nome: produto.nome || "",
      quantidade: converterNumero(produto.quantidade),
      valor: converterNumero(produto.valor)
    }));
  } else {
    produtos = [];
  }
}

function salvarHistorico() {
  localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico));
}

function carregarHistorico() {
  const dados = localStorage.getItem(CHAVE_HISTORICO);

  if (dados) {
    historico = JSON.parse(dados);
  } else {
    historico = [];
  }
}

function adicionarHistorico(acao, detalhe) {
  historico.unshift({
    acao,
    detalhe,
    data: obterDataHoraAtual()
  });

  if (historico.length > 100) {
    historico = historico.slice(0, 100);
  }

  salvarHistorico();
  renderizarHistorico();
}

function renderizarHistorico() {
  const listaHistorico = document.getElementById("listaHistorico");

  if (!listaHistorico) return;

  if (historico.length === 0) {
    listaHistorico.innerHTML = `<li class="empty-state">Nenhuma movimentação registrada.</li>`;
    return;
  }

  listaHistorico.innerHTML = historico
    .map(
      (item) => `
        <li class="historico-item">
          <strong>${item.acao}</strong>
          <div>${item.detalhe}</div>
          <span>${item.data}</span>
        </li>
      `
    )
    .join("");
}

function atualizarResumo() {
  const totalProdutos = produtos.length;
  const totalQuantidade = produtos.reduce((acc, produto) => acc + converterNumero(produto.quantidade), 0);
  const valorTotal = produtos.reduce(
    (acc, produto) => acc + converterNumero(produto.quantidade) * converterNumero(produto.valor),
    0
  );
  const estoqueBaixo = produtos.filter((produto) => converterNumero(produto.quantidade) <= 5).length;

  document.getElementById("totalProdutos").textContent = totalProdutos;
  document.getElementById("totalQuantidade").textContent = totalQuantidade;
  document.getElementById("valorTotal").textContent = formatarMoeda(valorTotal);
  document.getElementById("estoqueBaixo").textContent = estoqueBaixo;
}

function obterProdutosFiltrados() {
  const termo = document.getElementById("buscaProduto").value.trim().toLowerCase();

  if (!termo) return produtos;

  return produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(termo)
  );
}

function renderizarProdutos() {
  const listaProdutos = document.getElementById("listaProdutos");
  const produtosFiltrados = obterProdutosFiltrados();

  if (!listaProdutos) return;

  if (produtosFiltrados.length === 0) {
    listaProdutos.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">Nenhum produto encontrado.</td>
      </tr>
    `;
    atualizarResumo();
    atualizarGraficos();
    return;
  }

  listaProdutos.innerHTML = produtosFiltrados
    .map((produto) => {
      const indexReal = produtos.findIndex(
        (p) =>
          p.nome === produto.nome &&
          Number(p.quantidade) === Number(produto.quantidade) &&
          Number(p.valor) === Number(produto.valor)
      );

      const valorTotalProduto = converterNumero(produto.quantidade) * converterNumero(produto.valor);
      const estoqueBaixo = converterNumero(produto.quantidade) <= 5;

      return `
        <tr>
          <td>${produto.nome}</td>
          <td>${produto.quantidade}</td>
          <td>${formatarMoeda(converterNumero(produto.valor))}</td>
          <td>${formatarMoeda(valorTotalProduto)}</td>
          <td>
            <span class="status ${estoqueBaixo ? "low" : "ok"}">
              ${estoqueBaixo ? "Baixo" : "Normal"}
            </span>
          </td>
          <td>
            <div class="actions">
              <button class="btn btn-secondary btn-small" onclick="editarProduto(${indexReal})">Editar</button>
              <button class="btn btn-danger btn-small" onclick="removerProduto(${indexReal})">Excluir</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  atualizarResumo();
  atualizarGraficos();
}

function limparFormulario() {
  document.getElementById("produtoForm").reset();
  document.getElementById("editIndex").value = "";
  document.getElementById("btnSalvarProduto").textContent = "Salvar Produto";
}

function cancelarEdicao() {
  limparFormulario();
}

function editarProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  document.getElementById("nomeProduto").value = produto.nome;
  document.getElementById("quantidadeProduto").value = produto.quantidade;
  document.getElementById("valorProduto").value = produto.valor;
  document.getElementById("editIndex").value = index;
  document.getElementById("btnSalvarProduto").textContent = "Atualizar Produto";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function removerProduto(index) {
  const produto = produtos[index];
  if (!produto) return;

  const confirmar = confirm(`Deseja realmente excluir o produto "${produto.nome}"?`);
  if (!confirmar) return;

  produtos.splice(index, 1);
  salvarProdutos();
  adicionarHistorico("Produto removido", `${produto.nome} foi removido do estoque.`);
  renderizarProdutos();
  limparFormulario();
}

function atualizarGraficos() {
  const labels = produtos.map((produto) => produto.nome);
  const dadosQuantidade = produtos.map((produto) => converterNumero(produto.quantidade));
  const dadosValor = produtos.map((produto) =>
    converterNumero(produto.quantidade) * converterNumero(produto.valor)
  );

  const ctxQuantidade = document.getElementById("graficoQuantidade");
  const ctxValor = document.getElementById("graficoValor");

  if (!ctxQuantidade || !ctxValor) return;

  if (graficoQuantidade) {
    graficoQuantidade.destroy();
  }

  if (graficoValor) {
    graficoValor.destroy();
  }

  graficoQuantidade = new Chart(ctxQuantidade, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Quantidade em estoque",
          data: dadosQuantidade,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  graficoValor = new Chart(ctxValor, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Valor total por produto",
          data: dadosValor,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function exportarCSV() {
  if (produtos.length === 0) {
    alert("Não há produtos para exportar.");
    return;
  }

  let csv = "nome;quantidade;valor\n";

  produtos.forEach((produto) => {
    csv += `${produto.nome};${produto.quantidade};${Number(produto.valor).toFixed(2)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "estoque.csv";
  link.click();

  URL.revokeObjectURL(url);

  adicionarHistorico("Exportação CSV", "Os produtos foram exportados em CSV.");
}

function importarCSV(event) {
  const arquivo = event.target.files[0];
  if (!arquivo) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const texto = e.target.result;

    if (!texto || !texto.trim()) {
      alert("CSV vazio ou inválido.");
      event.target.value = "";
      return;
    }

    const linhas = texto
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha !== "");

    if (linhas.length < 2) {
      alert("Nenhum dado foi encontrado no CSV.");
      event.target.value = "";
      return;
    }

    const separador = linhas[0].includes(";") ? ";" : ",";
    const cabecalho = linhas[0].split(separador).map((coluna) => coluna.trim().toLowerCase());

    const nomeIndex = cabecalho.indexOf("nome");
    const quantidadeIndex = cabecalho.indexOf("quantidade");
    const valorIndex = cabecalho.indexOf("valor");

    if (nomeIndex === -1 || quantidadeIndex === -1 || valorIndex === -1) {
      alert("O CSV precisa ter as colunas: nome, quantidade, valor");
      event.target.value = "";
      return;
    }

    const novosProdutos = [];

    for (let i = 1; i < linhas.length; i++) {
      const colunas = linhas[i].split(separador).map((item) => item.trim());

      if (colunas.length < 3) continue;

      const nome = colunas[nomeIndex] || "";
      const quantidade = converterNumero(colunas[quantidadeIndex] || "0");
      const valor = converterNumero(colunas[valorIndex] || "0");

      if (!nome) continue;

      novosProdutos.push({
        nome,
        quantidade: isNaN(quantidade) ? 0 : quantidade,
        valor: isNaN(valor) ? 0 : valor
      });
    }

    if (novosProdutos.length === 0) {
      alert("Nenhum dado válido foi encontrado no CSV.");
      event.target.value = "";
      return;
    }

    produtos = novosProdutos;
    salvarProdutos();
    renderizarProdutos();
    adicionarHistorico("Importação CSV", `${novosProdutos.length} produto(s) importado(s) com sucesso.`);
    alert("CSV importado com sucesso!");
    event.target.value = "";
  };

  reader.readAsText(arquivo, "UTF-8");
}

function limparTudo() {
  if (produtos.length === 0 && historico.length === 0) {
    alert("Não há dados para limpar.");
    return;
  }

  const confirmar = confirm("Deseja realmente apagar todos os produtos e o histórico?");
  if (!confirmar) return;

  produtos = [];
  historico = [];
  localStorage.removeItem(CHAVE_PRODUTOS);
  localStorage.removeItem(CHAVE_HISTORICO);

  renderizarProdutos();
  renderizarHistorico();
  limparFormulario();
  alert("Todos os dados foram apagados.");
}

function limparHistorico() {
  if (historico.length === 0) {
    alert("O histórico já está vazio.");
    return;
  }

  const confirmar = confirm("Deseja limpar todo o histórico?");
  if (!confirmar) return;

  historico = [];
  salvarHistorico();
  renderizarHistorico();
}

function login(usuario, senha) {
  if (usuario === "admin" && senha === "1234") {
    localStorage.setItem(CHAVE_LOGIN, "true");
    mostrarApp();
    return true;
  }

  return false;
}

function logout() {
  localStorage.removeItem(CHAVE_LOGIN);
  document.getElementById("loginScreen").classList.add("active");
  document.getElementById("appScreen").classList.remove("active");
}

function mostrarApp() {
  document.getElementById("loginScreen").classList.remove("active");
  document.getElementById("appScreen").classList.add("active");
  carregarProdutos();
  carregarHistorico();
  renderizarProdutos();
  renderizarHistorico();
}

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const usuario = document.getElementById("username").value.trim();
  const senha = document.getElementById("password").value.trim();

  const entrou = login(usuario, senha);

  if (!entrou) {
    alert("Usuário ou senha inválidos.");
  }
});

document.getElementById("produtoForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const nome = document.getElementById("nomeProduto").value.trim();
  const quantidade = converterNumero(document.getElementById("quantidadeProduto").value);
  const valor = converterNumero(document.getElementById("valorProduto").value);
  const editIndex = document.getElementById("editIndex").value;

  if (!nome) {
    alert("Informe o nome do produto.");
    return;
  }

  if (quantidade < 0 || valor < 0) {
    alert("Quantidade e valor não podem ser negativos.");
    return;
  }

  const produto = {
    nome,
    quantidade,
    valor
  };

  if (editIndex !== "") {
    const index = Number(editIndex);
    const nomeAnterior = produtos[index]?.nome || nome;

    produtos[index] = produto;
    salvarProdutos();
    adicionarHistorico("Produto editado", `${nomeAnterior} foi atualizado para ${nome}.`);
  } else {
    produtos.push(produto);
    salvarProdutos();
    adicionarHistorico("Produto adicionado", `${nome} foi adicionado ao estoque.`);
  }

  renderizarProdutos();
  limparFormulario();
});

window.onload = function () {
  const logado = localStorage.getItem(CHAVE_LOGIN) === "true";

  if (logado) {
    mostrarApp();
  } else {
    document.getElementById("loginScreen").classList.add("active");
    document.getElementById("appScreen").classList.remove("active");
  }
};
