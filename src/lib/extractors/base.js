export class BaseExtractor {
  constructor(url) {
    this.url = url;
  }

  async extract() {
    throw new Error('extract() must be implemented by subclass');
  }

  validateUrl() {
    throw new Error('validateUrl() must be implemented by subclass');
  }

  static isSupported(url) {
    throw new Error('isSupported() must be implemented by subclass');
  }
}
