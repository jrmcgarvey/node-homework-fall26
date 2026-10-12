const fs = require('fs');
const path = require('path');


// Write a sample file for demonstration
fs.writeFile(path.join(__dirname, 'sample.txt'), 'Hello, async world!', (err) => {
  if (err) {
    console.error('Error writing file:', err);
  } else {
    // 1. Callback style
    fs.readFile(path.join(__dirname, 'sample.txt'), 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file at 1:', err);
      } else {
        console.log(data);
        // 2. Promise style
        const readWithPromise = async (fn) => {
          return new Promise((resolve, reject) => { 
            fs.readFile(path.join(__dirname, fn), 'utf8', (err, data) => {
              if (err) {
                reject(err);
              }
              resolve(data);
            })
          })
        }
        readWithPromise('sample.txt').then((data) => { 
          console.log(data)
          // 3. async await style
          const run = async () => {
            try {
              data = await readWithPromise('sample.txt');
              console.log(data)
            } catch (err) {
              console.log('Error reading file at 3: ', err)
            }
          }
          run();
        }).catch((err)=> console.error('error reading file at 2', err))
      }

    })
  }
})



  // Callback hell example (test and leave it in comments):
  // const doClose = (fd) => {
  //     fs.close(fd, (err) => {
  //         if (err) console.error("couldn't close file");
  //     })
  // }
  // fs.open(path.join(__dirname, 'sample1.txt'), 'w', (err, fd) => {
  //   if (err) {
  //     console.log("error opening sample1: ", err) 
  //   } else {
  //     fs.write(fd, "line 1\n", (err) => {
  //       if (err) {
  //         console.error("couldn't write line 1", err);
  //         doClose(fd);
  //       } else {
  //         fs.write(fd, "line 2\n", (err) => {
  //           if (err) {
  //             console.error("couldn't write line 2", err)
  //             doClose(fd);
  //           } else {
  //             fs.write(fd, "line 3\n", (err) => {
  //               if (err) {
  //                 console.error("couldn't write line 3", err);
  //               }
  //             })
  //             doClose(fd);
  //           }
  //         })
  //       }
  //     })
  //   }
  // })


