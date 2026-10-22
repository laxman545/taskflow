with open('src/utils/storage.ts', 'r', encoding='utf8') as f:
    c = f.read()
c = c.replace('""', 'pc')
with open('src/utils/storage.ts', 'w', encoding='utf8') as f:
    f.write(c)
