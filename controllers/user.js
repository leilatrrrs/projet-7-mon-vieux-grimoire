const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

//création de nouveaux users

exports.signup = (req, res, next) => {
/* fonction pour hacher un mdp */
    bcrypt.hash(req.body.password, 10)
    .then(hash => {
        const user = new User ({ /* prend le mdp crypter et créé un nouveau User */
            email : req.body.email,
            password: hash
        })
        user.save() /* enregistre l'utilisateur dans la base de données */
            .then(() => res.status(201).json({message: 'Utilisateur créé !'}))
            .catch(error => res.status(400).json({error}))
        
    })
    .catch(error => res.status(500).json({error}))
};

exports.login = (req, res, next) => {
    User.findOne({email:req.body.email})
    .then(user => { // Vérification des infos
        if (!user) {
            return res.status(401).json({message: "L'identifiant ou le mot de passe est incorrecte"})
        }  
            bcrypt.compare(req.body.password, user.password)
            .then (valid => {
                if (!valid){
                    return res.status(401).json({message:"L'identifiant ou le mot de passe est incorrecte" })
                } 
                    res.status(200).json({ // Génération d'un token JWT
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id},
                            'RANDOM_TOKEN_SECRET',
                            {expiresIn: '24h'}
                        )
                    })
            })
            .catch(error => res.status(500).json({error}))
        
    })
    .catch(error =>res.status(500).json({error}))
};