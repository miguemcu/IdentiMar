// expo-secure-store para Node: guarda en memoria mientras dura el proceso.
const datos = new Map();

module.exports = {
  async getItemAsync(clave) {
    return datos.get(clave) ?? null;
  },
  async setItemAsync(clave, valor) {
    datos.set(clave, valor);
  },
  async deleteItemAsync(clave) {
    datos.delete(clave);
  },
};
