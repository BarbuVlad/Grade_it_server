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

###### About the API arhitecture:
A **MVC** arhitecture is used (as described in the image below)

1. **Models** - */models* folder. Contains a class for every Database table; 
                -- every class implements the **CRUD** *methods* (can have more than one method per DB function).
                -- every class has as *attributes* the columns of the DB table that it represents.
                -- every class has a validation method (to validate any attributes/values before making a query).
                -- these classes are imported in the ***api*** routes; they serve as a bridge between the HTTP end-
                points and the MySQL database (this way the DB becomes a black-box that has these easy to understand
                functions like **Create|Read|Update|Delete**).

2. **Controllers** - */api* folder. Contains the HTTP end-points exposed to the frontend dev. (client);
                     -- every api coresponds to a table in the DB

3. **View** - not in this repository; check: ***https://github.com/BarbuVlad***
                -- it calls the HTTP links exposed by the server(API) to read/write/delete/update data 
                in a persistent and centralized way; so that a wholesome experience is assured.
                -- this *view* is an website written in ReactJS.  
