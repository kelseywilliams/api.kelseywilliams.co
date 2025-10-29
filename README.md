# Root API for api.kelseywilliams.co
## Setup
### Dependencies
`docker`, `mailjet`, `postgres`, `redis`
#### mailjet
This api is setup to use mailjet to send email via mailjet's api.  A mailjet account and server with setup domain is required.
#### Postgres
Initialize with a table similar to the following 
```
-- Create users table
create table if not exists users (
    id serial primary key,
    email varchar(255) unique not null,
    username varchar(100) unique not null,
    role varchar(255) not null,
    password varchar(255) not null,
    created_at timestamp with time zone default current_timestamp,
    updated_at timestamp with time zone default current_timestamp
);
```
#### Redis

If using ACLs, create a user with `del`, `setex`, `exists` and `get` permissions

### Secrets
create a secrets folder with the following structure
```
 /secrets
    ├── jwt_secret.txt
    ├── mailjet_api_key.txt
    ├── mailjet_secret.txt
    ├── postgres_readonly_secret.txt
    ├── postgres_worker_secret.txt
    └── redis_secret.txt
```
It is recommended to generate passwords for all databases and the jwt_token with `openssl rand -hex 32`.  
Store the hex within the text files with no quotes or newlines.

Add the api key to `mailjet_api_key.txt` and the private key to `mailjet_secret.txt`
#### Example
`openssl rand -hex 32 > secrets/jwt_secret.txt`
## Run
Run with `docker-compose up`

## Usage
### Endpoints
### /auth/
Description: Use the /auth/ route to create and manage accounts and verify users stored within the postgres database.
#### **send-code**

Description: Sends email verification code

request body:
```
{
    "email":email
}
```
response codes:
    
    200 Verification code sent.
    
#### **register**

Description: A call to this endpoint should always come after a call to send-code

request body:
```
{
"email":email,
"code":code,
"username":username,
"password":password
}
```

response codes:
    
    400 Missing email or code
    
    401 Invalid or expired verification code
    
    409 User with this username or password already exists.
    
    201 Account created successfully.

#### **login**
response body:
```
{
    "email":email
    "username":username
    "password":password
}
```
email || username is accepted.

response codes:
    
    401 Invalid username or password.
    
    200 Successfully logged in.
    
a cookie will be sent in the header under "SessionID".

#### **user**

Description: Use this endpoint to verify that a given user is still logged in and to retrieve their id,email, username, and role

Include session cookie in header

response codes:
    
    401 This session is invalid or expired.  Please login.
    
    200 User verified

response body:
```
{
    "id":id,
    "email":email,
    "username":username,
    "role":role
}

```

#### **admin**

Description: Use this endpoint to verify that the user has adminstrator privileges

Include session cookie in header

response codes:
        
        401 This session is invalid or expired.  Please login.
        
        403 Insufficient privileges.
        
        200 Admin role verified.
    

response body:

```
    {
    "id":id,
    "email":email,
    "username":username,
    "role":role
}

```

#### **logout**

Include session cookie in header.

response codes:
        
        401 This session is invalid or expired.  Please login.
        
        204 Already loggged out.
        
        200 Successfully logged out.

#### **delete**
    
Description: deletes account.  Action can only be performed while the user is logged into their account.

Include session cookie in header

response codes:
        
        401 This session is invalid or expired.  Please login.
        
        200 Account deleted successfully.

