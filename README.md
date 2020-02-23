# Campster
Welcome to the Airbnb of Campground sites. List and book campgrounds wherever you want affordably. 

/// LIVE DEMO ///
To see the app in action go to: 
https://app-campster.herokuapp.com/


Campster is a Node.js web application with RESTful routing

Features: 

Authentication

        User signup with username and password

        User login with username and password
Authorization:

        One cannot create new posts or view user profile without being authenticated
  
        One cannot edit or delete existing posts and comments created by other users

Functionalities of campground posts and comments:

       Create, view, edit and delete posts and comments

       Upload campground photos from local
      

Flash messages responding to users’ interaction with the app

Responsive web design

Custom Enhancements

      Embedded comment show page in single campground show page to look more user friendly

      Changed comment post and put routes to redirect back to single campground show page
      
Built with
Front-end

    Google Fonts
    CSS3
    Bootstrap 4

Back-end

    express
    mongoDB
    mongoose
    ejs
    passport
    passport-local
    passport-local-mongoose
    body-parser
    express-session
    method-override
    moment
    connect-flash
    
Deployment

    Heroku
