# System Information Collection & n8n Integration

This document describes the automated system information collection and n8n workflow integration feature.

## Overview

When a user submits their first prompt in a new session, the system automatically:

1. **Collects system information** about the project and environment
2. **Sends the data to an n8n webhook** for AI processing
3. **Integrates the n8n response** with the user's prompt
4. **Stores everything** in the Convex database for future reference

## Architecture

### Components

- **System Info Collector** (`/src/lib/system-info.ts`): Gathers project and system data
- **n8n Client** (`/src/lib/n8n-client.ts`): Handles webhook communication with retry logic
- **Convex Functions** (`/convex/system_info.ts`): Database operations for system info
- **API Endpoint** (`/src/app/api/update-convex/route.ts`): Enhanced to include system info workflow
- **Configuration** (`/src/lib/config.ts`): Centralized configuration management

### Data Flow

```
User Prompt → API Endpoint → First Message Check → System Info Collection → n8n Webhook → Response Integration → Database Storage
```

## System Information Collected

### Tech Stack Detection
- Framework (Next.js, React, etc.)
- Dependencies and dev dependencies
- Package manager
- TypeScript detection
- Build scripts

### Git Information
- Current branch
- Remote repository info
- Last commit
- Working directory status (clean/dirty)
- Untracked and modified files

### System Details
- Operating system
- Node.js version
- NPM version
- Working directory path

### Project Structure
- Root files
- Main directories
- Configuration files
- Documentation detection

## Configuration

### Environment Variables

```bash
# Required
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-endpoint

# Optional (with defaults)
N8N_TIMEOUT=10000                    # 10 seconds
N8N_RETRIES=3                        # Number of retry attempts
N8N_RETRY_DELAY=1000                 # 1 second between retries

# System Info Configuration
SYSTEM_INFO_ENABLED=true             # Enable/disable system info collection
SYSTEM_INFO_CACHE_TIMEOUT=300000     # 5 minutes cache timeout
SYSTEM_INFO_GIT=true                 # Enable git info collection
SYSTEM_INFO_SYSTEM=true              # Enable system details collection
SYSTEM_INFO_PROJECT=true             # Enable project structure collection
```

### Configuration File

The `src/lib/config.ts` file provides centralized configuration management with validation and default values.

## Usage

### Basic API Call

```bash
curl -X POST http://localhost:3000/api/update-convex \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "unique-session-id",
    "prompt": "Help me with my React app"
  }'
```

### First Message Response (with system info)

```json
{
  "ok": true,
  "conversationId": "conversation-id",
  "systemInfo": {
    "collected": true,
    "n8nProcessed": true,
    "error": null
  }
}
```

### Subsequent Messages (no system info)

```json
{
  "ok": true,
  "conversationId": "conversation-id"
}
```

## n8n Integration

### Webhook Payload

The system sends this payload to your n8n webhook:

```json
{
  "systemInfo": "JSON string containing formatted system information",
  "sessionId": "unique-session-id",
  "timestamp": 1704067200000,
  "metadata": {
    "attempt": 1,
    "source": "convex-frontend"
  }
}
```

### Expected Response

n8n should return a string that will be integrated with the user's prompt:

```
"Based on your Next.js TypeScript project with Convex and Tailwind CSS, I can help you with..."
```

### Response Integration

The n8n response is combined with the user's original prompt:

- **User prompt**: Enhanced with system context from n8n
- **AI prompt**: Prepended with system context
- **No original prompt**: Uses n8n response as the AI prompt

## Database Schema

### system_info Table

```typescript
{
  _id: Id<"system_info">,
  sessionId: string,
  systemData: string,      // JSON string of collected system info
  n8nResponse?: string,    // Response from n8n webhook
  timestamp: number,
}
```

### conversations Table Updates

```typescript
{
  _id: Id<"conversations">,
  sessionId: string,
  systemInfoCollected?: boolean,  // New field to track collection status
}
```

## Error Handling

### System Info Collection Errors
- Non-blocking: If collection fails, the workflow continues
- Graceful degradation: Returns empty/default values
- Comprehensive logging for debugging

### n8n Webhook Errors
- Automatic retry with exponential backoff
- Timeout protection
- Fallback behavior when webhook is unavailable
- Error details stored in database

### Configuration Validation
- Startup validation with clear error messages
- Runtime checks for required environment variables
- Default values for optional configurations

## Testing

### Test Script

Run the included test script to validate the workflow:

```bash
# Ensure your development server is running
npm run dev

# Run the test script
node scripts/test-workflow.js
```

### Manual Testing

1. **First message**: Should trigger system info collection
2. **Second message**: Should skip system info collection
3. **New session**: Should trigger collection again
4. **Invalid requests**: Should return appropriate errors

## Monitoring and Logging

### Console Logs

- Configuration validation on startup
- System info collection status
- n8n webhook interaction details
- Cache usage notifications

### Log Levels

- `INFO`: Normal operation flow
- `WARN`: Non-critical issues (e.g., missing git info)
- `ERROR`: Critical failures requiring attention

## Performance Considerations

### Caching
- System information is cached for 5 minutes (configurable)
- Prevents redundant system calls
- Cache invalidation on configuration changes

### Optimization
- Parallel command execution where possible
- Timeout protection for long-running commands
- Selective collection based on configuration

## Security

### Environment Variables
- Sensitive URLs stored in environment variables
- No secrets logged to console
- Configurable timeout and retry limits

### Command Execution
- Safe command execution with timeout protection
- Error handling prevents information leakage
- Non-privileged system information only

## Troubleshooting

### Common Issues

1. **n8n webhook not responding**: Check URL and network connectivity
2. **System commands failing**: Verify git installation and permissions
3. **Cache issues**: Restart server or reduce cache timeout
4. **Configuration errors**: Check environment variables and logs

### Debug Mode

Set `NODE_ENV=development` to enable detailed configuration logging.

## Future Enhancements

- Support for additional version control systems
- More detailed dependency analysis
- Custom command configuration
- Webhook authentication
- System info versioning and comparison