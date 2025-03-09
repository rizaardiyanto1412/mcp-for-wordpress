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
  async createPost(
    title: string, 
    content: string, 
    status: WordPressPostStatus = WordPressPostStatus.DRAFT,
    taxonomies?: Record<string, number[]>,
    date?: string
  ): Promise<any> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/posts`;
    
    const postData: Record<string, any> = {
      title,
      content,
      status,
    };

    // Add taxonomies if provided
    if (taxonomies) {
      Object.entries(taxonomies).forEach(([taxonomy, termIds]) => {
        postData[taxonomy] = termIds;
      });
    }
    
    // Add date if provided
    if (date) {
      postData.date = date;
      
      // If date is in the future and status is 'publish', change to 'future' (scheduled)
      const postDate = new Date(date);
      const now = new Date();
      if (postDate > now && status === WordPressPostStatus.PUBLISH) {
        postData.status = 'future'; // API value is 'future' for scheduled posts
      }
    }
    
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
  async updatePost(
    postId: number, 
    title?: string, 
    content?: string, 
    status?: WordPressPostStatus,
    taxonomies?: Record<string, number[]>,
    date?: string
  ): Promise<any> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/posts/${postId}`;
    
    const data: Record<string, any> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (status !== undefined) data.status = status;
    
    // Add taxonomies if provided
    if (taxonomies) {
      Object.entries(taxonomies).forEach(([taxonomy, termIds]) => {
        data[taxonomy] = termIds;
      });
    }
    
    // Add date if provided
    if (date) {
      data.date = date;
      
      // If date is in the future and status is 'publish', change to 'future' (scheduled)
      const postDate = new Date(date);
      const now = new Date();
      if (postDate > now && status === WordPressPostStatus.PUBLISH) {
        data.status = 'future'; // API value is 'future' for scheduled posts
      }
    }
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update WordPress post: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Get all taxonomies from WordPress
   */
  async getTaxonomies(): Promise<any[]> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/taxonomies`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get WordPress taxonomies: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const taxonomies = await response.json();
    return Object.values(taxonomies);
  }

  /**
   * Get terms for a specific taxonomy
   */
  async getTaxonomyTerms(taxonomy: string, perPage: number = 100, page: number = 1): Promise<any[]> {
    const apiUrl = `${this.siteUrl}wp-json/wp/v2/${taxonomy}?per_page=${perPage}&page=${page}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get terms for taxonomy ${taxonomy}: ${response.status} ${response.statusText} - ${errorText}`);
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
      status: z.enum(["draft", "publish", "private", "future"]).optional().default("draft").describe("Post status (optional, default: 'draft'). Note: If a future date is provided with 'publish' status, it will automatically be scheduled (API status: 'future')."),
      categories: z.array(z.number()).optional().describe("Array of category IDs to assign to the post"),
      tags: z.array(z.number()).optional().describe("Array of tag IDs to assign to the post"),
      taxonomies: z.record(z.string(), z.array(z.number())).optional().describe("Custom taxonomies to assign (format: {taxonomy_name: [term_ids]})"),
      date: z.string().optional().describe("Specific date for the post in ISO 8601 format (e.g., '2023-12-31T23:59:59'). If date is in the future and status is 'publish', post will be scheduled."),
    },
    async (args, extra) => {
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

        // Prepare taxonomies object
        const taxonomies: Record<string, number[]> = {};
        
        // Add categories if provided
        if (args.categories && args.categories.length > 0) {
          taxonomies.categories = args.categories;
        }
        
        // Add tags if provided
        if (args.tags && args.tags.length > 0) {
          taxonomies.tags = args.tags;
        }
        
        // Add custom taxonomies if provided
        if (args.taxonomies) {
          Object.entries(args.taxonomies).forEach(([taxonomy, termIds]) => {
            taxonomies[taxonomy] = termIds;
          });
        }

        // Check if the post will be scheduled
        let scheduledMessage = "";
        if (args.date) {
          const postDate = new Date(args.date);
          const now = new Date();
          if (postDate > now && args.status === "publish") {
            scheduledMessage = " (Post will be scheduled)";
          }
        }

        const client = new WordPressClient(siteUrl, username, password);
        const post = await client.createPost(
          args.title, 
          args.content, 
          args.status as WordPressPostStatus,
          Object.keys(taxonomies).length > 0 ? taxonomies : undefined,
          args.date
        );

        // Prepare a message about assigned taxonomies
        let taxonomyMessage = "";
        if (Object.keys(taxonomies).length > 0) {
          taxonomyMessage = "\nAssigned taxonomies:";
          Object.entries(taxonomies).forEach(([taxonomy, termIds]) => {
            taxonomyMessage += `\n- ${taxonomy}: ${termIds.join(", ")}`;
          });
        }

        // Add date information to the message
        const dateMessage = args.date ? `\nDate: ${args.date}${scheduledMessage}` : "";

        // Format the status for display (show 'Scheduled' instead of 'future')
        const displayStatus = post.status === 'future' ? 'Scheduled' : post.status;

        return {
          content: [
            {
              type: "text",
              text: `Successfully created WordPress post with ID: ${post.id}\nTitle: ${post.title.rendered}\nStatus: ${displayStatus}${dateMessage}${taxonomyMessage}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error creating WordPress post: ${(error as Error).message}`,
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
      postId: z.number().describe("Post ID to update"),
      title: z.string().optional().describe("New post title (optional)"),
      content: z.string().optional().describe("New post content (optional)"),
      status: z.enum(["draft", "publish", "private", "future"]).optional().describe("New post status (optional). Note: If a future date is provided with 'publish' status, it will automatically be scheduled (API status: 'future')."),
      categories: z.array(z.number()).optional().describe("Array of category IDs to assign to the post"),
      tags: z.array(z.number()).optional().describe("Array of tag IDs to assign to the post"),
      taxonomies: z.record(z.string(), z.array(z.number())).optional().describe("Custom taxonomies to assign (format: {taxonomy_name: [term_ids]})"),
      date: z.string().optional().describe("Specific date for the post in ISO 8601 format (e.g., '2023-12-31T23:59:59'). If date is in the future and status is 'publish', post will be scheduled."),
    },
    async (args, extra) => {
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

        // Prepare taxonomies object
        const taxonomies: Record<string, number[]> = {};
        
        // Add categories if provided
        if (args.categories && args.categories.length > 0) {
          taxonomies.categories = args.categories;
        }
        
        // Add tags if provided
        if (args.tags && args.tags.length > 0) {
          taxonomies.tags = args.tags;
        }
        
        // Add custom taxonomies if provided
        if (args.taxonomies) {
          Object.entries(args.taxonomies).forEach(([taxonomy, termIds]) => {
            taxonomies[taxonomy] = termIds;
          });
        }

        // Check if the post will be scheduled
        let scheduledMessage = "";
        if (args.date && args.status === "publish") {
          const postDate = new Date(args.date);
          const now = new Date();
          if (postDate > now) {
            scheduledMessage = " (Post will be scheduled)";
          }
        }

        const client = new WordPressClient(siteUrl, username, password);
        const post = await client.updatePost(
          args.postId,
          args.title,
          args.content,
          args.status as WordPressPostStatus,
          Object.keys(taxonomies).length > 0 ? taxonomies : undefined,
          args.date
        );

        // Prepare a message about assigned taxonomies
        let taxonomyMessage = "";
        if (Object.keys(taxonomies).length > 0) {
          taxonomyMessage = "\nUpdated taxonomies:";
          Object.entries(taxonomies).forEach(([taxonomy, termIds]) => {
            taxonomyMessage += `\n- ${taxonomy}: ${termIds.join(", ")}`;
          });
        }

        // Add date information to the message
        const dateMessage = args.date ? `\nDate: ${args.date}${scheduledMessage}` : "";

        // Format the status for display (show 'Scheduled' instead of 'future')
        const displayStatus = post.status === 'future' ? 'Scheduled' : post.status;

        return {
          content: [
            {
              type: "text",
              text: `WordPress post updated successfully. Post ID: ${post.id}\nStatus: ${displayStatus}${dateMessage}${taxonomyMessage}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error updating WordPress post: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool for getting WordPress taxonomies
  server.tool(
    "get_taxonomies",
    "Gets all taxonomies from a WordPress site",
    {
      siteUrl: z.string().url().optional().describe("WordPress site URL (optional if set in env)"),
      username: z.string().optional().describe("WordPress username (optional if set in env)"),
      password: z.string().optional().describe("WordPress application password (optional if set in env)"),
    },
    async (args, extra) => {
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
        const taxonomies = await client.getTaxonomies();

        return {
          content: [
            {
              type: "text",
              text: `WordPress taxonomies retrieved successfully. Found ${taxonomies.length} taxonomies.`,
            },
            {
              type: "text",
              text: JSON.stringify(taxonomies, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting WordPress taxonomies: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Tool for getting terms for a specific taxonomy
  server.tool(
    "get_taxonomy_terms",
    "Gets terms for a specific taxonomy from a WordPress site",
    {
      siteUrl: z.string().url().optional().describe("WordPress site URL (optional if set in env)"),
      username: z.string().optional().describe("WordPress username (optional if set in env)"),
      password: z.string().optional().describe("WordPress application password (optional if set in env)"),
      taxonomy: z.string().describe("Taxonomy slug (e.g., 'categories', 'tags')"),
      perPage: z.number().optional().default(100).describe("Number of terms per page (optional, default: 100)"),
      page: z.number().optional().default(1).describe("Page number (optional, default: 1)"),
    },
    async (args, extra) => {
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
        const terms = await client.getTaxonomyTerms(args.taxonomy, args.perPage, args.page);

        return {
          content: [
            {
              type: "text",
              text: `WordPress terms for taxonomy '${args.taxonomy}' retrieved successfully. Found ${terms.length} terms.`,
            },
            {
              type: "text",
              text: JSON.stringify(terms, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting WordPress taxonomy terms: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
