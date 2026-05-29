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
                        let targetPath = tc.args.TargetFile;
                        let code = tc.args.CodeContent;
                        
                        // remove quotes if it was double-encoded
                        if (targetPath.startsWith('"') && targetPath.endsWith('"')) {
                            targetPath = targetPath.substring(1, targetPath.length - 1);
                        }
                        
                        if (code.startsWith('"') && code.endsWith('"')) {
                            code = code.substring(1, code.length - 1);
                        }
                        
                        // replace literal \n with actual newlines
                        code = code.replace(/\\n/g, '\n');
                        code = code.replace(/\\"/g, '"');
                        code = code.replace(/\\\\/g, '\\');
                        
                        fs.writeFileSync(targetPath, code);
                        console.log('Restored correctly: ' + targetPath);
                    }
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
}
