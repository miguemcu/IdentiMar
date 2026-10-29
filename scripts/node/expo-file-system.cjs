// expo-file-system para Node: lee archivos reales; las escrituras no hacen nada.
const fs = require('fs');
const { fileURLToPath } = require('url');

const ruta = (uri) => (uri.startsWith('file:') ? fileURLToPath(uri) : uri);

class File {
  constructor(...partes) {
    this.uri = partes.map(String).join('/');
  }
  get exists() {
    return fs.existsSync(ruta(this.uri));
  }
  get size() {
    return fs.statSync(ruta(this.uri)).size;
  }
  async arrayBuffer() {
    const b = fs.readFileSync(ruta(this.uri));
    return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  }
  async text() {
    return 'null';
  }
  create() {}
  write() {}
  delete() {}
}

class Directory {
  constructor(...partes) {
    this.uri = partes.map(String).join('/');
  }
  get exists() {
    return true;
  }
  create() {}
  list() {
    return [];
  }
}

module.exports = { File, Directory, Paths: { document: 'doc', cache: 'cache' } };
