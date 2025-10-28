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