import CryptoJS from 'crypto-js';

export default class CryptoHelper {
  static decode(cipher) {
    return CryptoJS.AES.decrypt(cipher, Expo.Constants.installationId).toString(CryptoJS.enc.Utf8)
  }
  static encode(text) {
    return CryptoJS.AES.encrypt(text, Expo.Constants.installationId).toString();
  }
}