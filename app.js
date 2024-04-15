const express = require('express');
const mongoose = require('mongoose')
const bookRoutes = require('./routes/book')
const userRoutes = require('./routes/user')
const path = require('path')
const app = express()
require('dotenv').config()

//logique pour se connecter à MongoDB
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_username = process.env.MONGODB_USERNAME
mongoose.connect(`mongodb+srv://${mongodb_username}:${mongodb_password}@monvieuxgrimoirelt.rkpnn5b.mongodb.net/test?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


//CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });
app.use(express.json());

//utilisation des routes importées
app.use('/api/books', bookRoutes)
app.use('/api/auth', userRoutes)
app.use('/images', express.static(path.join(__dirname,'images')))


module.exports = app;