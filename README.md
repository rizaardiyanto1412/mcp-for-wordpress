# WordPress MCP Integration

This is a streamlined version of the Model Context Protocol (MCP) TypeScript SDK that focuses specifically on WordPress integration. It enables interaction with WordPress sites through the WordPress REST API using the MCP protocol.

## Overview

The WordPress MCP integration allows you to:

- Create new WordPress posts
- Retrieve existing WordPress posts
- Update existing WordPress posts

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Configuration

There are two ways to configure the WordPress integration:

### 1. Environment Variables

Set the following environment variables:

- `WORDPRESS_SITE_URL`: Your WordPress site URL
- `WORDPRESS_USERNAME`: WordPress username
- `WORDPRESS_PASSWORD`: WordPress application password

### 2. Request Parameters

Provide the credentials directly in the request parameters when calling the tools.

## Security Note

For security, it's recommended to use WordPress application passwords instead of your main account password. You can generate an application password in your WordPress dashboard under Users → Security → Application Passwords.

## Available Tools

### create_post

Creates a new WordPress post.

**Parameters:**
- `siteUrl`: (optional if set in env) WordPress site URL
- `username`: (optional if set in env) WordPress username
- `password`: (optional if set in env) WordPress application password
- `title`: Post title
- `content`: Post content
- `status`: (optional) 'draft' | 'publish' | 'private' (default: 'draft')

**Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_post",
    "arguments": {
      "title": "My New Post",
      "content": "Hello World!",
      "status": "draft"
    }
  }
}
```

### get_posts

Retrieves WordPress posts.

**Parameters:**
- `siteUrl`: (optional if set in env) WordPress site URL
- `username`: (optional if set in env) WordPress username
- `password`: (optional if set in env) WordPress application password
- `perPage`: (optional) Number of posts per page (default: 10)
- `page`: (optional) Page number (default: 1)

**Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_posts",
    "arguments": {
      "perPage": 5,
      "page": 1
    }
  }
}
```

### update_post

Updates an existing WordPress post.

**Parameters:**
- `siteUrl`: (optional if set in env) WordPress site URL
- `username`: (optional if set in env) WordPress username
- `password`: (optional if set in env) WordPress application password
- `postId`: ID of the post to update
- `title`: (optional) New post title
- `content`: (optional) New post content
- `status`: (optional) 'draft' | 'publish' | 'private'

**Example:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "update_post",
    "arguments": {
      "postId": 123,
      "title": "Updated Post Title",
      "status": "publish"
    }
  }
}
```

## Running the Server

Start the WordPress MCP server:

```bash
npm run server
```

This will start the server on stdio by default. To run it on a specific port (e.g., 3000):

```bash
npm run server 3000
```

## Requirements

- Node.js 18.0.0 or higher
- WordPress site with REST API enabled
- WordPress application password for authentication

## License

MIT License - See LICENSE file for details
