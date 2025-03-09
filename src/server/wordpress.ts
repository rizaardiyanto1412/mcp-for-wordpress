import { z } from "zod";
import { McpServer } from "./mcp.js";

/**
 * WordPress post status options
 */
export enum WordPressPostStatus {
  DRAFT = "draft",
  PUBLISH = "publish",
  PRIVATE = "private",
}

/**
 * WordPress API client for interacting with WordPress sites
 */
export class WordPressClient {
  private siteUrl: string;
  private username: string;
  private password: string;

  constructor(siteUrl: string, username: string, password: string) {
    this.siteUrl = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
    this.username = username;
    this.password = password;
  }

  /**
   * Create a new WordPress post
   */
  async createPost(title: string, content: string, status: WordPressPostStatus = WordPressPostStatus.DRAFT): Promise<any> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/posts`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
      body: JSON.stringify({
        title,
        content,
        status,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create WordPress post: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get WordPress posts
   */
  async getPosts(perPage: number = 10, page: number = 1): Promise<any[]> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/posts?per_page=${perPage}&page=${page}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get WordPress posts: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Update an existing WordPress post
   */
  async updatePost(postId: number, title?: string, content?: string, status?: WordPressPostStatus): Promise<any> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/posts/${postId}`;
    
    const postData: Record<string, unknown> = {};
    if (title !== undefined) postData.title = title;
    if (content !== undefined) postData.content = content;
    if (status !== undefined) postData.status = status;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update WordPress post: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }
}

/**
 * Register WordPress tools with an MCP server
 */
export function registerWordPressTools(server: McpServer) {
  // Tool for creating WordPress posts
  server.tool(
    "create_post",
    "Creates a new WordPress post",
    {
      siteUrl: z.string().url().optional().describe("WordPress site URL (optional if set in env)"),
      username: z.string().optional().describe("WordPress username (optional if set in env)"),
      password: z.string().optional().describe("WordPress application password (optional if set in env)"),
      title: z.string().describe("Post title"),
      content: z.string().describe("Post content"),
      status: z.enum(["draft", "publish", "private"]).optional().default("draft").describe("Post status (optional, default: 'draft')"),
    },
    async (args) => {
      try {
        // Use environment variables as fallbacks if parameters are not provided
        const siteUrl = args.siteUrl || process.env.WORDPRESS_SITE_URL;
        const username = args.username || process.env.WORDPRESS_USERNAME;
        const password = args.password || process.env.WORDPRESS_PASSWORD;

        if (!siteUrl || !username || !password) {
          throw new Error(
            "WordPress credentials not provided. Please provide siteUrl, username, and password parameters or set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_PASSWORD environment variables."
          );
        }

        const client = new WordPressClient(siteUrl, username, password);
        const post = await client.createPost(args.title, args.content, args.status as WordPressPostStatus);

        return {
          content: [
            {
              type: "text",
              text: `Successfully created WordPress post with ID: ${post.id}\nTitle: ${post.title.rendered}\nStatus: ${post.status}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool for getting WordPress posts
  server.tool(
    "get_posts",
    "Retrieves WordPress posts",
    {
      siteUrl: z.string().url().optional().describe("WordPress site URL (optional if set in env)"),
      username: z.string().optional().describe("WordPress username (optional if set in env)"),
      password: z.string().optional().describe("WordPress application password (optional if set in env)"),
      perPage: z.number().int().positive().optional().default(10).describe("Number of posts per page (optional, default: 10)"),
      page: z.number().int().positive().optional().default(1).describe("Page number (optional, default: 1)"),
    },
    async (args) => {
      try {
        // Use environment variables as fallbacks if parameters are not provided
        const siteUrl = args.siteUrl || process.env.WORDPRESS_SITE_URL;
        const username = args.username || process.env.WORDPRESS_USERNAME;
        const password = args.password || process.env.WORDPRESS_PASSWORD;

        if (!siteUrl || !username || !password) {
          throw new Error(
            "WordPress credentials not provided. Please provide siteUrl, username, and password parameters or set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_PASSWORD environment variables."
          );
        }

        const client = new WordPressClient(siteUrl, username, password);
        const posts = await client.getPosts(args.perPage, args.page);

        return {
          content: [
            {
              type: "text",
              text: `Retrieved ${posts.length} WordPress posts:\n${posts
                .map((post: any) => `ID: ${post.id}, Title: ${post.title.rendered}, Status: ${post.status}`)
                .join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool for updating WordPress posts
  server.tool(
    "update_post",
    "Updates an existing WordPress post",
    {
      siteUrl: z.string().url().optional().describe("WordPress site URL (optional if set in env)"),
      username: z.string().optional().describe("WordPress username (optional if set in env)"),
      password: z.string().optional().describe("WordPress application password (optional if set in env)"),
      postId: z.number().int().positive().describe("ID of the post to update"),
      title: z.string().optional().describe("New post title (optional)"),
      content: z.string().optional().describe("New post content (optional)"),
      status: z.enum(["draft", "publish", "private"]).optional().describe("New post status (optional)"),
    },
    async (args) => {
      try {
        // Use environment variables as fallbacks if parameters are not provided
        const siteUrl = args.siteUrl || process.env.WORDPRESS_SITE_URL;
        const username = args.username || process.env.WORDPRESS_USERNAME;
        const password = args.password || process.env.WORDPRESS_PASSWORD;

        if (!siteUrl || !username || !password) {
          throw new Error(
            "WordPress credentials not provided. Please provide siteUrl, username, and password parameters or set WORDPRESS_SITE_URL, WORDPRESS_USERNAME, and WORDPRESS_PASSWORD environment variables."
          );
        }

        if (args.title === undefined && args.content === undefined && args.status === undefined) {
          throw new Error("At least one of title, content, or status must be provided for update");
        }

        const client = new WordPressClient(siteUrl, username, password);
        const post = await client.updatePost(
          args.postId, 
          args.title, 
          args.content, 
          args.status as WordPressPostStatus
        );

        return {
          content: [
            {
              type: "text",
              text: `Successfully updated WordPress post with ID: ${post.id}\nTitle: ${post.title.rendered}\nStatus: ${post.status}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: error instanceof Error ? error.message : String(error),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
