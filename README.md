# Appwrite Function Utils

This repository contains a set of utilities for Appwrite functions.

## Installation

```bash
npm install --save appwrite-function-utils
```

## Features

### Function Handler Types

Enabled type checking for your function handler by using the `Function` type.

#### JavaScript

```javascript
/** type {import('appwrite-function-utils').Function} */
const handler = async (context) => {
  // Your function code
}

export default handler
```

#### TypeScript

```typescript
import { Function } from 'appwrite-function-utils'

const handler: Function = async (context) => {
  // Your function code
}

export default handler
```

### Router

The `router` function allows you to easily define routes for your function handler.

```javascript
import { router, HttpMethod } from 'appwrite-function-utils'

export default router({
  routes: [
    {
      path: '/ping',
      methods: [HttpMethod.GET, HttpMethod.POST],
      handler: async (context) => {
        return context.res.send('Pong!')
      }
    }
  ],
  // override the default exception handler routes
  exception: {
    notFound: async (context) => {
      return context.res.send('Oopsy whoopsy doopsy no findy windy', 404)
    },
  }
})

```

### Dev Server

The `appwrite-function-utils dev` command will start a local server that will listen for incoming requests and execute your function handler. Assuming your function handler is located in `src/main.js`, add the following script to your `package.json` file:

```json
{
  "scripts": {
    "dev": "appwrite-function-utils dev src/main.js"
  }
}
```

You can use it in conjuction nodemon to automatically restart the server when you make changes to your function handler:

```bash
npm install --save-dev nodemon
```

```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec \"appwrite-function-utils dev src/main.js\""
  }
}
```
