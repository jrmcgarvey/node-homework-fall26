const os = require('os');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises')

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module

console.log("platform: ", os.platform())
console.log("cpus: ", os.cpus())
console.log("total memory: ", os.totalmem())
console.log("free memory: ", os.freemem())


// Path module

const sampleFile = path.join(sampleFilesDir, 'demo.txt')
console.log("file to create: ", sampleFile)


// fs.promises API

const run = async (fn) => {
  await fsp.writeFile(fn, "Hello from fs.promises!", "utf8" )
  const data = await fsp.readFile( fn, "utf8")
  console.log(data)
}

try {
  run(sampleFile)
} catch (err) {
  console.err("error in file operations: ", err)
}
// Streams for large files- log first 40 chars of each chunk
