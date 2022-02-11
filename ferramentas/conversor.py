#!/usr/bin/env python3
# este script permite a rápida conversão entre o .csv gerado ao exportar as
# planilhas onde digitamos os códigos de curso e carreira (com nomes), e também
# consegue fazer a conversão reversa (para gerar planilhas de exemplo)

from io import TextIOWrapper
import json, csv
from typing import Optional, List, Dict, Any

_AREAS = ["Humanas", "Biológicas", "Exatas", "EXATAS", "HUMANAS", "BIOLOGICAS"]
_COLNAMES = ["cod_carreira", "nome_carreira", "area", "cod_curso", "nome_curso"]
_pnome = lambda x: int(x.codigo)

flatten = lambda t: [item for sublist in t for item in sublist]

class Carreira(object):
  def __init__(
    self,
    codigo: str,
    nome: str,
    area: str,
    cursos: Optional[List["Curso"]] = None,
    cidade: Optional[str] = None
  ):
    if area not in _AREAS:
      raise ValueError(f"Área \"{area}\" inválida!")
    self.codigo: str = codigo
    self.nome: str = nome
    self.area: str = area
    self.cursos: List["Curso"] = cursos or []
    self.cidade: str = cidade
  
  def cursos_sorted(self) -> List["Curso"]:
    return sorted(self.cursos, key = _pnome)
  
  def toJSON(self) -> Dict[str, Any]:
    obj = {
      "cod_carreira": self.codigo,
      "nome_carreira": self.nome,
      "area": self.area,
      "cursos": { c.codigo: c.toJSON() for c in self.cursos_sorted() }
    }
    if self.cidade is not None:
      obj["cidade"] = self.cidade
    return obj
  
  def toCSV(self) -> List[str]:
    return list(map(lambda c: c.toCSV(), self.cursos_sorted()))
  
  @staticmethod
  def fromJSON(obj: Dict[str, str]) -> "Carreira":
    carreira = Carreira(
      obj["cod_carreira"],
      obj["nome_carreira"],
      obj["area"],
      cidade = obj.get("cidade")
    )
    for cj in obj["cursos"].values():
      curso = Curso(cj["cod_curso"], cj["nome_curso"], carreira)
    carreira.cursos.sort(key = _pnome)
    return carreira

class Curso(object):
  def __init__(self, codigo: str, nome: str, carreira: Carreira):
    self.codigo: str = codigo
    self.nome: str = nome
    self.carreira: Carreira = carreira
    if self not in carreira.cursos:
      carreira.cursos.append(self)
  
  def toJSON(self) -> Dict[str, str]:
    return {
      "area": self.carreira.area,
      "cod_carreira": self.carreira.codigo,
      "cod_curso": self.codigo,
      "nome_carreira": self.carreira.nome,
      "nome_curso": self.nome
    }
  
  def toCSV(self) -> List[str]:
    return [
      self.carreira.codigo,
      self.carreira.nome,
      self.carreira.area,
      self.codigo,
      self.nome
    ]


# lista de carreiras para json
def l2j(carreiras: List[Carreira]) -> Dict["str", Any]:
  return {
    c.codigo: c.toJSON() for c in sorted(carreiras, key = _pnome)
  }

# json para lista de carreiras
def j2l(obj: Dict[str, Any]) -> List[Carreira]:
  return sorted(list(map(Carreira.fromJSON, obj.values())), key = _pnome)

# lista de carreiras para csv
def l2c(carreiras: List[Carreira]) -> List[List[str]]:
  return flatten(map(Carreira.toCSV, sorted(carreiras, key = _pnome)))

# csv para lista de carreiras
def c2l(cursos: List[Dict[str, str]]) -> List[Carreira]:
  carreiras = {}
  for cv in cursos:
    if int(cv["cod_carreira"]) in carreiras:
      car = carreiras[int(cv["cod_carreira"])]
    else:
      car = Carreira(
        cv["cod_carreira"],
        cv["nome_carreira"],
        cv["area"],
        cidade = cv.get("cidade")
      )
      carreiras[int(cv["cod_carreira"])] = car
    cur = Curso(cv["cod_curso"], cv["nome_curso"], car)
    car.cursos.append(cur)
  return list(carreiras.values())

# operação: csv para json
def op_csv2json(
  infile: TextIOWrapper,
  outfile: TextIOWrapper
) -> Dict[str, Any]:
  leitor = csv.DictReader(infile)
  json.dump(l2j(c2l(leitor)), outfile, indent = 2, ensure_ascii = False)

# operação: json para csv
def op_json2csv(
  infile: TextIOWrapper,
  outfile: TextIOWrapper
) -> List[List[str]]:
  escritor = csv.DictWriter(outfile, _COLNAMES)
  escritor.writeheader()
  escritor.writerows(
    map(lambda a: dict(zip(_COLNAMES, a)), l2c(j2l(json.load(infile))))
  )

ops = { "csv2json": op_csv2json, "json2csv": op_json2csv }

# main
def main(argc: int, argv: List[str]):
  try:
    _, opn, ifn, ofn = argv
    op = ops[opn]
  except:
    print("Especifique operação (csv2json ou json2csv) e arquivos in/out.")
    return -1
  try:
    infile = open(ifn, "r")
    outfile = open(ofn, "w")
  except:
    print("Impossível abrir pelo menos um arquivo!")
    return -1
  print(f"Executando conversão {opn}...")
  op(infile, outfile)
  print("Pronto.")

# ponto de entrada
if __name__ == "__main__":
  from sys import argv
  exit(main(len(argv), argv))
