let produtos = [];
let historico = [];
let graficoQuantidade;
let graficoValor;

function converterNumero(valor) {
  if (typeof valor === "number") return valor;

  if (typeof valor === "string") {
    const valorTratado = valor.replace(",", ".").trim();
    const numero = Number(valorTratado);
    return isNaN(numero) ? 0 : numero;
  }

  return 0;
}

function salvarProdutos() {
  localStorage.setItem("produtos", JSON.stringify(produtos));
}

function carregarProdutos() {
  const dados = localStorage.getItem("produtos");

  if (dados) {
    produtos = JSON.parse(dados).map((produto) => ({
      nome: produto.nome || "",
      quantidade: converterNumero(produto.quantidade),
      valor: converterNumero(produto.valor)
    }));
  }
}

function salvarHistorico() {
  localStorage.setItem("historicoEstoque", JSON.stringify(historico));
}

function carregarHistorico() {
  const dados = localStorage.getItem("historicoEstoque");

  if (dados) {
    historico = JSON.parse(dados);
  }
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function atualizarResumo() {
  const totalProdutos = produtos.length;

  const totalItens = produtos.reduce((total, produto) => {
    return total + converterNumero(produto.quantidade);
  }, 0);

  const valorEstoque = produtos.reduce((total, produto) => {
    return total + (converterNumero(produto.quantidade) * converterNumero(produto.valor));
  }, 0);

  document.getElementById("totalProdutos").textContent = totalProdutos;
  document.getElementById("totalItens").textContent = totalItens;
  document.getElementById("valorEstoque").textContent = formatarMoeda(valorEstoque);
}

function limparCampos() {
  document.getElementById("nomeProduto").value = "";
  document.getElementById("quantidadeProduto").value = "";
  document.getElementById("valorProduto").value = "";
}

function adicionarMovimentacao(nomeProduto, tipo, quantidade) {
  const data = new Date().toLocaleString("pt-BR");

  historico.unshift({
    data,
    produto: nomeProduto,
    tipo,
    quantidade
  });

  salvarHistorico();
  renderizarHistorico();
}

function adicionarProduto() {
  const nome = document.getElementById("nomeProduto").value.trim();
  const quantidade = converterNumero(document.getElementById("quantidadeProduto").value);
  const valor = converterNumero(document.getElementById("valorProduto").value);

  if (!nome || isNaN(quantidade) || isNaN(valor)) {
    alert("Preencha todos os campos corretamente.");
    return;
  }

  if (quantidade < 0 || valor < 0) {
    alert("Quantidade e valor não podem ser negativos.");
    return;
  }

  produtos.push({
    nome,
    quantidade,
    valor
  });

  adicionarMovimentacao(nome, "Entrada", quantidade);
  salvarProdutos();
  renderizarProdutos();
  limparCampos();
}

function editarProduto(index) {
  const produto = produtos[index];

  const novoNome = prompt("Editar nome do produto:", produto.nome);
  if (novoNome === null) return;

  const novaQuantidade = prompt("Editar quantidade:", produto.quantidade);
  if (novaQuantidade === null) return;

  const novoValor = prompt("Editar valor unitário:", produto.valor);
  if (novoValor === null) return;

  const quantidadeNumero = converterNumero(novaQuantidade);
  const valorNumero = converterNumero(novoValor);

  if (!novoNome.trim() || isNaN(quantidadeNumero) || isNaN(valorNumero)) {
    alert("Dados inválidos.");
    return;
  }

  if (quantidadeNumero < 0 || valorNumero < 0) {
    alert("Quantidade e valor não podem ser negativos.");
    return;
  }

  produtos[index] = {
    nome: novoNome.trim(),
    quantidade: quantidadeNumero,
    valor: valorNumero
  };

  salvarProdutos();
  renderizarProdutos();
}

function removerProduto(index) {
  const confirmar = confirm(`Deseja remover o produto "${produtos[index].nome}"?`);
  if (!confirmar) return;

  produtos.splice(index, 1);
  salvarProdutos();
  renderizarProdutos();
}

function movimentarEstoque(index, tipo) {
  const produto = produtos[index];
  const quantidadeTexto = prompt(`Digite a quantidade para ${tipo === "entrada" ? "entrada" : "saída"}:`);

  if (quantidadeTexto === null) return;

  const quantidade = converterNumero(quantidadeTexto);

  if (isNaN(quantidade) || quantidade <= 0) {
    alert("Digite uma quantidade válida.");
    return;
  }

  if (tipo === "entrada") {
    produto.quantidade += quantidade;
    adicionarMovimentacao(produto.nome, "Entrada", quantidade);
  } else {
    if (quantidade > produto.quantidade) {
      alert("Estoque insuficiente.");
      return;
    }

    produto.quantidade -= quantidade;
    adicionarMovimentacao(produto.nome, "Saída", quantidade);
  }

  salvarProdutos();
  renderizarProdutos();
}

function limparEstoque() {
  if (!confirm("Tem certeza que deseja apagar todos os produtos do estoque?")) {
    return;
  }

  produtos = [];
  salvarProdutos();
  renderizarProdutos();
}

function apagarHistorico() {
  if (!confirm("Tem certeza que deseja apagar todo o histórico?")) {
    return;
  }

  historico = [];
  salvarHistorico();
  renderizarHistorico();
}

function exportarCSV() {
  if (historico.length === 0) {
    alert("Não há histórico para exportar.");
    return;
  }

  let csv = "Data,Produto,Tipo,Quantidade\n";

  historico.forEach((item) => {
    csv += `"${item.data}","${item.produto}","${item.tipo}","${item.quantidade}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "historico_estoque.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function renderizarProdutos() {
  const tabelaEstoque = document.getElementById("tabelaEstoque");
  const campoBusca = document.getElementById("campoBusca");
  const busca = campoBusca ? campoBusca.value.toLowerCase().trim() : "";

  tabelaEstoque.innerHTML = "";

  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(busca)
  );

  if (produtosFiltrados.length === 0) {
    tabelaEstoque.innerHTML = `
      <tr>
        <td colspan="7" class="vazio">Nenhum produto encontrado.</td>
      </tr>
    `;
    atualizarResumo();
    atualizarGraficos();
    return;
  }

  produtosFiltrados.forEach((produtoFiltrado) => {
    const indexOriginal = produtos.findIndex(
      (p) =>
        p.nome === produtoFiltrado.nome &&
        converterNumero(p.quantidade) === converterNumero(produtoFiltrado.quantidade) &&
        converterNumero(p.valor) === converterNumero(produtoFiltrado.valor)
    );

    const quantidade = converterNumero(produtoFiltrado.quantidade);
    const valor = converterNumero(produtoFiltrado.valor);
    const total = quantidade * valor;

    const status =
      quantidade <= 5
        ? '<span class="status-baixo">Estoque baixo</span>'
        : '<span class="status-ok">Em estoque</span>';

    const classeLinha = quantidade <= 5 ? "linha-estoque-baixo" : "";

    tabelaEstoque.innerHTML += `
      <tr class="${classeLinha}">
        <td>${produtoFiltrado.nome}</td>
        <td>${quantidade}</td>
        <td>${formatarMoeda(valor)}</td>
        <td>${formatarMoeda(total)}</td>
        <td>${status}</td>
        <td>
          <button class="btn-entrada" onclick="movimentarEstoque(${indexOriginal}, 'entrada')">+ Entrada</button>
          <button class="btn-saida" onclick="movimentarEstoque(${indexOriginal}, 'saida')">- Saída</button>
        </td>
        <td>
          <button class="btn-editar" onclick="editarProduto(${indexOriginal})">Editar</button>
          <button class="btn-remover" onclick="removerProduto(${indexOriginal})">Remover</button>
        </td>
      </tr>
    `;
  });

  atualizarResumo();
  atualizarGraficos();
}

function renderizarHistorico() {
  const tabelaHistorico = document.getElementById("tabelaHistorico");
  tabelaHistorico.innerHTML = "";

  if (historico.length === 0) {
    tabelaHistorico.innerHTML = `
      <tr>
        <td colspan="4" class="vazio">Nenhuma movimentação registrada.</td>
      </tr>
    `;
    return;
  }

  historico.forEach((item) => {
    const classeTipo = item.tipo === "Entrada" ? "tipo-entrada" : "tipo-saida";

    tabelaHistorico.innerHTML += `
      <tr>
        <td>${item.data}</td>
        <td>${item.produto}</td>
        <td class="${classeTipo}">${item.tipo}</td>
        <td>${item.quantidade}</td>
      </tr>
    `;
  });
}

function atualizarGraficos() {
  const canvasQuantidade = document.getElementById("graficoEstoque");
  const canvasValor = document.getElementById("graficoValorEstoque");

  if (!canvasQuantidade || !canvasValor) return;

  const nomes = produtos.map((produto) => produto.nome);
  const quantidades = produtos.map((produto) => converterNumero(produto.quantidade));
  const valoresTotais = produtos.map((produto) => {
    return converterNumero(produto.quantidade) * converterNumero(produto.valor);
  });

  if (graficoQuantidade) {
    graficoQuantidade.destroy();
  }

  if (graficoValor) {
    graficoValor.destroy();
  }

  graficoQuantidade = new Chart(canvasQuantidade, {
    type: "bar",
    data: {
      labels: nomes,
      datasets: [
        {
          label: "Quantidade em estoque",
          data: quantidades,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  graficoValor = new Chart(canvasValor, {
    type: "doughnut",
    data: {
      labels: nomes,
      datasets: [
        {
          label: "Valor por produto",
          data: valoresTotais,
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

carregarProdutos();
carregarHistorico();
renderizarProdutos();
renderizarHistorico();
atualizarResumo();
atualizarGraficos();