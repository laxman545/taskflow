import os
import re

def walk(directory):
    files = []
    for root, _, filenames in os.walk(directory):
        for name in filenames:
            if name.endswith('.ts') or name.endswith('.tsx'):
                files.append(os.path.join(root, name))
    return files

for f in walk('src'):
    with open(f, 'r', encoding='utf8') as file:
        c = file.read()
    
    orig = c
    
    # Fix component props definitions and usages
    c = c.replace('\n  "",', '')
    c = c.replace('\n  ""={""}', '')
    
    if orig != c:
        with open(f, 'w', encoding='utf8') as file:
            file.write(c)

print("Done")
