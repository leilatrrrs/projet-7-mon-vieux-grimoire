const Book = require('../models/Book')
const fs = require ('fs')
const sharp = require('sharp')
const jwt = require('jsonwebtoken')
const auth = require('../middleware/auth')

//Les logiques des fonctions

exports.createBook = (req, res) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book ({
     ... bookObject, 
     userId: req.auth.userId, 
     imageUrl: `${req.protocol}://${req.get('host')}/${req.imagePath}`, 
     averageRating: 0, // La note moyenne du livre est initialisé à 0
     ratings: [] // Le tableau des notes avec un tableau vide
 });
 
 // L'image est redimensionnée, convertie en webp et l'image originale supprimée
 sharp(req.file.path)
     .resize(700)
     .webp({ quality: 60 })
     .toFile(`images/${req.file.filename}.webp`, (err) => {
         if (err) {
             console.log(err);
         } else {
             console.log('Image resized and converted to webp successfully');
             fs.unlink(req.file.path, err => {
                 if (err) {
                     console.error(err);
                 } else {
                     console.log('Original image deleted successfully');
                 }
             });
         }
     });
 
    book.save() /// Le livre est enregistré dans la base de données
    .then(() => res.status(201).json({message: 'Livre enregistré'}))
    .catch(error => res.status(400).json({error}))
 }
 

 exports.modifyBook = (req, res, next) => {
    let bookObject = {};

    // Si une image est fournie via multer
    if (req.file) {
        bookObject = {
            ...JSON.parse(req.body.book),
            imageUrl: `${req.protocol}://${req.get('host')}/${req.imagePath}`, 
        };
    } else {
        // Si aucune image n'est fournie, prenez directement les informations du corps de la requête.
        bookObject = { ...req.body };
    }

    // Suppression du champ _userId du livre à mettre à jour pour éviter toute modification non autorisée.
    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé !' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ message: 'Requête non autorisée !' });
            }

            // Mise à jour du livre.
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Livre mis à jour avec succès !' })) 
                .catch(error => res.status(400).json({ erreur: error })); 
        })
        .catch(error => res.status(500).json({ erreur: error })); 
};
 

exports.deleteBook =(req, res, next) =>{
    Book.findOne({_id: req.params.id}) //trouve le livre avec l'Id fourni
   .then(book => {
    if (book.userId != req.auth.userId) { // Si Id utilisateur du livre != Id utilisateur de la requête
        res.status(403).json({message: 'Non-autorisé'})
    } else {
        const filename = book.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => { // supp l'image
            Book.deleteOne({_id: req.params.id}) // supp le livre
            .then(() => {res.status(200).json({message: 'Livre suppprimé'})})
            .catch (error => res.status(400).json({ error}))
        })
    }
   })
   .catch(error => {
        res.status(500).json({ error})
   })
}

exports.rateBook = (req, res, next) => {
    const userId = req.auth.userId;
    const grade = req.body.rating;

    if (!grade || grade < 0 || grade > 5) {
        return res.status(400).json({ message: 'Note invalide !' });
    }
    Book.findOne({ _id: req.params.id })
        .then(book => {
            const userRating = book.ratings.find(rating => rating.userId === userId);
            if (userRating) {
                return res.status(400).json({ message: 'Vous avez déjà noté ce livre !' });
            }
            book.ratings.push({ userId, grade });
            const averageRating = (book.ratings.reduce((acc, rating) => acc + rating.grade, 0) / book.ratings.length).toFixed(1);
            book.averageRating = parseFloat(averageRating); 
            return book.save();
        })
        .then(book => res.status(200).json(book))
        .catch(error => res.status(500).json({ erreur: error })); 
};


exports.getBooks =(req, res, next) => {
     Book.find()
    .then((books) => {res.status(200).json(books)})
    .catch((error) => {res.status(500).json( {error})})
}



exports.getOneBook = (req, res, next) => {
    Book.find({
        _id: req.params.id
    }).then(
        (book) => {
            res.status(200).json(book);
        }
    ).catch(
        (error) => {
            res.status(404).json({
                erreur: error 
            });
        }
    );
};
