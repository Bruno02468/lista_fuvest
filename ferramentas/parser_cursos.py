#!/bin/env python3

# basicamente, o que esse programa faz é pegar o ctrl-c ctrl-v de um daqueles
# PDFs que a USP solta com a lista de carreiras e cursos, como esse aqui:
#       http://www.leginf.usp.br/wp-content/uploads/res7454-anexo-I.pdf
# e converte num JSON delicioso para o script da página ler e usar para montar
# os menuzinhos ao vivasso.

# sim, tudo isso foi preguiça de ir lendo o PDF e escrevendo na mão.
# e funciona lindamente. se você tiver uma ideia melhor, eu agradeço, crie uma
# issue no meu repositório e eu dou um jeito. se este programa parar de
# funcionar ou a lista de cursos mudar, me avise via issue também.
#       ~ borges

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

# armaezanr se a última coisa que vimos foi uma especificação de curso...
# isso é melhor explicado lá no final do for.
# mesma coisa pra carreiras agora...
ultimo_foi_carreira = False
ultimo_foi_curso = False

# como o nome da carreira fica na linha seguinte, caso isso seja especificado,
# a próxima linha encontrada vai virar o nome da carreira atual
waiting_for_carreira = False

# se por qualquer motivo devemos pular de linha...
pular_proxima = False

# regexes pré-compiladas para achar área, carreira e curso numa linha
rearea = re.compile(r"Área de (.+)")
recarreira = re.compile(r"Carreira (\d+)")
recurso = re.compile("Curso (\d+): (.+)")

# isso será convertido em JSON
resultado = {}

# ler as linhas do arquivo
with open(sys.argv[1]) as arquivo:
    linhas = arquivo.readlines()

# putz
if not len(linhas):
    printf("Erro ao ler o arquivo :(")

# iterar sobre cada linha
for linha in linhas:
    # pular linhas que mandaram pular:
    if pular_proxima:
        pular_proxima = False
        continue
    # remover whitespace desnecessário
    linha = linha.strip()
    # pular linhas vazias
    if not len(linha):
        continue
    # pular linhas técnicas
    if "Anexo" in linha:
        pular_proxima = True
        continue
    # estamos esperando por um nome de carreira?
    if waiting_for_carreira:
        resultado[codcarreira]["nome_carreira"] = linha
        nomecarreira = linha
        # desligar o aviso
        waiting_for_carreira = False
        ultimo_foi_curso = False
        ultimo_foi_carreira = True
        continue
    area = rearea.match(linha)
    # essa linha especifica a área, colocar ela no JSON e continuar
    # LER ÁREAS FOI REMOVIDO EU QUERO MORRER
    if area:
        nomearea = area.group(1)
        ultimo_foi_curso = False
        ultimo_foi_carreira = False
        continue
    carreira = recarreira.match(linha)
    # essa linha especifica uma carreira, adicionar na área atual e esperar pelo
    # nome de carreira na próxima linha
    if carreira:
        codcarreira = carreira.group(1)
        resultado[codcarreira] = {
            "nome_carreira": None,
            "cod_carreira": codcarreira,
            "area": nomearea,
            "cursos": {}
        }
        waiting_for_carreira = True
        ultimo_foi_curso = False
        ultimo_foi_carreira = False
        continue
    curso = recurso.match(linha)
    # essa linha especifica um curso, adicionar na carreira atual e prosseguir
    if curso:
        codcurso = curso.group(1)
        nomecurso = curso.group(2)
        resultado[codcarreira]["cursos"][codcurso] = {
            "nome_curso": nomecurso,
            "cod_curso": codcurso,
            "nome_carreira": nomecarreira,
            "cod_carreira": codcarreira,
            "area": nomearea
        }
        # avisar que a última coisa que vimos foi uma especificação de curso,
        # aí, caso tenha um curso cujo nome ocupou duas linhas no txt, e a
        # próxima linha tenha texto e não signifique um novo curso, ela será
        # a continuação do nome desse curso
        ultimo_foi_curso = True
        ultimo_foi_carreira = False
        continue
    # agora, encontramos uma linha que não significa nada em especial
    if ultimo_foi_curso:
        # e ela é continuação do nome do curso atual... eita. só concatenar.
        resultado[codcarreira]["cursos"][codcurso]["nome_curso"] += (
            " " + linha)
        continue
    # mesmo acima, para nomes de carreira
    if ultimo_foi_carreira:
        resultado[codcarreira]["nome_carreira"] += " " + linha
        continue

# converter para um JSON bonitinho, printar, e fim
print(json.dumps(resultado, indent=2, sort_keys=True, ensure_ascii=False))
