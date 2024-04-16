const Book = require('../models/Book');
const fs = require('fs')

exports.getAllBook =async (req, res, next) => {
    try {
        const books = await Book.find();
        return res.status(200).json(books);
    }
    catch (error) {
        return res.status(500).json(error);
    }
}


 exports.getOneBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id });
        return res.status(200).json(book);
    }
    catch (error) {
        return res.status(400).json(error);
    }
}


exports.getBestBooks = async (req, res, next) => {
    try {
        const bestBooks = await Book.find().sort({ averageRating: -1 }).limit(3);
        return res.status(200).json(bestBooks);
    }
    catch (error) {
        return res.status(404).json(error);
    }
}

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    book.save()
    .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
 };


exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;
      Book.findOne({_id: req.params.id})
          .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {

                if (req.file != undefined) {

                    if (req.file.size > 5000000) {
                        return res.status(400).json({ message: "Le poids de l'image est trop volumineux" });
                    }

                    let filenametodelete = book.imageUrl.split('images/')[1];
                    fs.unlink(`./images/${filenametodelete}`, (error) => {
                        if (error) {
                            console.log(error, filenametodelete)
                        } else {
                            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                                .then(() => res.status(200).json({ message: 'Livre modifié!' }))
                                .catch(error => res.status(401).json({ error }));
                        }
                    })
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                        .then(() => res.status(200).json({ message: 'Objet modifié!' }))
                        .catch(error => res.status(401).json({ error }));
                }
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id }) // Trouve le livre avec l'ID fourni
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }

            if (book.userId !== req.auth.userId) { // Si l'ID utilisateur du livre ne correspond pas à l'ID utilisateur de la requête
                return res.status(403).json({ message: 'Non-autorisé' });
            }

            if (!book.imageUrl) { // Vérifie si l'URL de l'image est définie
                return res.status(400).json({ message: "L'image du livre n'est pas disponible" });
            }

            const filename = book.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, (err) => { // Supprime l'image du serveur
                if (err) {
                    return res.status(500).json({ error: "Erreur lors de la suppression de l'image" });
                }

                Book.deleteOne({ _id: req.params.id }) // Supprime le livre de la base de données
                    .then(() => {
                        res.status(200).json({ message: 'Livre supprimé' });
                    })
                    .catch(error => {
                        res.status(400).json({ error });
                    });
            });
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

const calcAverage = (book) => {
    const grades = book.ratings.map(ratings => ratings.grade);
    const result = grades.reduce((accumulator, currentValue) => accumulator + currentValue) / grades.length;
    return result.toFixed(1);
}
  exports.rateBook = async (req, res, next) => {
    try {
        if (req.body.rating > 5 || req.body.rating < 0) {
            return res.status(400).json({ message: "La note n'est pas bonne" });
        }
        const bookRateToUpdate = await Book.findOne({ _id: req.params.id, "ratings.userId": { $nin: req.auth.userId } });

        if (bookRateToUpdate) {
            bookRateToUpdate.ratings.push({ userId: req.auth.userId, grade: req.body.rating });
            bookRateToUpdate.averageRating = calcAverage(bookRateToUpdate);
            await bookRateToUpdate.save();
            return res.status(201).json(bookRateToUpdate);
        } else {
            return res.status(403).json({ message: 'vote impossible' })
        }
    }
    catch (error) {
        return res.status(400).json(error);
    }
}
