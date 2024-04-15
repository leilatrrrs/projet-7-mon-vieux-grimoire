const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
    userId: {type: String, required: true},
    title: {type: String, required: true},
    author: {type: String, required: true},
    imageUrl: {type: String, required: true},
    year: {type: Number, required: true},
    genre: {type: String, required: true},
    rating :[{
        userId: {type: String, required: true},
        grade: {type: Number, required: true},
    }],
    averageRating: {type: Number, required: true},
})

//export du model terminé, 1er argument = nom du model, 2ème argument = schéma quo'n veut utiliser 
module.exports = mongoose.model('Book', bookSchema)

// On va pouvoir s'en servir pour intéragir avec mongodb
// on ne met pas de champ Id car généré automatiquement par Mongoose.

