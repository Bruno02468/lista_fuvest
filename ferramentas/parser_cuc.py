#!/usr/bin/env python3

# este programa lê tabelas de classificação do último chamado (cuc)
# e converte para JSON. passe uma URL como primeiro argumento.
#   - borges 2019

import sys
import re
import json
import urllib.request
from html.parser import HTMLParser

# regexes usadas para se extrair dados dos text nodes, pré-compiladas
re_carreira = re.compile(r"Carreira (\d+)")
re_curso = re.compile(r"Curso (\d+)")

# modalidades
modalidades = ["AC", "EP", "PPI"]

# dict com os dados, será convertido em JSON

class CUCParser(HTMLParser):
  # armazenar o estado da leitura
  tag = None
  carreira = None
  curso = None
  modalidade = None
  cuc = {}

  def handle_starttag(self, tag, attrs):
    # armazenar a tag atual
    self.tag = tag

  def handle_data(self, texto):
    # só estamos interessados em dados de tabela
    if self.tag != "td" and self.tag != "br":
      return
    # detectamos uma carreira?
    match_carreira = re_carreira.search(texto)
    if match_carreira:
      self.carreira = match_carreira.group(1)
      self.cuc[self.carreira] = {}
      return
    # detectamos um curso?
    match_curso = re_curso.search(texto)
    if match_curso:
      self.curso = match_curso.group(1)
      self.cuc[self.carreira][self.curso] = {}
      return
    # ou quem sabe uma modalidade?
    if texto in modalidades:
      self.modalidade = texto
      return
    # estamos interessados em valores numéricos só se já estivermos com curso,
    # carreira e modalidade definidos!
    if texto.isdigit() and self.modalidade:
      self.cuc[self.carreira][self.curso][self.modalidade] = int(texto)
    # como o valor desejado é a última tag numérica, as anteriores são
    # descartadas não fazendo nenhuma checagem. legal, né?

  def resultado(self):
    return self.cuc

# agora, a rotina de inicialização do programa

# primeiro, ler a URL
if len(sys.argv) < 2:
  print("Especifique uma URL.")
  sys.exit(0)
url = sys.argv[1]
html = urllib.request.urlopen(url).read().decode("utf-8")

# agora, a extração
parser = CUCParser()
parser.feed(html)
resultado = parser.resultado()

# imprimir o JSON e sair
print(json.dumps(resultado, indent=2, sort_keys=True, ensure_ascii=False))
