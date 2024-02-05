// in auth.js

const argon2 = require("argon2"); // On importe le module argon2 pour le hachage sécurisé des mots de passe.

const hashingOptions = { // On paramètre des options de hachage
    type: argon2.argon2id, // Utilisation de l'algorithme argon2id
    memoryCost: 2 ** 16, 
    timeCost: 5,
    parallelism: 1, // Ces trois derniers éléments sont des paramètres techniques. Le coût en mémoire, le coût en temps et le nombre de processeurs parallèles utilisés.
  };
  
  const hashPassword = (req, res, next) => { // La mise en place du middleware pour le hachage du mot de passe, next nous indique que c'est un middleware 
    argon2
      .hash(req.body.password, hashingOptions) // La requête req.body.password contient le mdp en clair, que la fonction argon2.hash va traiter pour rendre sécurisé, on appelle aussi les options de hashing paramétrées précédemment. 
      .then((hashedPassword) => {
        req.body.hashedPassword = hashedPassword; // on va stocker le mot de passe haché dans la requête 
        delete req.body.password; // On supprime le mot de passe en clair
        next(); // On passe au middleware suivant 
      })
      .catch((err) => { // En cas d'erreur, on affiche un statut 500
        console.error(err);
        res.sendStatus(500);
      });
  };

module.exports = { // On exporte le middleware 
  hashPassword,
};



