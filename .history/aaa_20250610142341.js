const { GoogleAuth } = require('google-auth-library');

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: '/Users/rohitrana/tutolink-backend/config/pp.json', // Path to your service account key file
    scopes: 'https://www.googleapis.com/auth/firebase.messaging'
  });/Users/rohit/backend/tutolink-backend/config/pp.json

  const client = await auth.getClient();
  const token = await client.getAccessToken();
  console.log('Access Token:', token);
}

getAccessToken();
