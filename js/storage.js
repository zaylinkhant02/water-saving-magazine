export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error("Unable to read local storage.", error);
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error("Unable to write local storage.", error);
      return false;
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error("Unable to remove a local storage value.", error);
    }
  }
};
