with open('src/utils/translations.ts', 'r', encoding='utf8') as f:
    c = f.read()

c = c.replace("enterJobNumber: 'Enter Job Number (e.g. NP-1042)'", "enterJobNumber: 'Enter Tracking Token (e.g. JOB-1042)'")
c = c.replace("yourJobNumber: 'YOUR JOB NUMBER'", "yourJobNumber: 'YOUR TRACKING TOKEN'")
c = c.replace("copyJobCode: 'Copy Job Number'", "copyJobCode: 'Copy Tracking Token'")

c = c.replace("enterJobNumber: 'जब नम्बर प्रविष्ट गर्नुहोस् (जस्तै: NP-1042)'", "enterJobNumber: 'ट्याकिङ टोकन प्रविष्ट गर्नुहोस् (जस्तै: JOB-1042)'")
c = c.replace("yourJobNumber: 'तपाईंको जब नम्बर'", "yourJobNumber: 'तपाईंको ट्याकिङ टोकन'")
c = c.replace("copyJobCode: 'जब नम्बर कपी गर्नुहोस्'", "copyJobCode: 'ट्याकिङ टोकन कपी गर्नुहोस्'")

with open('src/utils/translations.ts', 'w', encoding='utf8') as f:
    f.write(c)
print('Done translations')
