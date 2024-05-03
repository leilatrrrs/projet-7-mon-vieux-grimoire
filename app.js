const express = require('express');// créer Application Express
const mongoose = require('mongoose') // intérargir avec mongoDB
const bookRoutes = require('./routes/book') 
const userRoutes = require('./routes/user')
const path = require('path') // manipuler les chemins de fichiers + répertoires
const cors = require('cors') // gérer les requêtes cross-origin

const app = express()

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With,x-access-token, role, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

  app.use(cors({
    credentials: true,
}));

const helmet = require('helmet') // améliore la sécurité

app.use(helmet({crossOriginResourcePolicy: false,}))


require('dotenv').config();

//logique pour se connecter à MongoDB
const mongodb_password = process.env.MONGODB_PASSWORD
const mongodb_username = process.env.MONGODB_USERNAME

mongoose.connect(`mongodb+srv://${mongodb_username}:${mongodb_password}@monvieuxgrimoirelt.rkpnn5b.mongodb.net/test?retryWrites=true&w=majority`,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));



//utilisation des routes importées

app.use('/api/books', bookRoutes)
app.use('/api/auth', userRoutes)
app.use(express.static('images'));
app.use('/images', express.static(path.join(__dirname,'images')))


module.exports = app;