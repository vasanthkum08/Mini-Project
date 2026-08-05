const fs = require('fs');
const readline = require('readline');

const logsPath = 'C:\\Users\\rpjee\\.gemini\\antigravity\\brain\\f7d4fbb7-21cb-42fb-a66f-16d8aa08cf19\\.system_generated\\logs\\transcript.jsonl';

const fileStream = fs.createReadStream(logsPath);

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  try {
    const json = JSON.parse(line);
    if (json.tool_calls) {
      json.tool_calls.forEach(tc => {
        if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          const file = tc.args.TargetFile;
          if (file && !file.includes('scratch') && !file.includes('task.md') && !file.includes('walkthrough.md') && !file.includes('implementation_plan.md')) {
            console.log(`Step ${json.step_index} | Tool: ${tc.name} | File: ${file}`);
          }
        }
      });
    }
  } catch (err) {
    // Ignore parse errors
  }
});
