const Book = require('../models/Book');
const fs = require('fs')

//Controleur pour tous les livres
exports.getAllBook =async (req, res, next) => {
    try {
        const books = await Book.find(); // récupère les livres
        return res.status(200).json(books);// renvoie les livres
    }
    catch (error) {
        return res.status(500).json(error); // retourne les erreurs
    }
}

//controleur pour un livre spécifique
 exports.getOneBook = async (req, res, next) => {
    try {
        const book = await Book.findOne({ _id: req.params.id }); // Récupère le livre avec ID spécifique
        return res.status(200).json(book); // renvoie le livre
    }
    catch (error) {
        return res.status(400).json(error); // retourne les erreurs
    }
}

// Controleur pour les livres les mieux notés.
exports.getBestBooks = async (req, res, next) => {
    try {
        const bestBooks = await Book.find().sort({ averageRating: -1 }).limit(3); // Trouve les 3 livres les mieux notés
        return res.status(200).json(bestBooks); // renvoie les livres
    }
    catch (error) {
        return res.status(404).json(error); // gère les erreurs
    }
}

//Controleur pour la création de livre
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book); // parse le body de la requête en JSON
    delete bookObject._id; // supp l'ID
    delete bookObject._userId; // supp lr _userId du corps de la requête
    const book = new Book({ // Création du nouveau livre avec les données suivantes
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, 
    });
    book.save() //enregistre le livre dans database
    .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
    .catch(error => { res.status(400).json( { error })})
 };

// Controleur pour la modification de livre
exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? { //SI un fichier est fourni dans la requête
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body }; // SINON on utilise le corps de la requête tel quelle est

  delete bookObject._userId; // supp le _userId du body de la requête
      Book.findOne({_id: req.params.id}) // cherche  le livre dans la database en fonction de l'Id fournit dans les params de la requête
          .then((book) => { // Quand la recherche est réussie, fonction de rappel exécutée avec le livre trouve en argument
            if (book.userId != req.auth.userId) { // si l'Id utilisateur associé au livre != id utilisateur actuel, i lne peut pas modifier le livre
                res.status(401).json({ message: 'Not authorized' }); // il recevra un message d'erreur
            } else {

                if (req.file != undefined) { // vérifie si  un fichier est joint à la requête

                    if (req.file.size > 5000000) { // vérifie si le fichier fait moins de 5 Mo
                        return res.status(400).json({ message: "Le poids de l'image est trop volumineux" });
                    }

                    let fileNameToDelete = book.imageUrl.split('images/')[1]; // extrait le nom du ficher de l'URL de l'image du livre
                    fs.unlink(`./images/${fileNameToDelete}`, (error) => { // fs.unlik pour supp le fichier image = au livre dans le repertoire /images/
                        if (error) {
                            console.log(error, fileNameToDelete)
                        } else {
                            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id }) // MAJ le livre dans la database
                                .then(() => res.status(200).json({ message: 'Livre modifié!' }))
                                .catch(error => res.status(401).json({ error }));
                        }
                    })
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })// MAJ le livre dans la database
                        .then(() => res.status(200).json({ message: 'Livre modifié!' }))
                        .catch(error => res.status(401).json({ error }));
                }
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

// Controleur pour la suppression de livres
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


// Fonction qui calcule la moyenne des notes des livres
const calcAverage = (book) => {
    const grades = book.ratings.map(ratings => ratings.grade);// Extrait toutes les notes, parcourt le tableau 'book.ratings"avec map, créer un nouveau tableau avec les "grade" 
    const result = grades.reduce((accumulator, currentValue) => accumulator + currentValue) / grades.length; // calcul la moyenne des notes; méthode 'reduce' pour additionner toutes les notes; divise la somme par la longueur du tableau
    return result.toFixed(1); // retourne la moyenne sous forme de chaine de caractères avec 1 seule décimale avec methode 'toFixed(1)'.
}


// Controleur pour la notation des livres
exports.rateBook = async (req, res, next) => {
    try {
        if (req.body.rating > 5 || req.body.rating < 0) { // la note doit être en 0 et 5
            return res.status(400).json({ message: "Note incorrecte" });
        }
        const bookRateToUpdate = await Book.findOne({ _id: req.params.id, "ratings.userId": { $nin: req.auth.userId } });// cherche le livre a noter dans la database + vérfi que m'utilisateur n'a pas déja noté le livre

        if (bookRateToUpdate) { // vérfie si le livre a été trouvé dans la database
            bookRateToUpdate.ratings.push({ userId: req.auth.userId, grade: req.body.rating }); // ajoute nouvelle evaluation dans le tableau ratings 
            bookRateToUpdate.averageRating = calcAverage(bookRateToUpdate); // calcule la moyenne des notes
            await bookRateToUpdate.save(); // sauvegarde les modifs dans la database
            return res.status(201).json(bookRateToUpdate); // retourne une réponse (created) + maj des données 
        } else {
            return res.status(403).json({ message: "Le vote n'est pas possible" })
        }
    }
    catch (error) {
        return res.status(400).json(error);
    }
}
