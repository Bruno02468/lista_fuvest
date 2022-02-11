// alo alo criançada, esse é o script principal da página web

// função de utilidade: escapa caracteres perigosos
function escape_html(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// função de utilidade: gera tags <option>
function make_option(value, text) {
  return "<option value=\"" + escape_html(value) + "\">" + escape_html(text)
    + "</option>";
}

// função de utilidade: retorna uma string com n espaços
function nspaces(n) {
  var result = "";
  while (n > 0) {
    result += " ";
    n--;
  }
  return result;
}

// função de utilidade: termina uma string com espaços para ela acabar num
// comprimento mínimo especificado
function padspaces(str, n) {
  return str + nspaces(n - str.length);
}

// função de utilidade: requisita texto
function ajat(url, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
      callback(this.responseText);
    }
  };
  req.open("GET", url + "?_=" + new Date().getTime(), true);
  req.send();
}

// função de utilidade: requisita um json
function ajaj(url, callback) {
  ajat(url, function(t) {
    callback(JSON.parse(t));
  });
}

// elementos da DOM que eu vou usar com frequência
const criterios = document.getElementById("criterios");
const formato = document.getElementById("formato");
const destino = document.getElementById("destino");
const lista_listas = document.getElementById("listas");
const contagem = document.getElementById("contagem");

// primeiramente, vamos puxar a lista de códigos de curso e carreira
var anos = null;
var codigos_por_ano = {};
var listas = null;
var current_raw = "";
var cuc = null;

ajaj("meta/anos.json", function (even_more_data) {
  anos = even_more_data;
  gerar_lista_anos(even_more_data);
  ajaj("meta/listas.json", function (more_data) {
    listas = more_data;
    gerar_lista_listas(more_data);
  });
});

// gera a lista de anos e baixa as respectivas listas de códigos
function gerar_lista_anos(anos) {
  for (key in anos) {
    ajaj("codigos/" + anos[key]["codigos"], ano_callback(key));
  }
}

// hotfix besta: insere a cidade entre parênteses no nome da carreira
function impor_cidade(cod) {
  for (var cod_car in cod) {
    let car = cod[cod_car];
    console.log(car);
    if (car.hasOwnProperty("cidade")) {
      car["nome_carreira"] += " (" + car["cidade"] + ")";
    }
  }
}

// callback para quando a lista de um ano foi recebida
function ano_callback(ano) {
  return function(cod) {
    impor_cidade(cod);
    codigos_por_ano[ano] = cod;
    usar_ano(ano);
  }
}

var ano_atual = null;

// aplica a escolha de ano
function usar_ano(ano) {
  ano_atual = ano;
  codigos = codigos_por_ano[ano];
  var menu = gerar_menu_carreiras();
  for (var i = 1; i <= procurados; i++) {
    var id_base = "procurado-" + i;
    var car = document.getElementById(id_base + "-car");
    var cur = document.getElementById(id_base + "-cur");
    car.innerHTML = menu;
    cur.innerHTML = "";
    car.value = "?";
    cur.value = "*";
  }
}

// gerar um menu para lista de carreiras
function gerar_menu_carreiras() {
  var menu_carreiras = make_option("?", "Especifique uma carreira...");
  // iterar sobre cada carreira...
  for (var c in codigos) {
    var carreira = codigos[c];
    // ...e gerar um item de menu
    menu_carreiras += make_option(c, carreira["nome_carreira"] + " (" + c
      + ")");
  }
  return menu_carreiras;
}

// gera a "lista de listas" disponíveis
function gerar_lista_listas(dados) {
  dados.map(function (lista, index) {
    lista_listas.innerHTML += make_option("" + index, lista.ano
      + " - " + lista.ordinal + "ª " + lista.natureza);
  });
  lista_listas.value = "0";
  inserir_lista(lista_listas, false);
}

// caso o usuário selecione para usar uma das listas pré-selecionadas
function inserir_lista(elem, voluntario) {
  if (elem.value === "empty") {
    current_raw = "";
    return;
  }
  var lista = listas[parseInt(elem.value)];
  var url = "listas/" + lista.arquivo;
  // só alterar o ano e esvaziar os critérios se o ano tiver mudado
  if (!voluntario || (voluntario && ano_atual != lista.ano)) {
    usar_ano(lista.ano);
  }
  // encadear para obter as classificações de último convocado
  ajat(url, function(txt) {
    current_raw = txt;
    cuc = null;
    recontar();
    atualizar_cucs();
    // se houver cuc, ele será baixado!
    if (lista.cuc) {
      var cucfile = "cuc/cuc_" + lista.arquivo.replace("txt", "json");
      ajaj(cucfile, function (newcuc) {
        cuc = newcuc;
        atualizar_cucs();
      });
    }
  });
}

