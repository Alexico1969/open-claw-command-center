# Finding Your Kilo Gateway Server Address

The Kilo AI Gateway is a hosted service with a fixed hostname. You do not need to discover or configure a server IP address — the endpoint is the same for all users.

---

## Gateway Hostname and Base URL

All requests to the Kilo AI Gateway use this base URL:

```
https://api.kilo.ai/api/gateway
```

Use this URL anywhere a base URL or server address is required (Vercel AI SDK, OpenAI SDK, cURL, or any OpenAI-compatible client).

---

## Resolving the IP Address (if required by your environment)

Some environments (firewall rules, network allowlists, proxy configurations) require an explicit IP address instead of a hostname. To find the current IP address of `api.kilo.ai`, run one of the following commands from your terminal:

**Linux / macOS**
```bash
dig +short api.kilo.ai
```

**Windows (PowerShell)**
```powershell
Resolve-DnsName api.kilo.ai | Select-Object -ExpandProperty IPAddress
```

**Cross-platform (using nslookup)**
```bash
nslookup api.kilo.ai
```

> **Note:** `api.kilo.ai` may resolve to multiple IPs or change over time as the service scales. Allowlisting by hostname (rather than IP) is strongly recommended if your network infrastructure supports it.

---

## Verifying Connectivity

After confirming the address, verify that your machine can reach the gateway:

```bash
curl -I https://api.kilo.ai/api/gateway
```

A `200 OK` or `404 Not Found` HTTP response confirms that the host is reachable. A connection timeout or TLS error indicates a network or firewall issue.

---

## Getting Your API Key

Connecting to the gateway requires an API key. To obtain one:

1. Go to [app.kilo.ai](https://app.kilo.ai) and sign in.
2. Navigate to **Your Profile** on your **personal account** (not inside an organization).
3. Scroll to the bottom of the profile page.
4. Copy your API key.

Store the key in an environment variable:

```bash
export KILO_API_KEY=your_api_key_here
```

---

## Using the Server Address in Your Code

### cURL
```bash
curl -X POST "https://api.kilo.ai/api/gateway/chat/completions" \
  -H "Authorization: Bearer $KILO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4.5",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### OpenAI SDK (TypeScript/JavaScript)
```typescript
import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.KILO_API_KEY,
  baseURL: "https://api.kilo.ai/api/gateway",
})
```

### OpenAI SDK (Python)
```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KILO_API_KEY"],
    base_url="https://api.kilo.ai/api/gateway",
)
```

### Vercel AI SDK
```typescript
import { createOpenAI } from "@ai-sdk/openai"

const kilo = createOpenAI({
  baseURL: "https://api.kilo.ai/api/gateway",
  apiKey: process.env.KILO_API_KEY,
})
```

---

## Further Reading

- [Kilo AI Gateway overview](https://kilo.ai/docs/gateway)
- [Authentication and API keys](https://kilo.ai/docs/gateway/authentication)
- [Available models and providers](https://kilo.ai/docs/gateway/models-and-providers)
- [Full API reference](https://kilo.ai/docs/gateway/api-reference)
