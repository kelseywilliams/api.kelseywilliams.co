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
#### /auth/
Description: Use the /auth/ route to create and manage accounts and verify users stored within the postgres database.
- **send-code**

    Description: Sends email verification code

    Method: post
    
    req:

    Body
    ```
    {
        "email":email
    }
    ```
    res:

        Status codes:
            200 Verification code sent.
    
- **register**

    Description: A call to this endpoint should always come after a call to send-code
    
    Method: post

    req:

    Body
    ```
    {
        "email":email,
        "code":code,
        "username":username,
        "password":password
    }
    ```

    res:

        Status codes:
            400 Missing email or code
            401 Invalid or expired verification code
            409 User with this username or password already exists.
            201 Account created successfully.

- **login**

    Method: post

    res:

    Body

    ```
    {
        "email":email
        "username":username
        "password":password
    }
    ```
    email or username only is accepted.

    res:

        Status codes:
            401 Invalid username or password.
            200 Successfully logged in.
        
    a cookie will be sent in the header under "SessionID".

- **user**

    Description: Use this endpoint to verify that a given user is still logged in and to retrieve their id,email, username, and role

    Method: post

    req:
    
    Include session cookie in header

    res:
        
        Status codes:
            401 This session is invalid or expired.  Please login.
            200 User verified

    Body
    ```
    {
        "id":id,
        "email":email,
        "username":username,
        "role":role
    }

    ```

- admin

    Description: Use this endpoint to verify that the user has adminstrator privileges

    Method: post

    res:
    Include session cookie in header

    res:

        Status codes:
            401 This session is invalid or expired.  Please login.
            403 Insufficient privileges.
            200 Admin role verified.
        
    Body

    ```
        {
        "id":id,
        "email":email,
        "username":username,
        "role":role
    }

    ```

- **logout**
    
    Description: logs out user out

    Method: post

    req:
        
    Include session cookie in header.
    
    res:
    
        Status codes:
            401 This session is invalid or expired.  Please login.
            204 Already loggged out.
            200 Successfully logged out.
    
- **delete**
    
    Description: deletes account.  Action can only be performed while the user is logged into their account.

    Method: post

    req:
        Include session cookie in header

    res:
    
        Status codes: 
            401 This session is invalid or expired.  Please login.
            200 Account deleted successfully.

