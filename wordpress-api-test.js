// Simple script to test WordPress REST API directly
import fetch from 'node-fetch';

// Replace these with your actual WordPress site URL and credentials
const SITE_URL = process.env.WORDPRESS_SITE_URL || "http://localhost/wordpress/";
const USERNAME = process.env.WORDPRESS_USERNAME || "admin";
const PASSWORD = process.env.WORDPRESS_PASSWORD || "yraD 3okg d1G2 kocm SSkh lU9h";

async function testWordPressApi() {
  console.log("WordPress REST API Test");
  console.log("======================");
  console.log(`Site URL: ${SITE_URL}`);
  console.log(`Username: ${USERNAME}`);
  console.log(`Password: ${PASSWORD.substring(0, 4)}...${PASSWORD.substring(PASSWORD.length - 4)}`);
  console.log("\n");

  // Test if the WordPress site is reachable
  try {
    console.log(`Testing if site is reachable: ${SITE_URL}`);
    const response = await fetch(SITE_URL);
    console.log(`Site is reachable. Status: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.error(`❌ Error: Site is not reachable: ${error.message}`);
    console.log("\nPlease check your WordPress site URL and make sure it's correct and accessible.");
    console.log("If you're using a local development environment, make sure it's running.");
    return;
  }

  // Test if the REST API is enabled
  try {
    console.log(`\nTesting if REST API is enabled: ${SITE_URL}wp-json/`);
    const response = await fetch(`${SITE_URL}wp-json/`);
    if (response.ok) {
      console.log("✅ REST API is enabled and accessible");
    } else {
      console.error(`❌ REST API returned status: ${response.status} ${response.statusText}`);
      console.log("\nPlease check if the REST API is enabled in your WordPress installation.");
      console.log("You might need to check your permalink settings or if a security plugin is blocking the REST API.");
      return;
    }
  } catch (error) {
    console.error(`❌ Error accessing REST API: ${error.message}`);
    console.log("\nPlease check if the REST API is enabled in your WordPress installation.");
    return;
  }

  // Test authentication
  try {
    console.log(`\nTesting authentication with application password`);
    const response = await fetch(`${SITE_URL}wp-json/wp/v2/users/me`, {
      headers: {
        "Authorization": `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`,
      },
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log(`✅ Authentication successful. Logged in as: ${user.name}`);
      console.log(`User roles: ${user.roles ? user.roles.join(', ') : 'Not available'}`);
      
      // Check if user can create posts
      if (user.capabilities && user.capabilities.publish_posts) {
        console.log("✅ User has permission to create posts");
      } else {
        console.log("❌ User does NOT have permission to create posts");
        console.log("Please make sure your user has the 'publish_posts' capability (Author role or higher)");
      }
    } else {
      console.error(`❌ Authentication failed. Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log("Response:", text.substring(0, 200));
      console.log("\nPlease check your username and application password.");
      return;
    }
  } catch (error) {
    console.error(`❌ Error during authentication: ${error.message}`);
    return;
  }

  // Test creating a post
  try {
    console.log(`\nTesting post creation`);
    const response = await fetch(`${SITE_URL}wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64")}`,
      },
      body: JSON.stringify({
        title: "Test Post from API Test Script",
        content: "This is a test post to verify the WordPress REST API.",
        status: "draft",
      }),
    });
    
    if (response.ok) {
      const post = await response.json();
      console.log(`✅ Post created successfully. Post ID: ${post.id}`);
      console.log(`Post title: ${post.title.rendered}`);
      console.log(`Post status: ${post.status}`);
      console.log(`Post edit link: ${post.link}`);
    } else {
      console.error(`❌ Post creation failed. Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log("Response:", text);
      console.log("\nPlease check your user permissions and REST API configuration.");
    }
  } catch (error) {
    console.error(`❌ Error creating post: ${error.message}`);
  }
}

testWordPressApi().catch(console.error); 