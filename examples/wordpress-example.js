// WordPress MCP Example
// This example demonstrates how to use the WordPress MCP tools

// First, make sure to set your WordPress credentials as environment variables:
// WORDPRESS_SITE_URL=https://your-wordpress-site.com
// WORDPRESS_USERNAME=your-username
// WORDPRESS_PASSWORD=your-app-password

import { Client } from "../dist/esm/client/index.js";
import { SSEClientTransport } from "../dist/esm/client/sse.js";
import { z } from "zod";

async function runWordPressExample() {
  // Create a client
  const client = new Client(
    {
      name: 'wordpress-example-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        sampling: {},
      },
    }
  );

  // Connect to the WordPress MCP server
  // Note: Make sure the server is running with `npm run wordpress`
  const clientTransport = new SSEClientTransport(new URL("http://localhost:3000/sse"));
  console.log("Connecting to server...");
  await client.connect(clientTransport);
  console.log("Connected and initialized.");

  try {
    // List available tools
    const toolsResult = await client.request(
      { method: "tools/list" },
      z.object({
        tools: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            inputSchema: z.any().optional(),
          })
        ),
      })
    );

    console.log("Available tools:", toolsResult.tools.map(t => t.name).join(", "));

    // Example: Create a WordPress post
    console.log("Creating a test post...");
    const createPostResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "create_post",
          arguments: {
            title: "Test Post from MCP",
            content: "This is a test post created using the Model Context Protocol WordPress integration.",
            status: "draft" // Use "draft", "publish", or "private"
          }
        }
      },
      z.object({
        content: z.array(
          z.object({
            type: z.string(),
            text: z.string()
          })
        ),
        isError: z.boolean().optional()
      })
    );

    console.log("Create post result:", createPostResult);

    // Example: Get WordPress posts
    console.log("Getting recent posts...");
    const postsResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "get_posts",
          arguments: {
            perPage: 5,
            page: 1
          }
        }
      },
      z.object({
        content: z.array(
          z.object({
            type: z.string(),
            text: z.string()
          })
        ),
        isError: z.boolean().optional()
      })
    );

    console.log("Posts result:", postsResult);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    await client.disconnect();
    console.log("Connection closed.");
  }
}

runWordPressExample().catch(console.error);
