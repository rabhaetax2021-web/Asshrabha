/**
 * Manual Template Fetch Instructions
 * 
 * Since API access is limited, here are ways to get your template:
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════════════╗
║                    📋 META WHATSAPP TEMPLATES - QUICK GUIDE                        ║
╚════════════════════════════════════════════════════════════════════════════════════╝

🔑 OPTION 1: Find your Business Account ID
─────────────────────────────────────────────
1. Go to: https://business.facebook.com
2. Go to Tools > All tools > WhatsApp Business
3. Select your WhatsApp Business Account
4. Go to "Settings" → "Account Details"
5. Copy your "Business Account ID"

Then run: node scripts/fetch-meta-templates.js --waba-id YOUR_WABA_ID

─────────────────────────────────────────────

🔗 OPTION 2: Use Meta Console Directly
─────────────────────────────────────────────
1. Go to: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/message-templates
2. Use the API Explorer:
   - Set API Version to v17.0
   - Replace {PHONE_NUMBER_ID} or {WABA_ID} with yours
   - Run GET request
   - View your templates in the response

─────────────────────────────────────────────

✏️ OPTION 3: Manual Entry
─────────────────────────────────────────────
Tell me:
1. Your template name
2. Your template body text
3. Whether it has parameters (placeholders)

I'll help you configure it in the code!

─────────────────────────────────────────────

ℹ️ Current Setup Info:
  • Phone Number ID: 1085933811277551
  • Provider: Meta
  • Current Template Key: otp_en
  • Token Status: ✅ Connected

`);
