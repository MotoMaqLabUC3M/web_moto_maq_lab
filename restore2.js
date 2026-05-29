const fs = require('fs');

const logPath = 'C:/Users/xurso/.gemini/antigravity/brain/1f41c951-3770-4c28-b3a5-9ec7d6970fb8/.system_generated/logs/transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
    if (!line) continue;
    try {
        const j = JSON.parse(line);
        if (j.step_index === 131) {
            if (j.tool_calls) {
                for (const tc of j.tool_calls) {
                    if (tc.name === 'write_to_file') {
                        let code = tc.args.CodeContent;
                        if (code.startsWith('"') && code.endsWith('"')) {
                            try { code = JSON.parse(code); } catch(e) { code = code.replace(/^"|"$/g, ''); }
                        }
                        fs.writeFileSync('assets/css/ms8_original.css', code);
                        console.log('Restored ms8_original.css');
                    }
                }
            }
        }
    } catch (e) {}
}
