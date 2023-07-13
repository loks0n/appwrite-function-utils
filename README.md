# Appwrite Function Utils

This repository contains a set of utility functions that can be used to build your Appwrite functions.

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
