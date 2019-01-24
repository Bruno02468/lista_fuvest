#!/bin/env python3

# mesma função que o outro parser, só que esse extrai os cursos da lista
# que vem com o edital da fuvest

# importar bibliotecas relevantes
import sys
import re
import json

# exigir nome de arquivo especificado nas opções de terminal
if len(sys.argv) < 2:
    print("Especifique um nome de arquivo.")
    sys.exit(0)

# armazenar informações parciais de cada curso
nomearea = None
nomecarreira = None
codcarreira = None
codcurso = None

getting = "none"

# regexes pré-compiladas para achar área, carreira e curso numa linha
rearea = re.compile(r"Área de (.+)")
recarreira = re.compile(r"CARREIRA (\d+)")
recurso = re.compile(r"Curso (\d+): (.+)")
repara = re.compile(r"^(\*)|(Período:)")

# isso será convertido em JSON
resultado = {}

# ler as linhas do arquivo
with open(sys.argv[1]) as arquivo:
    linhas = arquivo.readlines()

# putz
if not len(linhas):
    printf("Erro ao ler o arquivo :(")

for linha in linhas:
    linha = linha.strip()
    area = rearea.match(linha)
    carreira = recarreira.match(linha)
    curso = recurso.match(linha)
    para = repara.match(linha)
    if para:
        getting = "none"
        continue
    if area:
        nomearea = area.group(1)
        getting = "none"
        continue
    if carreira:
        codcarreira = carreira.group(1)
        resultado[codcarreira] = {
            "area": nomearea,
            "cod_carreira": codcarreira,
            "cursos": {},
            "nome_carreira": ""
        }
        getting = "carreira"
        nomecarreira = ""
        continue
    if curso:
        codcurso = curso.group(1)
        nomecurso = curso.group(2)
        getting = "curso"
        resultado[codcarreira]["cursos"][codcurso] = {
            "area": nomearea,
            "cod_carreira": codcarreira,
            "cod_curso": codcurso,
            "nome_carreira": nomecarreira,
            "nome_curso": nomecurso
        }
        getting = "curso"
        continue
    if getting == "carreira":
        nomecarreira += linha + " "
        resultado[codcarreira]["nome_carreira"] += linha + " "
        continue
    if getting == "curso":
        resultado[codcarreira]["cursos"][codcurso]["nome_curso"] += " " + linha
        continue
    getting = "none"

# converter para um JSON bonitinho, printar, e fim
print(json.dumps(resultado, indent=2, sort_keys=True, ensure_ascii=False))
