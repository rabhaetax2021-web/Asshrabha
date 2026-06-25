const fs = require('fs');
const path = require('path');

// Load env vars from .env file
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  
  return env;
}

async function fetchMetaTemplates() {
  const env = loadEnv();
  const token = env.WHATSAPP_META_TOKEN;
  const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = 'otp_en';
  
  if (!token || !phoneNumberId) {
    console.error('❌ Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    process.exit(1);
  }
  
  console.log(`📱 Fetching Meta WhatsApp template: "${templateName}"...\n`);
  
  try {
    // Try fetching specific template by name
    const endpoint = `https://graph.facebook.com/v17.0/${phoneNumberId}/message_templates?name=${templateName}`;
    console.log(`🔗 API Endpoint: ${endpoint}\n`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error fetching template:');
      console.error(JSON.stringify(data, null, 2));
      console.log('\n💡 Trying alternative endpoint with fields...\n');
      
      // Try alternative endpoint
      const altEndpoint = `https://graph.facebook.com/v17.0/${phoneNumberId}/message_templates?fields=name,status,category,language,components&name=${templateName}`;
      const altResponse = await fetch(altEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const altData = await altResponse.json();
      console.error('Alternative response:', JSON.stringify(altData, null, 2));
      process.exit(1);
    }
    
    if (!data.data || data.data.length === 0) {
      console.log(`⚠️  Template "${templateName}" not found on Meta account\n`);
      console.log('Available options:');
      console.log('1. Check Meta Business Suite for exact template name');
      console.log('2. Create the template in Meta if it doesn\'t exist yet\n');
      process.exit(0);
    }
    
    const template = data.data[0];
    console.log(`✅ Found template: "${template.name}"\n`);
    console.log('═'.repeat(100));
    console.log(`\n📋 Template Details:`);
    console.log(`  Status: ${template.status}`);
    console.log(`  Category: ${template.category || 'N/A'}`);
    console.log(`  Language: ${template.language || 'N/A'}`);
    
    if (template.components && template.components.length > 0) {
      console.log(`\n  Components:`);
      template.components.forEach((component, idx) => {
        console.log(`\n  ─ Component ${idx + 1} (${component.type}):`);
        
        if (component.body) {
          console.log(`\n    📝 Body Text:`);
          console.log(`    ${component.body.text}`);
          
          if (component.body.example) {
            console.log(`\n    📌 Example:`);
            console.log(`    ${JSON.stringify(component.body.example, null, 6)}`);
          }
        }
        
        if (component.parameters) {
          console.log(`\n    🔤 Parameters: ${JSON.stringify(component.parameters, null, 6)}`);
        }
      });
    }
    
    console.log('\n' + '═'.repeat(100));
    console.log('\n✨ Copy the body text above to use in your code!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fetchMetaTemplates();
