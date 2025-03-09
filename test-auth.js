// Simple script to test WordPress authentication
import fetch from 'node-fetch';

// Use the environment variables
const WORDPRESS_SITE_URL = process.env.WORDPRESS_SITE_URL || "https://your-wordpress-site.com/";
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME || "admin";
const WORDPRESS_PASSWORD = process.env.WORDPRESS_PASSWORD || "yraD 3okg d1G2 kocm SSkh lU9h";

async function testAuth() {
  console.log("Testing WordPress authentication...");
  console.log(`Site URL: ${WORDPRESS_SITE_URL}`);
  console.log(`Username: ${WORDPRESS_USERNAME}`);
  console.log(`Password: ${WORDPRESS_PASSWORD.substring(0, 4)}...${WORDPRESS_PASSWORD.substring(WORDPRESS_PASSWORD.length - 4)}`);
  
  try {
    // First, try to get posts to test basic authentication
    const postsUrl = `${WORDPRESS_SITE_URL}wp-json/wp/v2/posts?per_page=1`;
    console.log(`\nTesting GET request to: ${postsUrl}`);
    
    const postsResponse = await fetch(postsUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString("base64")}`,
      },
    });
    
    console.log(`Status: ${postsResponse.status} ${postsResponse.statusText}`);
    
    if (postsResponse.ok) {
      console.log("✅ Authentication successful for reading posts");
      const responseText = await postsResponse.text();
      try {
        const posts = JSON.parse(responseText);
        console.log(`Retrieved ${posts.length} posts`);
      } catch (e) {
        console.log("Response is not valid JSON. First 200 characters:");
        console.log(responseText.substring(0, 200));
      }
    } else {
      console.log("❌ Authentication failed for reading posts");
      console.log(await postsResponse.text());
    }
    
    // Now try to create a post to test write permissions
    const createUrl = `${WORDPRESS_SITE_URL}wp-json/wp/v2/posts`;
    console.log(`\nTesting POST request to: ${createUrl}`);
    
    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString("base64")}`,
      },
      body: JSON.stringify({
        title: "Test Post from Auth Script",
        content: "This is a test post to verify authentication.",
        status: "draft",
      }),
    });
    
    console.log(`Status: ${createResponse.status} ${createResponse.statusText}`);
    
    if (createResponse.ok) {
      console.log("✅ Authentication successful for creating posts");
      const responseText = await createResponse.text();
      try {
        const post = JSON.parse(responseText);
        console.log(`Created post with ID: ${post.id}`);
      } catch (e) {
        console.log("Response is not valid JSON. First 200 characters:");
        console.log(responseText.substring(0, 200));
      }
    } else {
      console.log("❌ Authentication failed for creating posts");
      const responseText = await createResponse.text();
      console.log(responseText.substring(0, 500)); // Show more of the error
    }
    
    // Check user info to verify permissions
    const userUrl = `${WORDPRESS_SITE_URL}wp-json/wp/v2/users/me`;
    console.log(`\nTesting GET request to: ${userUrl}`);
    
    const userResponse = await fetch(userUrl, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`).toString("base64")}`,
      },
    });
    
    console.log(`Status: ${userResponse.status} ${userResponse.statusText}`);
    
    if (userResponse.ok) {
      console.log("✅ Authentication successful for user info");
      const responseText = await userResponse.text();
      try {
        const user = JSON.parse(responseText);
        console.log(`User: ${user.name}`);
        console.log(`Role: ${user.roles ? user.roles.join(', ') : 'Not available'}`);
        console.log(`Capabilities:`, user.capabilities ? 
          Object.keys(user.capabilities).filter(cap => user.capabilities[cap] === true).join(', ') : 
          'Not available');
      } catch (e) {
        console.log("Response is not valid JSON. First 200 characters:");
        console.log(responseText.substring(0, 200));
      }
    } else {
      console.log("❌ Authentication failed for user info");
      console.log(await userResponse.text());
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testAuth().catch(console.error); 