// gera uma lista de cursos para uma dada carreira
function gerar_menu_cursos(codcarreira) {
  if (codcarreira === "?") return ""
  // esperar os códigos baixarem
  while (!codigos) {};
  // começar com a opção de "qualquer curso"
  var resultado = make_option("*", "Qualquer curso");
  // achar a carreira em questão
  for (var c in codigos) {
    if (c != codcarreira) continue;
    var carreira = codigos[c];
    for (var codcurso in carreira["cursos"]) {
      // ...e gerar o menu
      var curso = carreira["cursos"][codcurso];
      resultado += make_option(codcurso, curso["nome_curso"] + " ("
        + codcurso + ")");
    }
    recontar();
    return resultado;
  }
  // a carreira em questão não existe
  return null;
}

// quantos critérios de procura temos
var procurados = 0;

// adiciona um curso para ser procurado
function add_procurado() {
  if (!current_raw) {
    alert("Espere a lista carregar!\nIsso pode demorar um pouco mais em dados"
      + " móveis.");
    return;
  }
  procurados++;
  var id_base = "procurado-" + procurados;
  var div = document.createElement("div");
  div.className = "procurado";
  var menu_carreiras = gerar_menu_carreiras();
  div.id = id_base;
  var seletor = "<select id=\"" + id_base
    + "-car\" onchange=\"update_procurado(" + procurados + ");\">"
    + menu_carreiras + "</select><select id=\"" + id_base + "-cur\""
    + "onchange=\"recontar(); atualizar_cuc(" + procurados + ");\"></select>";
  var cuc_container = "<span class=\"cuc\" id=\"" + id_base + "-cuc\"></span>";
  div.innerHTML = seletor + cuc_container + "<br><br>";
  criterios.appendChild(div);
}

// remove um curso para ser procurado
function remove_procurado() {
  if (procurados < 2) return;
  var alvo = document.getElementById("procurado-" + procurados);
  alvo.parentNode.removeChild(alvo);
  procurados--;
  recontar();
}

// atualiza a classificação do último colocado para um dado critério
function atualizar_cuc(n) {
  var id_base = "procurado-" + n;
  var cucelem = document.getElementById(id_base + "-cuc");
  if (cuc) {
    var car = document.getElementById(id_base + "-car").value;
    var cur = document.getElementById(id_base + "-cur").value;
    // descartar critérios que não tenham curso definido
    if (car == "?" || cur == "*") {
      cucelem.innerHTML = "";
      return;
    }
    var pares = [];
    var cuc_desejado = cuc[parseInt(car)][parseInt(cur)];
    for (var key in cuc_desejado) {
      pares.push(key + ": " + cuc_desejado[key]);
    }
    cucelem.innerHTML = "<br>Classificação do último convocado: " 
      + pares.join(", ");
    if (conta_um(car, cur) == 0) {
      cucelem.innerHTML += "<br><i>Cuidado! Ninguém passou nesse curso nessa"
        + " lista.<br>Isso se refere a uma lista anterior.</i>";
    }
  } else {
    // caso a lista atual não tenha cuc
    cucelem.innerHTML = "";
  }
}

// atualiza a cuc para todos os critérios
function atualizar_cucs() {
  for (var i = 1; i <= procurados; i++) {
    atualizar_cuc(i);
  }
}

// chamada quando temos que atualzar a lista de cursos de um certo critério
function update_procurado(n) {
  var id_base = "procurado-" + n;
  var car = document.getElementById(id_base + "-car").value;
  var cur = document.getElementById(id_base + "-cur");
  cur.innerHTML = gerar_menu_cursos(car);
  cur.value = "*";
  recontar();
  atualizar_cuc(n);
}

// gera uma lista de critérios [carreira, curso] que o usuário especificou
function todos_criterios() {
  var lista = [];
  for (var i = 1; i <= procurados; i++) {
    var id_base = "procurado-" + i;
    var car = document.getElementById(id_base + "-car").value;
    var cur = document.getElementById(id_base + "-cur").value;
    if (car === "?") continue; // pular carreiras vazias
    lista.push([car, cur]);
  }
  return lista;
}

// testa se um par [carreira, curso] se encaixa num certo critério
function match_criterio(alvo, criterio) {
  if (alvo[1][0] != criterio[0]) return false;
  // carreiras batem
  return criterio[1] === "*" || criterio[1] === alvo[1][1];
}

// testa se um par [carreira, curso] se encaixa em pelo menos um dos critérios
function match_geral(alvo) {
  return todos_criterios().reduce(function (passou, criterio) {
    return passou || match_criterio(alvo, criterio);
  }, false);
}

// procura relações [nome, [carreira, curso]] em listas de aprovados
function pesquisa_nomes() {
  var lista = listas[parseInt(lista_listas.value)];
  var tipo = lista.tipo;
  var regex_str = anos[lista.ano]["regexes"][tipo];
  var regex = new RegExp(regex_str, "gm");
  var resultado = [];
  var texto = current_raw;
  if (texto === null) {
    alert(
      "O texto da lista está sendo baixado, tente novamente em alguns segundos."
    );
  }
  do {
    var match = regex.exec(texto);
    if (!match) continue;
    var nome = match[1];
    var car = match[2];
    var cur = match[3];
    resultado.push([nome, [car, cur]]);
  } while (match);
  return resultado;
}

