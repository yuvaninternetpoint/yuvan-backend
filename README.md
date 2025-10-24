
Yuvan Backend - Express + lowdb (JSON) quick backend
=================================================

Files:
- server.js         : main Express server
- init_db.js        : create initial db.json with admin user
- package.json      : dependencies and scripts
- db.json           : created after running init_db.js
- README.md         : this file
- .env.example      : environment variables example

Quick start (local):
1. unzip the package
2. cd to package folder
3. npm install
4. set env variables or copy .env.example to .env and edit
5. node init_db.js
6. node server.js
7. Visit http://localhost:3000 and API at /api/...

Notes:
- This backend uses lowdb (file-based JSON) for simplicity and easy deployment.
- For production you can replace lowdb with MongoDB or PostgreSQL.
- Payment endpoint /api/pay returns a UPI intent URI and a Google Pay web fallback URL.
