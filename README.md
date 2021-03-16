# Grade_it_server
###### Commands:
**npm install** - install all dependencies
**npm install *-production*** - install all non-dev dependencies

**npm start** - start the server in production

**npm run dev** - start the server in development (*nodemon*)
_____________________________________________________________

Most configuration info(like passwords) is hidden in an *.env* file, which is .gitignored.
The **dotenv** module is used; configuration is imported in *index.js*: `require('dotenv/config');`

(Mysqljs has some problems when using certain mysql auth plugins, see this stackoverflow question:
https://stackoverflow.com/questions/50093144/mysql-8-0-client-does-not-support-authentication-protocol-requested-by-server)