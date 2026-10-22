with open('src/utils/translations.ts', 'r', encoding='utf8') as f:
    c = f.read()

c = c.replace("yourJobNumber: 'Your Job Number',", "yourJobNumber: 'Your Tracking Token',")
c = c.replace("yourJobNumber: 'Your Job Number'", "yourJobNumber: 'Your Tracking Token'")

with open('src/utils/translations.ts', 'w', encoding='utf8') as f:
    f.write(c)
print('Done translations case fix')
