# Root API for api.kelseywilliams.co
## Setup
### Dependencies
`docker`, `mailjet`, `postgres`, `redis`
#### mailjet
This api is setup to use mailjet to send email via mailjet's api.  A mailjet account and server with setup domain is required.  Once the account and domain are setup you will recieve and api key.  This will be placed in a docker secret later.
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

CREATE TABLE IF NOT EXISTS world_chat_messages (
    id          BIGSERIAL PRIMARY KEY,
    username    varchar(100) not null,
    content     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
```
#### Redis

If using ACLs, create a user with `del`, `setex`, `exists` and `get` permissions

### Secrets
create a secrets folder with the following structure
```
 /secrets
    ├── jwt_public.txt
    ├── jwt_private.txt
    ├── mailjet_api_key.txt
    ├── mailjet_secret.txt
    ├── postgres_readonly_secret.txt
    ├── postgres_worker_secret.txt
    └── redis_secret.txt
```
It is recommended to generate passwords for all databases with `openssl rand -hex 32`.

Add the api key to `mailjet_api_key.txt` and the private key to `mailjet_secret.txt`

#### Example
`openssl rand -hex 32 > secrets/jwt_secret.txt`

### JWT Tokens
This applicaton uses JSON web tokens with a public private RSA key pair in order to verify server authenticity.  After creating the secrets files, to generate the private key, run `openssl genrsa -out ./secrets/jwt_private.txt` and to extract the public key from the private key run `openssl rsa -in ./secrets/jwt_private -pubout -outform PEM -out jwt_public.txt`

## Run
Run with `docker-compose up`

## API Documentation
Make a call to the api by calling `https://api.kelseywilliams.co` + `/route/` + `endpoint` with the appropriate headers and request body.  Below are outlined the current available routes and their different endpoints and request and response structure.

example api call `POST https://api.kelseywilliams.co/auth/login`

Current available routes: `auth`, `chat`
### /auth/
Description: Use the /auth/ route to create and manage accounts and verify users stored within the postgres database.  Request method for all endpoints is `post`
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

Description: A call to this endpoint should always come after a call to send-code.  The user will be logged in after registering.

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

a cookie will be sent in the header under "SessionID"

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

### /chat/
Description: Use the /chat/ route to create and manage chats in the postgres database.  Request method for all endpoints is `post`
#### **new**

Description: Creates a new chat. Requires that the user be logged in

request body:
```
{
    "content": <user content>
}
```
response codes:
    
    400 Chat content is required.
    
    201 Verification code sent.
    

response body:
```
{
"id": id,
"username": username,
"content": content,
"created_at": created_at
}
```
#### **read**

Description: Returns the last 100 chats after the last seen id.
For example, setting the last seen id to 0 will return chats 1-100.
Setting the last seen id to 100 will return chats 101 to 200.

request body:
```
{
"last_seen_id": id
}
```

response body:
```
{
"chats": rows,
"count": rows.length
}
```

response codes:
    
    400 Last seen id must not be empty or negative

    200


#### **delete**

Description:  Users must be logged in or logged in as admin

response body:
```
{
    "id": id
}
```
where "id" is the numerical id of the chat to be deleted.

response codes:
    
    400 User object cannot be empty
    
    400 Message id to delete cannot be empty

    404 Chat was not found or user not logged in.
    

