const fs = require('fs');

const logPath = 'C:/Users/xurso/.gemini/antigravity/brain/1f41c951-3770-4c28-b3a5-9ec7d6970fb8/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const j = JSON.parse(line);
        if ([137, 141, 145, 148].includes(j.step_index)) {
            if (j.tool_calls) {
                for (const tc of j.tool_calls) {
                    if (tc.name === 'write_to_file') {
                        const targetPath = tc.args.TargetFile.replace(/^"|"$/g, '');
                        const code = tc.args.CodeContent.replace(/^"|"$/g, '');
                        // code was stringified JSON so we should parse it if it was stringified, or just use it.
                        // Wait, args is already parsed. CodeContent is a string.
                        // Oh, wait, in JSONL, the string might not have quotes if it's already parsed! 
                        // Let's just JSON.parse(tc.args.TargetFile) to get the real string if it's a quoted string? No, in node, JSON.parse already returned an object. So tc.args.TargetFile is just the string, but wait, the output of my console logging was `"c:\Users\xurso..."`. That means the AI API's tool call args had JSON strings inside the string value? 
                        // Yes, because tool arguments were passed as stringified JSON strings sometimes. Wait, no, Gemini passes the entire `args` as an object, but sometimes values are strings containing quotes.
                        // I'll just replace surrounding quotes. 
                        
                        let codeClean = code;
                        if (code.startsWith('"') && code.endsWith('"')) {
                            try { codeClean = JSON.parse(code); } catch(e) { codeClean = code.replace(/^"|"$/g, ''); }
                        }
                        
                        fs.writeFileSync(targetPath.replace(/^"|"$/g, ''), codeClean);
                        console.log('Restored: ' + targetPath);
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error parsing line:', e.message);
    }
}
