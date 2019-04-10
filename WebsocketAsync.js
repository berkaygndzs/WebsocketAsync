const uuidv4 = require('uuid/v4')

class WebsocketAsync {
  constructor(url) {
    // promise池
    this._promisePool = {}
    this._url = url
    this._connecting = false
  }

  open() {
    return new Promise((resolve, reject) => {
      if (this._connecting)reject('ws connecting...')

      this._connecting = true
      this._websocket = new WebSocket(this._url)
      this._websocket.onopen = (e) => {
        console.log('ws connected.')
        resolve(e)
      }
      this._websocket.onerror = (e) => {
        console.log('ws error.')
        this._connecting = false
        reject(e)
      }
      this._websocket.onmessage = (e) => {
        const json = JSON.parse(e.data)
        const key = json.token
        const req = this._promisePool[key]
        req.resolve(json)
        delete this._promisePool[key]
      }
    })
  }

  close() {
    this._websocket.close()
    this._connecting = false
  }

  async send(msg) {
    if (this._websocket == null || this._websocket.readyState !== 1) {
      this._connecting = false
      await this.open()
    }
    msg.token = uuidv4()
    return new Promise((resolve, reject) => {
      this._promisePool[msg.token] = {
        msg,
        resolve,
        reject
      }
      this._websocket.send(JSON.stringify(msg))
    })
  }
}
const wsa = new WebsocketAsync('ws://127.0.0.1:996')
export default wsa
