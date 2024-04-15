const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({ // Définit schéma Mongoose avec 2 champs obligatoires
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userSchema.plugin(uniqueValidator); // valide automatiquement les champs uniques pdt l'intéraction avec la database

module.exports = mongoose.model('User', userSchema);