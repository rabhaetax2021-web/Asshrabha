const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const env = {};

  envContent.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
    }
  });

  return env;
}

async function discoverWabaId(phoneId, token) {
  const response = await fetch(`https://graph.facebook.com/v17.0/${phoneId}?fields=whatsapp_business_account`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.whatsapp_business_account?.id) {
    throw new Error(JSON.stringify(data, null, 2));
  }
  return data.whatsapp_business_account.id;
}

async function fetchMetaTemplates() {
  const env = loadEnv();
  const token = env.WHATSAPP_META_TOKEN;
  const templateName = env.WHATSAPP_TEMPLATE_NAME || 'OTP';
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  let wabaId = env.WHATSAPP_WABA_ID;

  if (!token || !phoneId) {
    console.error('❌ Missing WHATSAPP_META_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env');
    process.exit(1);
  }

  if (!wabaId) {
    console.log('🔎 Discovering WABA ID from phone number ID...');
    try {
      wabaId = await discoverWabaId(phoneId, token);
      console.log('✅ Discovered WABA ID:', wabaId);
    } catch (error) {
      console.error('❌ Failed to discover WABA ID:');
      console.error(error);
      process.exit(1);
    }
  }

  console.log(`\n📱 Fetching Meta WhatsApp template: "${templateName}"...\n`);
  const endpoint = `https://graph.facebook.com/v17.0/${wabaId}/message_templates?fields=name,status,category,language,components&limit=100`;
  console.log(`🔗 API Endpoint: ${endpoint}\n`);

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Error fetching templates:');
    console.error(JSON.stringify(data, null, 2));
    process.exit(1);
  }

  if (!data.data || data.data.length === 0) {
    console.log('⚠️ No templates found on this WhatsApp Business Account.');
    process.exit(0);
  }

  const matching = data.data.filter((item) => item.name === templateName);
  if (!matching.length) {
    console.log(`⚠️ Template "${templateName}" not found on Meta account.`);
    console.log('Found templates:');
    data.data.forEach((item) => {
      console.log(`  - ${item.name} (${item.language || 'unknown'}) [${item.status}]`);
    });
    process.exit(0);
  }

  matching.forEach((template) => {
    console.log(`✅ Found template: "${template.name}"`);
    console.log('═'.repeat(100));
    console.log(`  Status: ${template.status}`);
    console.log(`  Category: ${template.category || 'N/A'}`);
    console.log(`  Language: ${template.language || 'N/A'}`);
    if (template.components && template.components.length > 0) {
      template.components.forEach((component, idx) => {
        console.log(`\n  ─ Component ${idx + 1} (${component.type})`);
        if (component.body) {
          console.log(`    Body text: ${component.body.text}`);
        }
        if (component.parameters) {
          console.log(`    Parameters: ${JSON.stringify(component.parameters, null, 2)}`);
        }
      });
    }
    console.log('\n' + '═'.repeat(100) + '\n');
  });
}

fetchMetaTemplates();
