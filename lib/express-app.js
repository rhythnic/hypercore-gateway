import express from 'express'
import { hyperdriveHttpGateway } from './hyperdrive-http-gateway.js'

export function setupExpress ({ corestore }) {
  const app = express()

  app.use('/hyper', hyperdriveHttpGateway({
    corestore
  }))

  return app
}