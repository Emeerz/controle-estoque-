let produtos = [];

const tabela = document.getElementById("tabela");

function adicionar() {
  const produto = {
    nome: document.getElementById("nome").value,
    quantidade: Number(document.getElementById("quantidade").value),
    valor: Number(document.getElementById("valor").value)
  };

  produtos.push(produto);

  atualizar();
}

function atualizar() {
  tabela.innerHTML = "";

  let totalQtd = 0;
  let totalValor = 0;

  produtos.forEach((p, i) => {
    totalQtd += p.quantidade;
    totalValor += p.quantidade * p.valor;

    tabela.innerHTML += `
      <tr>
        <td>${p.nome}</td>
        <td>${p.quantidade}</td>
        <td>${p.valor}</td>
        <td>${p.quantidade * p.valor}</td>
        <td><button onclick="remover(${i})">X</button></td>
      </tr>
    `;
  });

  document.getElementById("totalProdutos").textContent = produtos.length;
  document.getElementById("totalQuantidade").textContent = totalQtd;
  document.getElementById("valorTotal").textContent = totalValor.toFixed(2);

  atualizarGraficos();
}

function remover(i) {
  produtos.splice(i, 1);
  atualizar();
}

let grafico1, grafico2;

function atualizarGraficos() {
  const labels = produtos.map(p => p.nome);
  const qtd = produtos.map(p => p.quantidade);
  const valores = produtos.map(p => p.quantidade * p.valor);

  if (grafico1) grafico1.destroy();
  if (grafico2) grafico2.destroy();

  grafico1 = new Chart(document.getElementById("graficoQuantidade"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Quantidade",
        data: qtd
      }]
    }
  });

  grafico2 = new Chart(document.getElementById("graficoValor"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Valor",
        data: valores
      }]
    }
  });
}

window.onload = () => {
  document.getElementById("loadingScreen").style.display = "none";
  document.getElementById("app").classList.remove("hidden");
};
