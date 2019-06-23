var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {

    Genre.find()
      .sort([['name', 'ascending']])
      .exec(function (err, list_genres) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('genre_list', { title: 'Genre List', genre_list: list_genres, user: req.user});
      });
  
  };

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
              .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({ 'genre': req.params.id })
              .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books, user: req.user } );
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res, next) { 
      
    res.render('genre_form', { title: 'Create Genre', user: req.user });
  };

// Handle Genre create on POST.
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (escape) the name field.
    sanitizeBody('name').escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
   
  async.parallel({
      genre: function(callback) {
        Genre.findById(req.params.id).exec(callback)
      },
      genre_books: function(callback) {
        Book.find({ 'genre': req.params.id }).exec(callback)
      },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.genre==null) { // No results.
          res.redirect('/catalog/genres');
      }
      // Successful, so render.
      res.render('genre_delete', { title: 'Deleting Genre', genre: results.genre, genre_books: results.genre_books, user: req.user } );
  });

};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {

  async.parallel({
      genre: function(callback) {
        Genre.findById(req.body.genreid).exec(callback)
      },
      genres_books: function(callback) {
        Book.find({ 'genre': req.body.genreid }).exec(callback)
      },
  }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.genres_books.length > 0) {
          // Author has books. Render in same way as for GET route.
          res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books } );
          return;
      }
      else {
          // Author has no books. Delete object and redirect to the list of authors.
          Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
              if (err) { return next(err); }
              // Success - go to author list
              res.redirect('/catalog/genres')
          })
      }
  });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
   
    Genre.findById(req.params.id)
    .exec(function(err,results){
      if (err) { return next(err); }
      if (results.name==null) { // No results.
          var err = new Error('no genre found');
          err.status = 404;
          return next(err);
      }
      // Success.
      res.render('genre_form', { title: 'Update  Genre', genre : results, user: req.user });
     // console.log(results.books.toString());
  });
    };

// Handle Genre update on POST.
exports.genre_update_post =  [
  //validate and sanitize the field
  body('name', 'Genre name must be specified').isLength({ min: 1 }).trim(),
  sanitizeBody('book').escape(),
  // Process request after validation and sanitization.
  (req, res, next) => {

    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a BookInstance object with escaped/trimmed data and current id.
    var genre = new Genre(
      { name: req.body.name,
        _id: req.params.id
       });

    if (!errors.isEmpty()) {
        // There are errors so render the form again, passing sanitized values and errors.
        Genre.find({},'name')
            .exec(function (err, results) {
                if (err) { return next(err); }
                // Successful, so render.
                res.render('genre_form', { title: 'Update Genre', genre : results, errors: errors.array()});
        });
        return;
    }
    else {
        // Data from form is valid.
        Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
            if (err) { return next(err); }
               // Successful - redirect to detail page.
               res.redirect(thegenre.url);
            });
    }
}
];