var icar = document.getElementById("car");
var incar = document.getElementById("ncar");
var icur = document.getElementById("cur");
var incur = document.getElementById("ncur");
var t = document.getElementById("t");

var dados = {};

function inserir() {
    var car = icar.value;
    var ncar = incar.value;
    var cur = icur.value;
    var ncur = incur.value;
    console.log("yea");
    if (!dados.hasOwnProperty(car)) {
        dados[car] = {
            "cod_carreira": car,
            "nome_carreira": ncar,
            "area": "FIXME",
            "cursos": {}
        };
    }
    dados[car]["cursos"][cur] = {
        "area": "FIXME",
        "cod_carreira": car,
        "cod_curso": cur,
        "nome_carreira": ncar,
        "nome_curso": ncur
    };
    icur.value = "";
    incur.value = "";
    icur.focus();
    return false;
}

function gerar() {
    t.value = JSON.stringify(dados, null, 2);
}
