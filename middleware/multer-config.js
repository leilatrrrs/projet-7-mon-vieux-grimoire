const multer = require('multer')

// Les différents types MIME pour déterminer les extensions de fichier
const MIME_TYPES = {
    'image/jpp': 'jpg',
    'image/jpeg': 'jpg', 
    'image/png': 'png',
    'image/webp': 'webp'
}

// Config de multer pour enregistrer les fichiers dans 'images'
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images') // Dossier de destination
    },
    // Génère nom de fichier unique avec extension de fichier appropriée
    filename: (req, file, callback) =>{
        const name = file.originalname.split(' ').join('_'); // remplace espace par _
        const extension = MIME_TYPES[file.mimetype]; // Détermine l'extension du fichier à partir de son type MIME
        callback(null, name + Date.now() + '.' + extension) // Génère nom du fichier
    }
})

module.exports = multer({storage: storage}).single('image')