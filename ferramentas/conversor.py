#!/usr/bin/env python3
# este script permite a rápida conversão entre o .csv gerado ao exportar as
# planilhas onde digitamos os códigos de curso e carreira (com nomes), e também
# consegue fazer a conversão reversa (para gerar planilhas de exemplo)

import json, csv

_AREAS = ["Humanas", "Biológicas", "Exatas", "EXATAS", "HUMANAS", "BIOLOGICAS"]
_COLNAMES = ["cod_carreira", "nome_carreira", "area", "cod_curso", "nome_curso"]
_pnome = lambda x: int(x.codigo)

flatten = lambda t: [item for sublist in t for item in sublist]

class Carreira(object):
  def __init__(self, codigo, nome, area, cursos = None):
    if area not in _AREAS:
      raise ValueError(f"Área \"{area}\" inválida!")
    self.codigo = codigo
    self.nome = nome
    self.area = area
    self.cursos = cursos or []
  
  def cord(self):
    return sorted(self.cursos, key = _pnome)
  
  def toJSON(self):
    return {
      "cod_carreira": self.codigo,
      "nome_carreira": self.nome,
      "area": self.area,
      "cursos": { c.codigo: c.toJSON() for c in self.cord() }
    }
  
  def toCSV(self):
    return list(map(lambda c: c.toCSV(), self.cord()))
  
  @staticmethod
  def fromJSON(obj):
    carreira = Carreira(obj["cod_carreira"], obj["nome_carreira"], obj["area"])
    for cj in obj["cursos"].values():
      curso = Curso(cj["cod_curso"], cj["nome_curso"], carreira)
    carreira.cursos.sort(key = _pnome)
    return carreira

class Curso(object):
  def __init__(self, codigo, nome, carreira):
    self.codigo = codigo
    self.nome = nome
    self.carreira = carreira
    if self not in carreira.cursos:
      carreira.cursos.append(self)
  
  def toJSON(self):
    return {
      "area": self.carreira.area,
      "cod_carreira": self.carreira.codigo,
      "cod_curso": self.codigo,
      "nome_carreira": self.carreira.nome,
      "nome_curso": self.nome
    }
  
  def toCSV(self):
    return [
      self.carreira.codigo,
      self.carreira.nome,
      self.carreira.area,
      self.codigo,
      self.nome
    ]


# lista de carreiras para json
def l2j(carreiras):
  return {
    c.codigo: c.toJSON() for c in sorted(carreiras, key = _pnome)
  }

# json para lista de carreiras
def j2l(obj):
  return sorted(list(map(Carreira.fromJSON, obj.values())), key = _pnome)

# lista de carreiras para csv
def l2c(carreiras):
  return flatten(map(Carreira.toCSV, sorted(carreiras, key = _pnome)))

# csv para lista de carreiras
def c2l(cursos):
  carreiras = {}
  for cv in cursos:
    if int(cv["cod_carreira"]) in carreiras:
      car = carreiras[int(cv["cod_carreira"])]
    else:
      car = Carreira(cv["cod_carreira"], cv["nome_carreira"], cv["area"])
      carreiras[int(cv["cod_carreira"])] = car
    cur = Curso(cv["cod_curso"], cv["nome_curso"], car)
    car.cursos.append(cur)
  return list(carreiras.values())

# operação: csv para json
def op_csv2json(infile, outfile):
  leitor = csv.DictReader(infile)
  json.dump(l2j(c2l(leitor)), outfile, indent = 2, ensure_ascii = False)

# operação: json para csv
def op_json2csv(infile, outfile):
  escritor = csv.DictWriter(outfile, _COLNAMES)
  escritor.writeheader()
  escritor.writerows(
    map(lambda a: dict(zip(_COLNAMES, a)), l2c(j2l(json.load(infile))))
  )

ops = { "csv2json": op_csv2json, "json2csv": op_json2csv }

# main
def main(argc, argv):
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
