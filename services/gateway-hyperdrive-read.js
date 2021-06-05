import Hyperdrive from 'hyperdrive'
import { extname } from 'path'
import replaceStream from 'replacestream'
import { hexToBase32, base32ToBuffer } from '../lib/hex-to-base32.js'

export const PUBLIC_KEY_PATTERN = '([0-9a-f]{64})' // using \d does not work
const PUBLIC_KEY_REGEX = new RegExp(PUBLIC_KEY_PATTERN, 'i')
const HYPER_URL_REGEX = new RegExp(`([^>])hyper://${PUBLIC_KEY_PATTERN}`, 'gi')
const BASE32_KEY_REGEX = new RegExp('[0-9ABCDEFGHJKMNPQRSTVWXYZ]{52}', 'i')

const WEB_APP_CODE_EXTENSIONS = ['.html', '.js', '.css']

const HYPER_URL_TRANSFORMER_CONFIG = {
  maxMatchLen: 73 // HYPER_URL_REGEX match length
}

const LOOKUP_CONFIG = {
  announce: false,
  lookup: true
}

const FORGET_CONFIG = {
  announce: false,
  lookup: false
}

export class GatewayHyperdriveRead {
  static toBase32 (key) {
    return hexToBase32(key)
  }

  static base32KeyIsValid(key) {
    return BASE32_KEY_REGEX.test(key)
  }

  static hyperUrlTransformer (scheme, host) {
    // const scheme = headers[HTTP2_HEADER_SCHEME]
    return replaceStream(
      HYPER_URL_REGEX,
      (_, preceedingChar, key) => `${preceedingChar}${scheme}://${this.toBase32(key)}.${host}`,
      HYPER_URL_TRANSFORMER_CONFIG
    )
  }

  constructor (client, base32Key, name) {
    this.client = client
    this.base32Key = base32Key
    this.keyBuffer = base32ToBuffer(base32Key)
    this.name = !name || name === '/' ? '/index.html' : name
    this.drive = new Hyperdrive(client.corestore(), this.keyBuffer)
  }

  keyIsValid () {
    return PUBLIC_KEY_REGEX.test(this.publicKeyBuffer.toString('hex'))
  }

  async ready () {
    await this.drive.promises.ready()
    await this.client.network.configure(this.drive.discoveryKey, LOOKUP_CONFIG)
  }

  async resolveStat() {
    try {
      const stat = await this.drive.promises.stat(this.name)
      return stat
    } catch (error) {
      if (error.code !== 'ENOENT' || extname(this.name)) throw error
      this.name = '/index.html'
      return this.resolveStat()
    }
  }

  createReadStream (scheme, host) {
    let stream = this.drive.createReadStream(this.name)
    return WEB_APP_CODE_EXTENSIONS.includes(extname(this.name))
      ? stream.pipe(this.constructor.hyperUrlTransformer(scheme, host))
      : stream
  }

  destroy () {
    return this.client.network.configure(drive.discoveryKey, FORGET_CONFIG)
  }
}