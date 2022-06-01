# M7011E
## UserService

A microservice for users that have certain roles, units, and other 
information surrounding users. This microservice handles fetching, updating, and
deletion of users. It also handles encryption of passwords. For more information
on what the service is intended to do, see routes/UnitRoute.   

It is connected to a mongdoDB database. To see what is stored in the database, see 
Interface/UserInterface and Interface/RoleInterface.   

Each microservice can know whether or not it is 
healthy. For more information about what it means for this service to be healthy,
see routes/HealthRoute.