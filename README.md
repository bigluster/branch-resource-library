# Qlik Branch
###### That's right branch.qlik.com is open source.

For better or for worse Branch contains a lot of moving parts. Before setting out on your Branch adventure you'll need to be familiar with [Qlik Sense](), [The Generic REST Connector for Qlik Sense](), [MongoDB](), [NodeJS]() and [AngularJS]()

To setup Branch you'll need the following available environments - 
* A Qlik Sense Server Environment (Sense Server)
* Access to a MongoDB instance (Database Server)
* An installation of NodeJS and bower (Web Server)

**NOTE** These environments may exist on one or many machines.

### Installing Branch
1. First things first either clone or download the project into your favourite directory.
2. Using a command line tool, navigate to the directory and install the project and it's dependencies
```
npm install
```
3. We also have some dependencies
```
bower update
```
### Setting up the database
1. Using a tool of you choice, make a connection to your MongoDB instance and create a database
2. Next you'll need an admin user and some permissions. Run the following script to create them
```

```

### Configuring the Qlik Sense Server
1. info goes here
2. 

### Configuring the Qlik Sense App
1. 

### Configuring the NodeJS application
###### So that NodeJS can talk to Qlik Sense and Mongo we'll need to tell it where they live. 
1. Start by creating a file called **config.js** in the root directory of the project and add the following -
```javascript
module.exports = {
  mongoconnectionstring: "mongodb://user:pass@host:port/database",
  mailTransport:{
    service: '',  //for example 'smtp'
    auth: {
      user: '',
      pass: ''
    }
  }
}
```
**NOTE** The mailTransport object is used when sending email notifications. If no mailTransport is specified no emails will be sent. 
We are using [Nodemailer](https://github.com/andris9/Nodemailer) for sending emails. For more information on Nodemailer and mailTransports see [here](https://github.com/andris9/Nodemailer)

2. Now create a file called **sense.json** in the **/public/configs** directory
