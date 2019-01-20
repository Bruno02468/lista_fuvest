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
codcarreira = None
codcurso = None

# armaezanr se a última coisa que vimos foi uma especificação de curso...
# isso é melhor explicado lá no final do for.
ultimo_foi_curso = False

# como o nome da carreira fica na linha seguinte, caso isso seja especificado,
# a próxima linha encontrada vai virar o nome da carreira atual
waiting_for_carreira = False

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
    # remover whitespace desnecessário
    linha = linha.strip()
    # estamos esperando por um nome de carreira?
    if waiting_for_carreira:
        resultado[nomearea][codcarreira]["nome_carreira"] = linha
        # desligar o aviso
        waiting_for_carreira = False
        ultimo_foi_curso = False
        continue
    area = rearea.match(linha)
    # essa linha especifica a área, colocar ela no JSON e continuar
    if area:
        nomearea = area.group(1)
        resultado[nomearea] = {}
        ultimo_foi_curso = False
        continue
    carreira = recarreira.match(linha)
    # essa linha especifica uma carreira, adicionar na área atual e esperar pelo
    # nome de carreira na próxima linha
    if carreira:
        codcarreira = carreira.group(1)
        resultado[nomearea][codcarreira] = {
            "nome_carreira": None,
            "cod_carreira": codcarreira,
            "cursos": {}
        }
        waiting_for_carreira = True
        ultimo_foi_curso = False
        continue
    curso = recurso.match(linha)
    # essa linha especifica um curso, adicionar na carreira atual e prosseguir
    if curso:
        codcurso = curso.group(1)
        nomecurso = curso.group(2)
        resultado[nomearea][codcarreira]["cursos"][codcurso] = {
            "nome_curso": nomecurso,
            "cod_curso": codcurso
        }
        # avisar que a última coisa que vimos foi uma especificação de curso,
        # aí, caso tenha um curso cujo nome ocupou duas linhas no txt, e a
        # próxima linha tenha texto e não signifique um novo curso, ela será
        # a continuação do nome desse curso
        ultimo_foi_curso = True
        continue
    # agora, encontramos uma linha que não significa nada em especial
    if ultimo_foi_curso:
        # e ela é continuação do nome do curso atual... eita. só concatenar.
        resultado[nomearea][codcarreira]["cursos"][codcurso]["nome_curso"] += (
            " " + linha)
        continue

# converter para um JSON bonitinho, printar, e fim
print(json.dumps(resultado, indent=2, sort_keys=True, ensure_ascii=False))
