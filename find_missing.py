import os, re

storage_path = 'src/utils/storage.ts'
with open(storage_path, 'r', encoding='utf8') as f:
    storage_code = f.read()

exports = set(re.findall(r'export\s+(?:const|function|let|var)\s+([a-zA-Z0-9_]+)', storage_code))

imported = set()
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            with open(os.path.join(root, file), 'r', encoding='utf8') as f:
                code = f.read()
            matches = re.finditer(r'import\s+\{([^}]+)\}\s+from\s+[\'\"].*?utils/storage[\'\"]', code)
            for m in matches:
                names = m.group(1).split(',')
                for n in names:
                    n = n.strip()
                    if n:
                        imported.add(n)

missing = imported - exports
print('MISSING:', missing)

with open(storage_path, 'a', encoding='utf8') as f:
    for m in missing:
        if m == 'getAuthSession':
            f.write('\nexport const ' + m + ' = () => null;')
        else:
            f.write('\nexport const ' + m + ' = () => {};')
