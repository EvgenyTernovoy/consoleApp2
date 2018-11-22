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

  const removeDir = resPath => {
    const dir = path.dirname(resPath)

    if (!fs.existsSync(dir)) {
      return
    }

    const files = fs.readdirSync(dir);

    if (files && files.length > 0 ) {
      return
    }

    rmdirPromise(dir).then(() => {
      const parentDir = path.normalize(`${dir}/..`)

      if (path.normalize(dir) === path.normalize(base)) {
        return
      }

      removeDir(parentDir)
    }).catch(err => {
      if (err.code === 'ENOENT') {
        console.error(err.path, ' – directory already deleted')
      }
    })
  };

  const removeFile = file => {
    unlinkPromise(file).then(() => {
      removeDir(file)
    }).catch(err => console.error(err))
  }

  const readDir = dir => {
    const files = fs.readdirSync(dir);

    files.forEach(item => {
      const localBase = path.join(dir, item);
      const stat = fs.statSync(localBase);

      if (stat.isFile()) {
        const dirName = item.slice(0, 1);
        const neededDir = path.join(targetDir, dirName);

        if (!fs.existsSync(neededDir)) {
          fs.mkdirSync(neededDir);
        }

        const filePath = path.join(neededDir, item);

        if (!fs.existsSync(filePath)) {
          linkPromise(localBase, path.join(neededDir, item)).then(resp => {
            if(!needDelete) {
              return
            }
            removeFile(localBase)
          }).catch(err => console.error(err))
          return
        }

        if (!needDelete) {
          return
        }

        removeFile(localBase)
      }

      if (stat.isDirectory()) {
        readDir(localBase);
      }
    });
  };
  readDir(base);
};

module.exports = createCollection;
