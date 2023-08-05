#!/usr/bin/env node
require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const micro = require('micro')
const { text: parseText, json: parseJson, send } = require('micro')

console.log('Starting server...')

const argv = yargs(hideBin(process.argv))
  .command('dev [entry] [port]', 'start the server', (yargs) => {
    yargs.positional('entry', {
      describe: 'entrypoint of the function',
    })
    yargs.positional('port', {
      describe: 'port to bind on',
      default: 3000,
    })
  })
  .help().argv

const functionPath = path.join(process.cwd(), argv.entry)

const server = micro(async (req, res) => {
  const timeout = req.headers[`x-open-runtimes-timeout`] ?? ''
  let safeTimeout = null
  if (timeout) {
    if (isNaN(timeout) || timeout === 0) {
      return send(
        res,
        500,
        'Header "x-open-runtimes-timeout" must be an integer greater than 0.'
      )
    }

    safeTimeout = +timeout
  }

  const logs = []
  const errors = []

  const contentType = req.headers['content-type'] ?? 'text/plain'
  const bodyRaw = await parseText(req)
  let body = bodyRaw

  if (contentType.includes('application/json')) {
    body = await parseJson(req)
  }

  const headers = {}
  Object.keys(req.headers)
    .filter((header) => !header.toLowerCase().startsWith('x-open-runtimes-'))
    .forEach((header) => {
      headers[header.toLowerCase()] = req.headers[header]
    })

  const scheme = req.headers['x-forwarded-proto'] ?? 'http'
  const defaultPort = scheme === 'https' ? '443' : '80'
  const host = req.headers['host'].includes(':')
    ? req.headers['host'].split(':')[0]
    : req.headers['host']
  const port = +(req.headers['host'].includes(':')
    ? req.headers['host'].split(':')[1]
    : defaultPort)
  const path = req.url.includes('?') ? req.url.split('?')[0] : req.url
  const queryString = req.url.includes('?') ? req.url.split('?')[1] : ''
  const query = {}
  for (const param of queryString.split('&')) {
    let [key, ...valueArr] = param.split('=')
    const value = valueArr.join('=')

    if (key) {
      query[key] = value ?? ''
    }
  }

  const url = `${scheme}://${host}${
    port.toString() === defaultPort ? '' : `:${port}`
  }${path}${queryString === '' ? '' : `?${queryString}`}`

  const context = {
    req: {
      bodyRaw,
      body,
      headers,
      method: req.method,
      host,
      scheme,
      query,
      queryString,
      port,
      url,
      path,
    },
    res: {
      send: function (body, statusCode = 200, headers = {}) {
        return {
          body: body,
          statusCode: statusCode,
          headers: headers,
        }
      },
      json: function (obj, statusCode = 200, headers = {}) {
        headers['content-type'] = 'application/json'
        return this.send(JSON.stringify(obj), statusCode, headers)
      },
      empty: function () {
        return this.send('', 204, {})
      },
      redirect: function (url, statusCode = 301, headers = {}) {
        headers['location'] = url
        return this.send('', statusCode, headers)
      },
    },
    log: function (message) {
      if (message instanceof Object || Array.isArray(message)) {
        console.log(JSON.stringify(message))
      } else {
        console.log(message)
      }
    },
    error: function (message) {
      if (message instanceof Object || Array.isArray(message)) {
        console.error(JSON.stringify(message))
      } else {
        console.error(message)
      }
    },
  }

  let output = null

  async function execute() {
    let userFunction
    try {
      userFunction = require(functionPath)
    } catch (err) {
      if (err.code === 'ERR_REQUIRE_ESM') {
        userFunction = await import(functionPath)
      } else {
        throw err
      }
    }

    if (
      !(
        userFunction ||
        userFunction.constructor ||
        userFunction.call ||
        userFunction.apply
      )
    ) {
      throw new Error('User function is not valid.')
    }

    if (userFunction.default) {
      if (
        !(
          userFunction.default.constructor ||
          userFunction.default.call ||
          userFunction.default.apply
        )
      ) {
        throw new Error('User function is not valid.')
      }

      output = await userFunction.default(context)
    } else {
      output = await userFunction(context)
    }
  }

  try {
    if (safeTimeout !== null) {
      let executed = true

      const timeoutPromise = new Promise((promiseRes) => {
        setTimeout(() => {
          executed = false
          promiseRes(true)
        }, safeTimeout * 1000)
      })

      await Promise.race([execute(), timeoutPromise])

      if (!executed) {
        context.error('Execution timed out.')
        output = context.res.send('', 500, {})
      }
    } else {
      await execute()
    }
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      context.error('Could not load code file.')
    }

    context.error(e.stack || e)
    output = context.res.send('', 500, {})
  }

  if (output === null || output === undefined) {
    context.error(
      'Return statement missing. return context.res.empty() if no response is expected.'
    )
    output = context.res.send('', 500, {})
  }

  output.body = output.body ?? ''
  output.statusCode = output.statusCode ?? 200
  output.headers = output.headers ?? {}

  for (const header in output.headers) {
    if (header.toLowerCase().startsWith('x-open-runtimes-')) {
      continue
    }

    res.setHeader(header.toLowerCase(), output.headers[header])
  }

  res.setHeader('x-open-runtimes-logs', encodeURIComponent(logs.join('\n')))
  res.setHeader('x-open-runtimes-errors', encodeURIComponent(errors.join('\n')))

  return send(res, output.statusCode, output.body)
})

console.log('Listening on http://localhost:' + argv.port)

server.listen(argv.port)
