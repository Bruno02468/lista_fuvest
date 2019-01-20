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

// elementos da DOM que eu vou usar com frequência
const criterios = document.getElementById("criterios");
const tipo_lista = document.getElementById("origem_lista");
const textarea = document.getElementById("lista");
const formato = document.getElementById("formato");
const cachorro = document.getElementById("cachorro");

// primeiramente, vamos puxar a lista de códigos de curso e carreira.
var codigos = null;
var ajaj = new XMLHttpRequest();
ajaj.onreadystatechange = function() {
if (this.readyState == 4 && this.status == 200) {
        codigos = JSON.parse(this.responseText);
        gerar_menu_carreiras();
    }
};
ajaj.open("GET", "codigos.json", true);
ajaj.send();

// segundamente, gerar um menu para lista de carreiras
// coloquei numa função porque temos que esperar o JSON carregar
var menu_carreiras = make_option("?", "Especifique uma carreira...");
function gerar_menu_carreiras() {
    // iterar sobre cada carreira...
    for (var c in codigos) {
        var carreira = codigos[c];
        // ...e gerar um item de menu
        menu_carreiras += make_option(c, carreira["nome_carreira"] + " (" + c
            + ")");
    }
    // sempre começar com um curso
    add_procurado();
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
        return resultado;
    }
    // a carreira em questão não existe
    return null;
}

// quantos critérios de procura temos
var procurados = 0;

// adiciona um curso para ser procurado
function add_procurado() {
    procurados++;
    var id_base = "procurado-" + procurados;
    var seletor = "<div id=\"" + id_base + "\"><select id=\"" + id_base
        + "-car\" onchange=\"update_procurado(" + procurados + ");\">"
        + menu_carreiras + "</select> - <select id=\"" + id_base + "-cur\">"
        + "</select></div>";
    criterios.innerHTML += seletor;
}

// remove um curso para ser procurado
function remove_procurado() {
    if (procurados < 2) return;
    var alvo = document.getElementById("procurado-" + procurados);
    alvo.parentNode.removeChild(alvo);
    procurados--;
}

// chamada quando temos que atualzar a lista de cursos de um certo critério
function update_procurado(n) {
    var id_base = "procurado-" + n;
    var car = document.getElementById(id_base + "-car").value;
    var cur = document.getElementById(id_base + "-cur");
    cur.innerHTML = gerar_menu_cursos(car);
    cur.value = "*";
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
    var modalidade = tipo_lista.value;
    var regex_linha = null;
    var resultado = [];
    if (modalidade === "pdf") {
        regex_linha = /(.+) \d+ (\d+)−(\d+)/g;
    } else if (modalidade === "txt") {
        regex_linha = /(.+) +\d+ (\d+)-(\d+)/g;
    } else {
        return [];
    }
    var linhas = textarea.value.split("\n");
    for (linha of linhas) {
        var match = regex_linha.exec(linha);
        if (!match) continue;
        var nome = match[1];
        var car = match[2];
        var cur = match[3];
        resultado.push([nome, [car, cur]]);
    }
    return resultado;
}

// gera a lista de nomes pessoas que entram no critério
function procura_matches() {
    return pesquisa_nomes().filter(function (alvo) {
        return match_geral(alvo);
    });
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

// cria um link virtual para os dados


// hora do show: gerar os dados pedidos e mostrar pro usuário!
function hora_do_show() {
    var quero = formato.value;
    var matches = procura_matches();
    if (!matches.length) {
        cachorro.innerHTML = "";
    }
    if (quero === "lista") {
        // gerar lista em texto puro numa nova guia
        var dados = encodeURIComponent(txt(matches));
        var href = "data:text/plain," + dados;
        var win = window.open();
        win.document.write("<iframe src=\"" + href  + "\" frameborder=\"0\" "
            + "style=\"border:0; top:0px; left:0px; bottom:0px; right:0px; "
            + "width:100%; height:100%;\" allowfullscreen></iframe>");
    } else if (quero === "html") {
        // planilha HTML numa nova guia
        var dados = encodeURIComponent(planilha(matches));
        var href = "data:text/html," + dados;
        var win = window.open();
        win.document.write("<iframe src=\"" + href  + "\" frameborder=\"0\" "
            + "style=\"border:0; top:0px; left:0px; bottom:0px; right:0px; "
            + "width:100%; height:100%;\" allowfullscreen></iframe>");
    } else if (quero == "xls") {
        // xls para download
        var dados = btoa(planilha(matches));
        var lel = document.createElement("a");
        var data_type = "data:application/vnd.ms-excel";
        lel.href = data_type + ";base64," + dados;
        lel.download = "fuvest_aprovados.xls";
        lel.click();
    }
}
