import http from 'http'
import { setupHyperspace } from './lib/hyperspace.js'
import { setupExpress } from './lib/express-app.js'

async function main () {
  const hyperspace = await setupHyperspace()
  const corestore = hyperspace.client.corestore()

  const expressApp = setupExpress({
    corestore
  })

  const server = http.createServer(expressApp)

  process.on('SIGINT', () => {
    server.stop()
    hyperspace.cleanup()
    process.exit(0)
  })

  const PORT = 8085
  server.listen(PORT, () => {
    console.log(`listening on ${PORT}`)
  })
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})