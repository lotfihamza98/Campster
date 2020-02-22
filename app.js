var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var flash = require("connect-flash");
var methodOverride = require('method-override');
var passport = require('passport');
var localStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect('mongodb://localhost/campgrounds');
var campgroundSchema = new mongoose.Schema({
	name: String,
	price: String,
	image: String,
	description: String,
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	},
	comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

var commentSchema = new mongoose.Schema({
    text: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

var userSchema = new mongoose.Schema({
	username: String,
	password: String
});

userSchema.plugin(passportLocalMongoose);

var Campground = mongoose.model('Campground', campgroundSchema);
var Comment = mongoose.model("Comment", commentSchema);
var User = mongoose.model("User", userSchema);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public")); // IMPORTANT TO MAKE THE CSS FILE LINKED 
app.use(methodOverride('_method'));
app.use(flash());
//PASSPORT CONFIGURATION

app.use(require("express-session")({
	secret: "hamzita",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("error");
	next();
});
//routes
app.get("/", function(req, res){
	res.render('landing');
});
//index route: show all campgrounds
app.get("/campgrounds", function(req, res){
	Campground.find({}, function(err, allCampgrounds){
		if(err){
			console.log(err);
		} else {
			res.render("campgrounds", {campgrounds: allCampgrounds});
		}
	});
	
});	
// Post route: add campground to the database
app.post("/campgrounds", isLoggedIn, function(req, res){
	var campgroundName = req.body.name;
	var campgroundPrice = req.body.price;
	var campgroundImage = req.body.image;
	var campgroundDescription = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newCampground = {name: campgroundName, price: campgroundPrice, image: campgroundImage, description: campgroundDescription, author: author};
	Campground.create(newCampground, function(err, newlyCreatedCampground){
		if(err){
			console.log(err);
		} else {
			console.log(campgroundPrice);
			res.redirect('/campgrounds');
		}
	});
});
//Form route: fill in the form to add campground
app.get("/campgrounds/new", isLoggedIn, function(req, res){
	res.render("newCampground");
});

//Show route: Show specific campground

app.get("/campgrounds/:id", function(req, res){
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
		if(err){
			console.log(err);
		} else {
			res.render("show", {campground: foundCampground});
		}
	});	
});


//Comments route 
//new comment route
app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
	Campground.findById(req.params.id, function(err, campground){
		if(err){
			console.log(err);
		} else {
			res.render("newComment", {campground: campground});
		}
	});
});

//Post new comment
app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){
	var commentText = req.body.text;
	newComment = {text: commentText}
	Campground.findById(req.params.id, function(err, campground){
			if(err){
				console.log(err);
			} else {
				Comment.create(newComment, function(err, comment){
					if(err){
						console.log(err);
					} else {
						comment.author.id = req.user._id;
						comment.author.username = req.user.username;
						comment.save();
						campground.comments.push(comment);
						campground.save();
						req.flash("success", "Successfully added comment");
						res.redirect('/campgrounds/' + campground._id);
					}
				});
			}
	});
});
//Auth routes
app.get("/register", function(req, res){
	res.render("register");
});

app.post("/register", function(req, res){
	var newUser =  new User({username: req.body.username});
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			req.flash("error", err.message);
			return res.render("register");
		} else {
			passport.authenticate("local")(req, res, function(){
				req.flash("success", "Welcome to Campster " + user.username);
				res.redirect("/campgrounds");
			});
		}
	});
});
app.get("/login", function(req, res){
	res.render("login");
});
app.post("/login", passport.authenticate("local", 
	{
		successRedirect: "/campgrounds",
		failureRedirect: "/login"
	}),function(req, res){

});
app.get("/logout", function(req, res){
	req.flash("success", "Successfully logged out!");
	req.logout();

	res.redirect("/campgrounds");
});


// update route

app.get("/campgrounds/:id/edit", checkCampgroundOwnership, function(req, res){
	Campground.findById(req.params.id, function(err, foundCampground){	
		res.render('edit', {campground: foundCampground});
	});
	
});

app.put("/campgrounds/:id", checkCampgroundOwnership, function(req, res){
	 var updatedName = req.body.name;
	 var updatedPrice = req.body.price;
	 var updatedImage = req.body.image;
	 var updatedDescription = req.body.description;
	 var updatedCampground = {name: updatedName, price: updatedPrice, image: updatedImage, description: updatedDescription};
	 Campground.findByIdAndUpdate(req.params.id, updatedCampground, function(err, updatedCampground){
		if(err) {
	 		res.redirect("/campgrounds");
	 	} else {
	 		res.redirect("/campgrounds/" + req.params.id);
	 	}
	 });
});


//DESTROY ROUTE

app.delete("/campgrounds/:id", checkCampgroundOwnership, function(req, res){
	Campground.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds");
		}
	});
});


//Destroy comment route
app.delete("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("/campgrounds/" + req.params.id);
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//Middlewares

function isLoggedIn(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {
		req.flash("error", "You need to be logged in first!");
		res.redirect("/login");
	}
}

function checkCampgroundOwnership(req, res, next){
	if(req.isAuthenticated()){
		Campground.findById(req.params.id, function(err, foundCampground){
		if(err) {
			req.flash("error", "Campground not found");
			res.redirect("back");
		} else {
			if(foundCampground.author.id.equals(req.user._id)){
				next();
			} else {
				req.flash("error", "You don't have permission to do that");
				res.redirect("back");
			}
			
		}
		});
	} else {
		req.flash("error", "You need to be logged in first!");
		res.redirect("/campgrounds");
	}
};
function checkCommentOwnership(req, res, next){
	if(req.isAuthenticated()){
		Comment.findById(req.params.comment_id, function(err, foundComment){
		if(err) {
			res.redirect("back");
		} else {
			if(foundComment.author.id.equals(req.user._id)){
				next();
			} else {
				req.flash("error", "You don't have permission to do that");
				res.redirect("back");
			}
			
		}
		});
	} else {
		req.flash("error", "You need to be logged in first!");	
		res.redirect("/campgrounds");
	}
};
app.listen(3000, "0.0.0.0", function(){
	console.log("server has started");
});