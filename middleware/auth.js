const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        //Vérifie si la demande HTTP conteint l'en-tête d'autorisation
        const token = req.headers.authorization.split(' ')[1]; // si oui divise en tableau + recup le 2nd élément du tableau 
            const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); // Verif Token
            const userId = decodedToken.userId; // Extraction de l'Id utilisateur du token
            req.auth = { // ajoute l'Id utilisateur à l'objet de requête
                userId: userId
            };
        
        next(); // Passe au middleware suivant
    } catch(error) {
        res.status(401).json({ error });
    }
};