// gera a lista de nomes pessoas que entram no critério
function procura_matches() {
  return pesquisa_nomes().filter(function (alvo) {
    return match_geral(alvo);
  });
}

// retorna o número de aprovados num dado curso
function conta_um(car, cur) {
  return pesquisa_nomes().filter(function (alvo) {
    return match_criterio(alvo, [car, cur]);
  });
}

// atualiza a contagem de nomes
function recontar() {
  contagem.innerText = procura_matches().length;
}

// itera sobre cada candidato de uma lista
function iterar(lista, callback) {
  for (var cand of lista) {
    var nome = cand[0];
    var car = cand[1][0];
    var cur = cand[1][1];
    var carreira = car + " - " + codigos[car]["nome_carreira"];
    var curso = cur + " - " + codigos[car]["cursos"][cur]["nome_curso"];
    callback(nome, car, cur, carreira, curso);
  }
}

// converte os candidatos numa planilha HTML
function planilha(lista) {
  var html = "<table><tr><td><b>Nome</b></td><td><b>Carreira</b></td><td><b>"
    + "Curso</b></td></tr>";
  iterar(lista, function(nome, car, cur, carreira, curso) {
    html += "<tr><td>" + nome + "</td><td>" + carreira + "</td><td>" + curso
      + "</td></tr>";
  });
  html += "</table>";
  return html;
}

// converte os candidatos numa lista lindinha em texto puro
function txt(lista) {
  var maxcar = 0;
  var maxnome = lista.reduce(function (max, cand) {
    maxcar = Math.max(maxcar, codigos[cand[1][0]]["nome_carreira"].length);
    return Math.max(max, cand[0].length);
  }, 0);
  //lista = [["NOME", ["CARREIRA", "CURSO\n"]]] + lista;
  var resultado = "";
  var basepad = nspaces(6);
  iterar(lista, function (nome, car, cur, carreira, curso) {
    resultado += padspaces(nome, maxnome) + basepad
      + padspaces(carreira, maxcar) + basepad + curso + "\n";
  });
  return resultado;
}

// converte os candidados numa lista linda e maravilhosa em CSV
function csv(lista) {
  var resultado = "";
  iterar(lista, function (nome, car, cur, carreira, curso) {
    resultado += nome + "," + carreira + "," + curso + "\n";
  });
  return resultado;
}

// hora do show: gera o formato relevante e faz o que o usuário pediu
function hora_do_show() {
  // exigir pelo menos um critério
  if (todos_criterios().length < 1) {
    alert("Especifique pelo menos um curso ou carreira!");
    return;
  }
  var charset = "<html><head><meta charset=\"utf-8\">";
  // primeiro passo: gerar os dados relevantes
  var matches = procura_matches();
  var dados = null;
  var datatype = null;
  switch (formato.value) {
    case "xls":
      datatype = "data:application/vnd.ms-excel;base64,";
      dados = btoa(planilha(matches));
      break;
    case "html":
      datatype = "data:text/html;charset=utf-8,";
      dados = charset + "</head><body>" + planilha(matches) + "</body></html>";
      break;
    case "csv":
      datatype = "data:text/csv;charset=utf-8,"
      dados = csv(matches);
      break;
    case "txt":
    default:
      datatype = "data:text/plain;charset=utf-8,"
      dados = txt(matches);
      break;
  }
  // segundo passo: nova guia ou download
  if (destino.value === "guia") {
    // nova guia: usar um truque sujo para navegar para dataurl
    var href = datatype + encodeURIComponent(dados);
    var win = window.open();
    if (!win) {
      alert("Parece que seu navegador bloqueou a nova guia.\n"
        + "Permita o pop-up, ou selecione a opção de download!");
      return;
    }
    var iframe = "<iframe src=\"" + href  + "\" frameborder=\"0\" "
      + "style=\"border:0; top:0px; left:0px; bottom:0px; right:0px; "
      + "width:100%; height:100%; font-family: sans-serif;\" "
      + "allowfullscreen></iframe>";
    var html_begin = charset + "<title>Pesquisa "
      + "de Aprovados Fuvest</title><body style=\"overflow: hidden\">";
    var html_end = "</body></html>"
    win.document.open();
    win.document.write(html_begin + iframe + html_end);
    win.document.close();
    win.focus();
  } else {
    // download: usar um truque sujo para baixar dados puros
    var link = document.createElement("a");
    link.href = datatype + dados;
    link.download = "fuvest_aprovados." + formato.value;
    link.click();
  }
  // é isto.
}
