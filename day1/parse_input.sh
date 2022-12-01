#/bin/bash

awk '{print "|" $0 ","}' input > formatted_input.py
sed -i 's/|,/],[/g' formatted_input.py
sed -i 's/|//g' formatted_input.py
sed -i '1i input=[[' formatted_input.py
echo "]]" >> formatted_input.py
