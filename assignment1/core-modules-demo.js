const os = require("os");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module

console.log("Platform: ", os.platform());
console.log("CPU: ", os.cpus());
console.log("Total Memory: ", os.totalmem());
console.log("free memory: ", os.freemem());

// Path module

const sampleFile = path.join(sampleFilesDir, "demo.txt");
console.log("Joined path: ", sampleFile);

// fs.promises API

const run = async (fn) => {
  await fsp.writeFile(fn, "Hello from fs.promises!", "utf8");
  const data = await fsp.readFile(fn, "utf8");
  console.log("fs.promises read:", data);
};

try {
  run(sampleFile);
} catch (err) {
  console.err("error in file operations: ", err);
}
// Streams for large files- log first 40 chars of each chunk
