#!/usr/bin/env node

import { Command } from "commander";
import express from "express";
import { McpServer } from "./server/mcp.js";
import { registerWordPressTools } from "./server/wordpress.js";
import { Client } from "./client/index.js";
import { SSEClientTransport } from "./client/sse.js";
import { SSEServerTransport } from "./server/sse.js";
import { StdioServerTransport } from "./server/stdio.js";

const program = new Command();

program
  .name("wordpress-mcp")
  .description("WordPress integration for Model Context Protocol")
  .version("1.0.0");

program
  .command("server")
  .description("Start a WordPress MCP server")
  .argument("[port]", "Port to listen on (default: stdio)")
  .action(async (port?: string) => {
    const mcpServer = new McpServer({
      name: "wordpress-mcp-server",
      version: "1.0.0",
    }, {
      capabilities: {
        prompts: {},
        resources: {},
        tools: {},
        logging: {},
      },
    });
    
    // Register WordPress tools
    registerWordPressTools(mcpServer);

    if (port) {
      const portNumber = parseInt(port, 10);
      
      const app = express();
      
      app.get("/sse", async (req, res) => {
        console.log("Got new SSE connection");
        
        const transport = new SSEServerTransport("/message", res);
        await mcpServer.connect(transport);
      });
      
      app.post("/message", async (req, res) => {
        const sessionId = req.query.sessionId as string;
        const transport = mcpServer.server.transport as SSEServerTransport;
        
        if (transport.sessionId !== sessionId) {
          res.status(404).send("Session not found");
          return;
        }
        
        await transport.handlePostMessage(req, res);
      });
      
      app.listen(portNumber, () => {
        console.log(`WordPress MCP Server running on http://localhost:${portNumber}/sse`);
      });
    } else {
      const transport = new StdioServerTransport();
      await mcpServer.connect(transport);
      console.log("WordPress MCP Server running on stdio");
    }
  });

program
  .command("client")
  .description("Start a WordPress MCP client")
  .argument("[url]", "URL to connect to (default: http://localhost:3000/sse)")
  .action(async (url = "http://localhost:3000/sse") => {
    const client = new Client(
      {
        name: "wordpress-mcp-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          sampling: {},
        },
      }
    );

    const clientTransport = new SSEClientTransport(new URL(url));
    console.log("Connecting to server...");
    await client.connect(clientTransport);
    console.log("Connected and initialized.");

    // Keep the process alive
    process.stdin.resume();

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Closing connection...");
      await client.close();
      process.exit(0);
    });
  });

program.parse(process.argv);
