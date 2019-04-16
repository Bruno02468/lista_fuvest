#!/usr/bin/env sh

# este programa é usado para chamar automaticamente o parser_cuc.py
# sim, foi pra economizar tempo mesmo
#   - borges 2019

echo "ano?"
read ano

while :
do
	echo "natureza+ordinal?"
	read id
	echo "url?"
	read url
	./parser_cuc.py $url > "cuc_${ano}_$id.json"
done
