import { Client } from "./dist/esm/client/index.js";
import { SSEClientTransport } from "./dist/esm/client/sse.js";
import { z } from "zod";

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

    // Example: Get WordPress posts
    const postsResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "get_posts",
          arguments: {
            // These can be omitted if you set environment variables
            // siteUrl: "https://your-wordpress-site.com/",
            // username: "your-username",
            // password: "your-app-password",
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
    await client.close();
    console.log("Connection closed.");
  }
}

main().catch(console.error); 