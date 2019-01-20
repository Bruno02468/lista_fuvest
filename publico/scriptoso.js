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

// elementos da DOM que eu vou usar com frequência
const criterios = getElementById("criterios");

// primeiramente, vamos puxar a lista de códigos de curso e carreira.
var codigos = null;
var ajaj = new XMLHttpRequest();
ajaj.onreadystatechange = function() {
if (this.readyState == 4 && this.status == 200) {
        codigos = JSON.parse(this.responseText);
        gerar_menu_carreiras();
    }
};

// segundamente, gerar um menu para lista de carreiras
// coloquei numa função porque temos que esperar o JSON carregar
var menu_carreiras = make_option("?", "Especifique uma carreira...");
function gerar_menu_carreiras() {
    // iterar sobre cada área...
    for (var a in codigos) {
        var area = codigos[a];
        // ...cada carreira...
        for (var c in area) {
            var carreira = area[c];
            // ...e gerar um item de menu
            menu_carreiras += make_option(c, c + " - "
                + carreira["nome_carreira"])
        }
    }
}

// gera uma lista de cursos para uma dada carreira
function gerar_menu_cursos(codcarreira) {
    if (codcarreira === "?") return ""
    // esperar os códigos baixarem
    while (!codigos) {};
    // começar com a opção de "qualquer curso"
    var resultado = make_option("*", "Qualquer curso");
    // achar a carreira em questão
    for (var a in codigos) {
        var area = codigos[a];
        for (var c in area) {
            if (c != codcarreira) continue;
            var carreira = area[c];
            for (var codcurso in carreira["cursos"]) {
                // ...e gerar o menu
                var curso = carreira["cursos"][codcurso];
                resultado += make_option(codcurso, codcurso + " - "
                    + curso["nome_curso"]);
            }
            return resultado;
        }
    }
    // a carreira em questão não existe
    return null;
}

// quantos critérios de procura temos
var procurados = 0;

// adiciona um curso para ser procurado
function add_curso() {
    procurados++;
    var id_base = "procurado-" + procurados;
    var seletor = "<div id=\"" + id_base + "\"><select id=\"" + id_base
        + "-car\" onchange=\"update_procurado(" + procurados + ");\">"
        + menu_carreiras + "</select> - <select id=\"" + id_base + "-cur\">"
        + "</select></div>";
    criterios.innerHTML += seletor;
}

// sempre começar com um curso
add_curso();

// remove um curso para ser procurado
function remove_curso() {
    var alvo = getElementById("procurado-" + procurados);
    alvo.parentNode.removeChild(alvo);
    procurados--;
}

// chamada quando temos que atualzar a lista de cursos de um certo critério
function update_procurado(n) {
    var id_base = "procurado-" + n;
    var car = getElementById(id_base + "-car").value;
    var cur = getElementById(id_base + "-cur");
    car.innerHTML = gerar_menu_cursos(car);
    car.value = "*";
}

// gera uma lista de critérios [carreira, curso] que o usuário especificou
function criterios() {
    var lista = [];
    for (var i = 1; i <= procurados; i++) {
        var id_base = "procurado-" + i;
        var car = getElementById(id_base + "-car").value;
        var cur = getElementById(id_base + "-cur").value;
        lista.push([car, cur]);
    }
    return lista;
}

// testa se um par [carreira, curso] se encaixa num certo critério
function match_criterio(alvo, criterio) {
    if (alvo[0] != criterio[0]) return false;
    // carreiras batem
    return criterio[1] === "*" || criterio[1] === alvo[1];
}

// testa se um par [carreira, curso] se encaixa em pelo menos um dos critérios
function match_geral(alvo) {
    var criterios = criterios();
    return criterios.reduce(function (passou, criterio) {
        return passou || match_criterio(alvo, criterio);
    }, false);
}
