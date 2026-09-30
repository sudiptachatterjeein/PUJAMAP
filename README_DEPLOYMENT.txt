PUJAMAP26 DEPLOYMENT PACKAGE

1. Create a Supabase project.
2. Run supabase-schema.sql in Supabase SQL Editor.
3. Create a public Storage bucket named puja-photos.
4. Create an admin user in Supabase Authentication.
5. Open admin.html and replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY.
6. Upload this entire folder to GitHub.
7. Import the GitHub repository into Netlify.
8. Add Netlify environment variables:
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ADMIN_EMAIL
   ANTHROPIC_API_KEY (for AI Concierge)
9. Redeploy.

IMPORTANT:
- Never put SUPABASE_SERVICE_ROLE_KEY in GitHub or frontend files.
- The Mahalaya stream URL in index.html is still blank and must be set to an authorized stream before launch.
- Visitor code is a browser/site identifier, not a hardware/MAC address.
