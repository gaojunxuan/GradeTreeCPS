export default class StringHelper {
  static removeLineBreaks(str) {
    return str.replace(/(\r\n|\n|\r)/gm, '').trim();
  }

  static removeSpaces(str) {
    return str.replace(/(\r\r|\n|\r)/gm, '').replace(/\s\s+/g, '\n').trim();
  }

  static getUserAgentString() {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36';
  }
}