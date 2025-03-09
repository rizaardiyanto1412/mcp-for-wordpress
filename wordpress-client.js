import { Client } from "./dist/esm/client/index.js";
import { SSEClientTransport } from "./dist/esm/client/sse.js";
import { z } from "zod";

// Replace these with your actual WordPress credentials
const WORDPRESS_SITE_URL = process.env.WORDPRESS_SITE_URL || "https://your-wordpress-site.com/";
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || "your-username";
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD || "your-app-password";

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

    // Example: Create a WordPress post
    console.log("Creating a test post...");
    const createPostResult = await client.request(
      {
        method: "tools/call",
        params: {
          name: "create_post",
          arguments: {
            siteUrl: WORDPRESS_SITE_URL,
            username: WORDPRESS_USERNAME,
            password: WORDPRESS_PASSWORD,
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

    console.log("Posts result:", postsResult);

    // If you want to update a post, you would need its ID
    // This example assumes you have a post ID from the previous get_posts call
    // const postId = 123; // Replace with an actual post ID
    // console.log("Updating a post...");
    // const updatePostResult = await client.request(
    //   {
    //     method: "tools/call",
    //     params: {
    //       name: "update_post",
    //       arguments: {
    //         siteUrl: WORDPRESS_SITE_URL,
    //         username: WORDPRESS_USERNAME,
    //         password: WORDPRESS_PASSWORD,
    //         postId: postId,
    //         title: "Updated Post Title",
    //         content: "This post was updated using the MCP WordPress integration.",
    //         status: "publish"
    //       }
    //     }
    //   },
    //   z.object({
    //     content: z.array(
    //       z.object({
    //         type: z.string(),
    //         text: z.string()
    //       })
    //     ),
    //     isError: z.boolean().optional()
    //   })
    // );
    // 
    // console.log("Update post result:", updatePostResult);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close the connection
    await client.close();
    console.log("Connection closed.");
  }
}

main().catch(console.error); 