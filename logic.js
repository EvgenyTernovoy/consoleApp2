const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify

const linkPromise = promisify(fs.link)
const unlinkPromise = promisify(fs.unlink)
const rmdirPromise = promisify(fs.rmdir)

const createCollection = (base, targetDir, needDelete) => {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(path.join(__dirname, targetDir));
  }

  const removeDir = dir => {
    if (!fs.existsSync(dir)) {
      return
    }

    const files = fs.readdirSync(dir);

    if (files.length > 0) {
      files.map(file => removeDir(path.join(dir, file)))
    }

    rmdirPromise(dir).then(() => {
      const parentDir = path.normalize(`${dir}/..`)

      if (path.normalize(dir) === path.normalize(base)) {
        return
      }

      removeDir(parentDir)
    })
  };

  const removeFiles = files => files.map(file => {
    return unlinkPromise(file)
  })

  const copyFiles = files => files.map(file => {
    const fileName = path.basename(file)
    const neededDir = path.join(targetDir, fileName.slice(0, 1));

    const filePath = path.join(neededDir, fileName)

    if (fs.existsSync(filePath)) {
      return null
    }

    if (!fs.existsSync(neededDir)) {
      fs.mkdirSync(neededDir);
    }

    return linkPromise(file, filePath)
  }).filter(item => item)

  const readDir = dir => {
    const files = fs.readdirSync(dir);

    return files.reduce((acc, item) => {
      const localBase = path.join(dir, item);
      const stat = fs.statSync(localBase);

      if (stat.isFile()) {
        return [...acc, localBase]
      }

      if (stat.isDirectory()) {
        return [...acc, ...readDir(localBase)]
      }

    }, [])
  };

  const files = readDir(base);

  Promise.all(copyFiles(files)).then(() => {

    if (needDelete) {
      return Promise.all(removeFiles(files)).then(
        removeDir(base)
      ).catch(err => {
        console.log(err)
      })
    }
    return null
  }).then(() => {
    console.log('Directory copied')
  }).catch(err => {
    process.exit(500)
  })
};

module.exports = createCollection;

