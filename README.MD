# NodeJS API with OCI SDK

- Install dependencies

`npm install`

- Start the NodeJS app

`npm run start`

###Supported actions

- List instances
- List shapes
- Provision instance
- Terminate instance
- Start/Stop instance

###To start the app on HTTPS with a self-signed certificate (before starting the app)

- Navigate to the `certs` folder and double-click on `certificate.pem`, in Keychain Access or the Windows Certificate Manager select 'Always Trust'

###To add a new user

- Example:
  
    curl --location --request POST 'https://localhost:3000/adduser' \
    --header 'Content-Type: application/json' \
    --data-raw '{
    "email": "christophe.pauliat@oracle.com",
    "password": "JUST#test#2021"
    }'

For now, the app is using the logged in user email with the password `JUST#test#2021`. The password is hashed in the database.