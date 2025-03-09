import { Client } from "./dist/esm/client/index.js";
import { SSEClientTransport } from "./dist/esm/client/sse.js";
import { z } from "zod";

// WordPress credentials
const WORDPRESS_SITE_URL = "https://rizamaulana.com/";
const WORDPRESS_USERNAME = "admin";
const WORDPRESS_PASSWORD = "yraD 3okg d1G2 kocm SSkh lU9h";

async function main() {
  // Create a client
  const client = new Client(
    {
      name: "wordpress-test-client",
      version: "0.1.0",
    },
    {
      capabilities: {
        sampling: {},
      },
    }
  );

  // Connect to the server
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

    // Create a WordPress post
    console.log("\nCreating a test post...");
    const createPostResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "create_post",
          arguments: {
            // Explicitly provide credentials
            siteUrl: WORDPRESS_SITE_URL,
            username: WORDPRESS_USERNAME,
            password: WORDPRESS_PASSWORD,
            title: "Test Post from MCP Client",
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

    console.log("Create post result:", JSON.stringify(createPostResult, null, 2));

    // Get WordPress posts
    console.log("\nGetting recent posts...");
    const postsResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "get_posts",
          arguments: {
            // Explicitly provide credentials
            siteUrl: WORDPRESS_SITE_URL,
            username: WORDPRESS_USERNAME,
            password: WORDPRESS_PASSWORD,
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

    console.log("Posts result:", JSON.stringify(postsResult, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    await client.close();
    console.log("Connection closed.");
  }
}

main().catch(console.error); 